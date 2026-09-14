import { Project, Task, DashboardStats, AuditLog } from '../types';

const STORAGE_KEY_PROJECTS = 'projectflow_local_projects';
const STORAGE_KEY_TASKS = 'projectflow_local_tasks';
const STORAGE_KEY_LOGS = 'projectflow_local_logs';

// Default initial demo dataset
const defaultProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-Commerce Mobile App',
    description: 'Native iOS and Android application with Cart, Checkout, and Stripe integration.',
    status: 'IN_PROGRESS',
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    userId: 'demo-user-alice-uuid',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'proj-2',
    name: 'Cloud Infrastructure Modernization',
    description: 'Migrate on-premise Kubernetes clusters to AWS EKS with Terraform.',
    status: 'NOT_STARTED',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-12-15T00:00:00.000Z',
    userId: 'demo-user-alice-uuid',
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: '2026-08-15T12:00:00.000Z',
  },
  {
    id: 'proj-3',
    name: 'Q3 Security & Compliance Audit',
    description: 'Comprehensive SOC2 compliance review and penetration testing.',
    status: 'COMPLETED',
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-08-30T00:00:00.000Z',
    userId: 'demo-user-alice-uuid',
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-08-30T17:00:00.000Z',
  },
];

const defaultTasks: Task[] = [
  {
    id: 'task-1',
    name: 'Design Figma UI Mockups',
    description: 'Complete high-fidelity mockups for cart and checkout flows.',
    priority: 'HIGH',
    status: 'COMPLETED',
    dueDate: '2026-08-15T00:00:00.000Z',
    projectId: 'proj-1',
    userId: 'demo-user-alice-uuid',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-15T14:00:00.000Z',
  },
  {
    id: 'task-2',
    name: 'Implement Stripe Checkout API',
    description: 'Integrate Stripe Payment Intents and webhook listeners for order events.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2026-09-25T00:00:00.000Z',
    projectId: 'proj-1',
    userId: 'demo-user-alice-uuid',
    createdAt: '2026-08-10T11:00:00.000Z',
    updatedAt: '2026-08-10T11:00:00.000Z',
  },
  {
    id: 'task-3',
    name: 'Set up Push Notification Service',
    description: 'Configure Firebase Cloud Messaging for iOS and Android notifications.',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '2026-10-10T00:00:00.000Z',
    projectId: 'proj-1',
    userId: 'demo-user-alice-uuid',
    createdAt: '2026-08-12T15:00:00.000Z',
    updatedAt: '2026-08-12T15:00:00.000Z',
  },
  {
    id: 'task-4',
    name: 'Write Terraform Modules',
    description: 'Define VPC, subnets, NAT gateways, and security groups.',
    priority: 'HIGH',
    status: 'PENDING',
    dueDate: '2026-10-15T00:00:00.000Z',
    projectId: 'proj-2',
    userId: 'demo-user-alice-uuid',
    createdAt: '2026-08-16T16:00:00.000Z',
    updatedAt: '2026-08-16T16:00:00.000Z',
  },
];

const defaultLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'demo-user-alice-uuid',
    action: 'CREATE_PROJECT',
    entity: 'PROJECT',
    entityId: 'proj-1',
    details: '{"name":"E-Commerce Mobile App"}',
    createdAt: '2026-08-01T10:00:00.000Z',
  },
];

function getStoredProjects(): Project[] {
  const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(defaultProjects));
    return defaultProjects;
  }
  return JSON.parse(data);
}

function saveStoredProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
}

function getStoredTasks(): Task[] {
  const data = localStorage.getItem(STORAGE_KEY_TASKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(defaultTasks));
    return defaultTasks;
  }
  return JSON.parse(data);
}

function saveStoredTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

function getStoredLogs(): AuditLog[] {
  const data = localStorage.getItem(STORAGE_KEY_LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(defaultLogs));
    return defaultLogs;
  }
  return JSON.parse(data);
}

function saveStoredLogs(logs: AuditLog[]) {
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
}

function logAudit(action: string, entity: string, entityId: string, details?: any) {
  const logs = getStoredLogs();
  const newLog: AuditLog = {
    id: 'log-' + Date.now(),
    userId: 'current-user',
    action,
    entity,
    entityId,
    details: details ? JSON.stringify(details) : null,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog);
  saveStoredLogs(logs.slice(0, 50));
}

export const dataStore = {
  // Projects
  getProjects(params?: { search?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    let list = [...getStoredProjects()];
    const tasks = getStoredTasks();

    if (params?.search?.trim()) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((p) => p.status === params.status);
    }

    // Attach computed stats
    const enriched = list.map((p) => {
      const projectTasks = tasks.filter((t) => t.projectId === p.id);
      const completed = projectTasks.filter((t) => t.status === 'COMPLETED').length;
      const total = projectTasks.length;
      return {
        ...p,
        stats: {
          totalTasks: total,
          completedTasks: completed,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      };
    });

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const total = enriched.length;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  getProjectById(id: string) {
    const list = getStoredProjects();
    const project = list.find((p) => p.id === id);
    if (!project) throw new Error('Project not found');

    const tasks = getStoredTasks().filter((t) => t.projectId === id);
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const total = tasks.length;

    return {
      ...project,
      tasks,
      stats: {
        totalTasks: total,
        completedTasks: completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  },

  createProject(data: Partial<Project>) {
    const list = getStoredProjects();
    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name: data.name!,
      description: data.description || null,
      status: data.status || 'NOT_STARTED',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      userId: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: { totalTasks: 0, completedTasks: 0, progress: 0 },
    };
    list.unshift(newProject);
    saveStoredProjects(list);
    logAudit('CREATE_PROJECT', 'PROJECT', newProject.id, { name: newProject.name });
    return newProject;
  },

  updateProject(id: string, data: Partial<Project>) {
    const list = getStoredProjects();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Project not found');

    list[idx] = {
      ...list[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveStoredProjects(list);
    logAudit('UPDATE_PROJECT', 'PROJECT', id, data);
    return list[idx];
  },

  deleteProject(id: string) {
    const list = getStoredProjects();
    const filtered = list.filter((p) => p.id !== id);
    saveStoredProjects(filtered);

    // Cascade delete tasks
    const tasks = getStoredTasks().filter((t) => t.projectId !== id);
    saveStoredTasks(tasks);

    logAudit('DELETE_PROJECT', 'PROJECT', id);
    return { success: true };
  },

  // Tasks
  getTasks(params?: { search?: string; status?: string; priority?: string; projectId?: string; page?: number; limit?: number }) {
    let list = [...getStoredTasks()];
    const projects = getStoredProjects();

    if (params?.search?.trim()) {
      const q = params.search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((t) => t.status === params.status);
    }

    if (params?.priority && params.priority !== 'ALL') {
      list = list.filter((t) => t.priority === params.priority);
    }

    if (params?.projectId && params.projectId !== 'ALL') {
      list = list.filter((t) => t.projectId === params.projectId);
    }

    const enriched = list.map((t) => ({
      ...t,
      project: projects.find((p) => p.id === t.projectId) ? {
        id: t.projectId,
        name: projects.find((p) => p.id === t.projectId)!.name,
      } : undefined,
    }));

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const total = enriched.length;
    const paginated = enriched.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  createTask(data: Partial<Task>) {
    const list = getStoredTasks();
    const projects = getStoredProjects();
    const newTask: Task = {
      id: 'task-' + Date.now(),
      name: data.name!,
      description: data.description || null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'PENDING',
      dueDate: data.dueDate || null,
      projectId: data.projectId!,
      userId: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: projects.find((p) => p.id === data.projectId) ? {
        id: data.projectId!,
        name: projects.find((p) => p.id === data.projectId)!.name,
      } : undefined,
    };
    list.unshift(newTask);
    saveStoredTasks(list);
    logAudit('CREATE_TASK', 'TASK', newTask.id, { name: newTask.name });
    return newTask;
  },

  updateTask(id: string, data: Partial<Task>) {
    const list = getStoredTasks();
    const projects = getStoredProjects();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Task not found');

    list[idx] = {
      ...list[idx],
      ...data,
      updatedAt: new Date().toISOString(),
      project: projects.find((p) => p.id === (data.projectId || list[idx].projectId)) ? {
        id: data.projectId || list[idx].projectId,
        name: projects.find((p) => p.id === (data.projectId || list[idx].projectId))!.name,
      } : list[idx].project,
    };
    saveStoredTasks(list);
    logAudit('UPDATE_TASK', 'TASK', id, data);
    return list[idx];
  },

  deleteTask(id: string) {
    const list = getStoredTasks();
    const filtered = list.filter((t) => t.id !== id);
    saveStoredTasks(filtered);
    logAudit('DELETE_TASK', 'TASK', id);
    return { success: true };
  },

  // Dashboard stats
  getDashboardStats(): DashboardStats {
    const projects = getStoredProjects();
    const tasks = getStoredTasks();

    const totalProjects = projects.length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
    const inProgressProjects = projects.filter((p) => p.status === 'IN_PROGRESS').length;
    const notStartedProjects = projects.filter((p) => p.status === 'NOT_STARTED').length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

    const high = tasks.filter((t) => t.priority === 'HIGH').length;
    const medium = tasks.filter((t) => t.priority === 'MEDIUM').length;
    const low = tasks.filter((t) => t.priority === 'LOW').length;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress: inProgressProjects,
      breakdown: {
        projects: {
          notStarted: notStartedProjects,
          inProgress: inProgressProjects,
          completed: completedProjects,
          completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
        },
        tasks: {
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          priority: { high, medium, low },
        },
      },
      recentProjects: projects.slice(0, 5),
      recentTasks: tasks.slice(0, 5).map((t) => ({
        ...t,
        project: projects.find((p) => p.id === t.projectId) ? {
          id: t.projectId,
          name: projects.find((p) => p.id === t.projectId)!.name,
        } : undefined,
      })),
    };
  },

  getAuditLogs(): AuditLog[] {
    return getStoredLogs();
  },
};
