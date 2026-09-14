import prisma from '../config/prisma';

export class DashboardService {
  static async getStats(userId: string) {
    const [
      totalProjects,
      projectsInProgress,
      projectsNotStarted,
      projectsCompleted,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      recentProjects,
      recentTasks,
    ] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { userId, status: 'NOT_STARTED' } }),
      prisma.project.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.task.count({ where: { userId, status: 'PENDING' } }),
      prisma.task.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { userId, priority: 'HIGH' } }),
      prisma.task.count({ where: { userId, priority: 'MEDIUM' } }),
      prisma.task.count({ where: { userId, priority: 'LOW' } }),
      prisma.project.findMany({
        where: { userId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { tasks: true } },
        },
      }),
      prisma.task.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const projectCompletionRate =
      totalProjects > 0 ? Math.round((projectsCompleted / totalProjects) * 100) : 0;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
      breakdown: {
        projects: {
          notStarted: projectsNotStarted,
          inProgress: projectsInProgress,
          completed: projectsCompleted,
          completionRate: projectCompletionRate,
        },
        tasks: {
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          completionRate: taskCompletionRate,
          priority: {
            high: highPriorityTasks,
            medium: mediumPriorityTasks,
            low: lowPriorityTasks,
          },
        },
      },
      recentProjects,
      recentTasks,
    };
  }
}
