export type Role = 'USER' | 'ADMIN';

export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  stats?: ProjectStats;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    status?: ProjectStatus;
  };
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
  breakdown: {
    projects: {
      notStarted: number;
      inProgress: number;
      completed: number;
      completionRate: number;
    };
    tasks: {
      pending: number;
      inProgress: number;
      completed: number;
      completionRate: number;
      priority: {
        high: number;
        medium: number;
        low: number;
      };
    };
  };
  recentProjects: Project[];
  recentTasks: Task[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
  errors?: Array<{ field: string; message: string }>;
}
