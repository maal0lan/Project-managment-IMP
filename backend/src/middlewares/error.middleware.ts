import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // Handle Prisma unique constraint errors
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[]) || [];
    res.status(409).json({
      success: false,
      message: `A record with this ${target.join(', ')} already exists`,
    });
    return;
  }

  // Handle Prisma not found errors
  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
    return;
  }

  // General server error
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
