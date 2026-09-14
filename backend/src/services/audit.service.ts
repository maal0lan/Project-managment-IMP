import prisma from '../config/prisma';

export interface CreateAuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: any;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          details: params.details ? JSON.stringify(params.details) : null,
        },
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }

  static async getUserLogs(userId: string, limit = 20) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    });
  }
}
