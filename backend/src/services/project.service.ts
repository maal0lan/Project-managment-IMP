import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuditService } from './audit.service';
import { ProjectStatus, Prisma } from '@prisma/client';

export interface ProjectQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProjectService {
  static async createProject(
    userId: string,
    data: {
      name: string;
      description?: string | null;
      status?: ProjectStatus;
      startDate?: string | null;
      endDate?: string | null;
    }
  ) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || ProjectStatus.NOT_STARTED,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        userId,
      },
    });

    await AuditService.log({
      userId,
      action: 'CREATE_PROJECT',
      entity: 'PROJECT',
      entityId: project.id,
      details: { name: project.name, status: project.status },
    });

    return project;
  }

  static async getProjects(userId: string, params: ProjectQueryParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      userId,
    };

    if (params.search && params.search.trim()) {
      where.name = {
        contains: params.search.trim(),
        mode: 'insensitive',
      };
    }

    if (params.status && Object.values(ProjectStatus).includes(params.status as ProjectStatus)) {
      where.status = params.status as ProjectStatus;
    }

    const allowedSortFields = ['createdAt', 'name', 'status', 'startDate', 'endDate'];
    const sortBy = allowedSortFields.includes(params.sortBy || '') ? params.sortBy! : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { tasks: true },
          },
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Enhance project stats
    const enriched = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const { tasks, ...rest } = p;
      return {
        ...rest,
        stats: {
          totalTasks,
          completedTasks,
          progress,
        },
      };
    });

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProjectById(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    if (project.userId !== userId) {
      throw new AppError('Access denied. You do not have permission to view this project.', 403);
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...project,
      stats: {
        totalTasks,
        completedTasks,
        progress,
      },
    };
  }

  static async updateProject(
    userId: string,
    projectId: string,
    data: {
      name?: string;
      description?: string | null;
      status?: ProjectStatus;
      startDate?: string | null;
      endDate?: string | null;
    }
  ) {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw new AppError('Project not found.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('Access denied. You do not have permission to modify this project.', 403);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
    });

    await AuditService.log({
      userId,
      action: 'UPDATE_PROJECT',
      entity: 'PROJECT',
      entityId: projectId,
      details: data,
    });

    return updated;
  }

  static async deleteProject(userId: string, projectId: string) {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw new AppError('Project not found.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('Access denied. You do not have permission to delete this project.', 403);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    await AuditService.log({
      userId,
      action: 'DELETE_PROJECT',
      entity: 'PROJECT',
      entityId: projectId,
      details: { name: existing.name },
    });

    return { message: 'Project and all associated tasks deleted successfully.' };
  }
}
