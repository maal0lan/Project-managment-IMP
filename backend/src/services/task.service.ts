import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuditService } from './audit.service';
import { TaskStatus, TaskPriority, Prisma } from '@prisma/client';

export interface TaskQueryParams {
  search?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TaskService {
  static async createTask(
    userId: string,
    data: {
      name: string;
      description?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: string | null;
      projectId: string;
    }
  ) {
    // Verify project exists and belongs to this user
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new AppError('Associated project not found.', 404);
    }

    if (project.userId !== userId) {
      throw new AppError('Access denied. You do not own the specified project.', 403);
    }

    const task = await prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        priority: data.priority || TaskPriority.MEDIUM,
        status: data.status || TaskStatus.PENDING,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        userId,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.log({
      userId,
      action: 'CREATE_TASK',
      entity: 'TASK',
      entityId: task.id,
      details: { name: task.name, priority: task.priority, status: task.status },
    });

    return task;
  }

  static async getTasks(userId: string, params: TaskQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      userId,
    };

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.search && params.search.trim()) {
      where.name = {
        contains: params.search.trim(),
        mode: 'insensitive',
      };
    }

    if (params.status && Object.values(TaskStatus).includes(params.status as TaskStatus)) {
      where.status = params.status as TaskStatus;
    }

    if (params.priority && Object.values(TaskPriority).includes(params.priority as TaskPriority)) {
      where.priority = params.priority as TaskPriority;
    }

    const allowedSortFields = ['createdAt', 'dueDate', 'name', 'priority', 'status'];
    const sortBy = allowedSortFields.includes(params.sortBy || '') ? params.sortBy! : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: { id: true, name: true, status: true },
          },
        },
      }),
    ]);

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTaskById(userId: string, taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    if (task.userId !== userId) {
      throw new AppError('Access denied. You do not have permission to view this task.', 403);
    }

    return task;
  }

  static async updateTask(
    userId: string,
    taskId: string,
    data: {
      name?: string;
      description?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: string | null;
      projectId?: string;
    }
  ) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new AppError('Task not found.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('Access denied. You do not have permission to modify this task.', 403);
    }

    // If changing project, ensure target project is owned by user
    if (data.projectId && data.projectId !== existing.projectId) {
      const targetProject = await prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!targetProject || targetProject.userId !== userId) {
        throw new AppError('Target project not found or does not belong to you.', 403);
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    await AuditService.log({
      userId,
      action: 'UPDATE_TASK',
      entity: 'TASK',
      entityId: taskId,
      details: data,
    });

    return updated;
  }

  static async deleteTask(userId: string, taskId: string) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new AppError('Task not found.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('Access denied. You do not have permission to delete this task.', 403);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await AuditService.log({
      userId,
      action: 'DELETE_TASK',
      entity: 'TASK',
      entityId: taskId,
      details: { name: existing.name },
    });

    return { message: 'Task deleted successfully.' };
  }
}
