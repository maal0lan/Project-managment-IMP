import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { AuditService } from './audit.service';

export class AuthService {
  static generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ id: userId, email, role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }

  static async register(data: { fullName: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    await AuditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email },
    });

    return { user, token };
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email address or password.', 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email address or password.', 401);
    }

    const token = this.generateToken(user.id, user.email, user.role);

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGGED_IN',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }
}
