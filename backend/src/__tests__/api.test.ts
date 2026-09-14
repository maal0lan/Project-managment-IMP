import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';

let userAToken: string;
let userBToken: string;
let userAId: string;
let userBId: string;
let userAProjectId: string;
let userATaskId: string;

beforeAll(async () => {
  // Clear any existing test data
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Register User A
  const resA = await request(app).post('/api/auth/register').send({
    fullName: 'Test User A',
    email: 'user_a@test.com',
    password: 'Password123!',
  });
  expect(resA.status).toBe(201);
  userAToken = resA.body.data.token;
  userAId = resA.body.data.user.id;

  // Register User B
  const resB = await request(app).post('/api/auth/register').send({
    fullName: 'Test User B',
    email: 'user_b@test.com',
    password: 'Password123!',
  });
  expect(resB.status).toBe(201);
  userBToken = resB.body.data.token;
  userBId = resB.body.data.user.id;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('1. Authentication Endpoints', () => {
  it('should reject registration with an existing email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Duplicate Alice',
      email: 'user_a@test.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Bad Email',
      email: 'invalid-email-string',
      password: 'Password123!',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully log in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user_a@test.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('user_a@test.com');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'user_a@test.com',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should get current authenticated user profile (/api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(userAId);
    expect(res.body.data.email).toBe('user_a@test.com');
    // Ensure password hash is not exposed
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('should reject access to protected endpoint without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('2. Project Management Endpoints & Ownership Security', () => {
  it('should create a project for User A', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Alpha Project',
        description: 'First test project',
        status: 'IN_PROGRESS',
        startDate: '2026-09-01T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Alpha Project');
    expect(res.body.data.status).toBe('IN_PROGRESS');
    userAProjectId = res.body.data.id;
  });

  it('should validate required project name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: '',
        description: 'Empty name test',
      });
    expect(res.status).toBe(400);
  });

  it('should get all projects for User A', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('should search projects by name', async () => {
    const res = await request(app)
      .get('/api/projects?search=Alpha')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('should isolate data: User B cannot view User A project', async () => {
    const res = await request(app)
      .get(`/api/projects/${userAProjectId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(res.status).toBe(403);
  });

  it('should isolate data: User B cannot modify User A project', async () => {
    const res = await request(app)
      .put(`/api/projects/${userAProjectId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Hacked Name' });
    expect(res.status).toBe(403);
  });

  it('should update project details for User A', async () => {
    const res = await request(app)
      .put(`/api/projects/${userAProjectId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Alpha Project Updated',
        status: 'COMPLETED',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Alpha Project Updated');
    expect(res.body.data.status).toBe('COMPLETED');
  });
});

describe('3. Task Management Endpoints & Ownership Security', () => {
  it('should create a task under User A project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Task 1: Design DB',
        description: 'Relational design with foreign keys',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: '2026-10-01T00:00:00.000Z',
        projectId: userAProjectId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Task 1: Design DB');
    expect(res.body.data.priority).toBe('HIGH');
    userATaskId = res.body.data.id;
  });

  it('should prevent User B from creating task in User A project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        name: 'Malicious Task',
        projectId: userAProjectId,
      });
    expect(res.status).toBe(403);
  });

  it('should filter tasks by priority and status', async () => {
    const res = await request(app)
      .get('/api/tasks?priority=HIGH&status=PENDING')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(userATaskId);
  });

  it('should isolate data: User B cannot modify User A task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(403);
  });

  it('should allow User A to mark task as COMPLETED', async () => {
    const res = await request(app)
      .put(`/api/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });
});

describe('4. Dashboard Metrics Endpoint', () => {
  it('should return aggregated stats for User A', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalProjects).toBe(1);
    expect(res.body.data.totalTasks).toBe(1);
    expect(res.body.data.completedTasks).toBe(1);
  });

  it('should return zero metrics for User B who has no projects yet', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProjects).toBe(0);
    expect(res.body.data.totalTasks).toBe(0);
  });
});

describe('5. Cascade Deletion', () => {
  it('should delete project and cascade delete all its tasks', async () => {
    const res = await request(app)
      .delete(`/api/projects/${userAProjectId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(200);

    // Verify task is also gone
    const checkTask = await prisma.task.findUnique({
      where: { id: userATaskId },
    });
    expect(checkTask).toBeNull();
  });
});
