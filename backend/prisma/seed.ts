import { PrismaClient, ProjectStatus, TaskPriority, TaskStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);

  // 1. Create Demo Users
  const userAlice = await prisma.user.create({
    data: {
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash,
      role: Role.USER,
    },
  });

  const userAdmin = await prisma.user.create({
    data: {
      fullName: 'Sarah Administrator',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Created users: ${userAlice.email}, ${userAdmin.email}`);

  // 2. Create Projects for Alice
  const project1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Mobile App',
      description: 'Native iOS and Android application with Cart, Checkout, and Stripe integration.',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-11-30'),
      userId: userAlice.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Cloud Infrastructure Modernization',
      description: 'Migrate on-premise Kubernetes clusters to AWS EKS with Terraform.',
      status: ProjectStatus.NOT_STARTED,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-12-15'),
      userId: userAlice.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Q3 Security & Compliance Audit',
      description: 'Comprehensive SOC2 compliance review and penetration testing.',
      status: ProjectStatus.COMPLETED,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-08-30'),
      userId: userAlice.id,
    },
  });

  console.log('Created demo projects');

  // 3. Create Tasks for Project 1
  await prisma.task.createMany({
    data: [
      {
        name: 'Design Figma UI Mockups',
        description: 'Complete high-fidelity mockups for cart and checkout flows.',
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        dueDate: new Date('2026-08-15'),
        projectId: project1.id,
        userId: userAlice.id,
      },
      {
        name: 'Implement Stripe Checkout API',
        description: 'Integrate Stripe Payment Intents and webhook listeners for order events.',
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date('2026-09-25'),
        projectId: project1.id,
        userId: userAlice.id,
      },
      {
        name: 'Set up Push Notification Service',
        description: 'Configure Firebase Cloud Messaging for iOS and Android notifications.',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-10-10'),
        projectId: project1.id,
        userId: userAlice.id,
      },
      {
        name: 'App Store Submission Prep',
        description: 'Prepare screenshots, privacy policy, and developer account assets.',
        priority: TaskPriority.LOW,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-11-20'),
        projectId: project1.id,
        userId: userAlice.id,
      },
    ],
  });

  // Tasks for Project 2
  await prisma.task.createMany({
    data: [
      {
        name: 'Write Terraform Modules',
        description: 'Define VPC, subnets, NAT gateways, and security groups.',
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-10-15'),
        projectId: project2.id,
        userId: userAlice.id,
      },
      {
        name: 'Containerize Backend Microservices',
        description: 'Write multi-stage Dockerfiles and publish images to AWS ECR.',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-10-28'),
        projectId: project2.id,
        userId: userAlice.id,
      },
    ],
  });

  // Tasks for Project 3
  await prisma.task.createMany({
    data: [
      {
        name: 'Penetration Testing Review',
        description: 'Perform static code analysis and dynamic testing on all public APIs.',
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        dueDate: new Date('2026-08-20'),
        projectId: project3.id,
        userId: userAlice.id,
      },
      {
        name: 'Document Remediation Report',
        description: 'Submit final report and remediate low-severity CVE findings.',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.COMPLETED,
        dueDate: new Date('2026-08-28'),
        projectId: project3.id,
        userId: userAlice.id,
      },
    ],
  });

  console.log('Created demo tasks');

  // 4. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: userAlice.id,
        action: 'USER_REGISTERED',
        entity: 'USER',
        entityId: userAlice.id,
        details: JSON.stringify({ email: userAlice.email }),
      },
      {
        userId: userAlice.id,
        action: 'CREATE_PROJECT',
        entity: 'PROJECT',
        entityId: project1.id,
        details: JSON.stringify({ name: project1.name }),
      },
      {
        userId: userAlice.id,
        action: 'CREATE_PROJECT',
        entity: 'PROJECT',
        entityId: project2.id,
        details: JSON.stringify({ name: project2.name }),
      },
    ],
  });

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
