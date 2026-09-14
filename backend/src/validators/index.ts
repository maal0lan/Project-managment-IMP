import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(1, 'Project name cannot be empty')
    .max(150, 'Project name cannot exceed 150 characters'),
  description: z.string().trim().optional().nullable(),
  status: z
    .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], {
      errorMap: () => ({ message: 'Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED' }),
    })
    .optional()
    .default('NOT_STARTED'),
  startDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid startDate format, must be a valid ISO date',
    })
    .optional()
    .nullable(),
  endDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid endDate format, must be a valid ISO date',
    })
    .optional()
    .nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  name: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(1, 'Task name cannot be empty')
    .max(150, 'Task name cannot exceed 150 characters'),
  description: z.string().trim().optional().nullable(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' }),
    })
    .optional()
    .default('MEDIUM'),
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
      errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' }),
    })
    .optional()
    .default('PENDING'),
  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid dueDate format, must be a valid ISO date',
    })
    .optional()
    .nullable(),
  projectId: z
    .string({ required_error: 'Project ID is required' })
    .uuid('Invalid project ID format'),
});

export const updateTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Task name cannot be empty')
    .max(150, 'Task name cannot exceed 150 characters')
    .optional(),
  description: z.string().trim().optional().nullable(),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' }),
    })
    .optional(),
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
      errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' }),
    })
    .optional(),
  dueDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid dueDate format, must be a valid ISO date',
    })
    .optional()
    .nullable(),
  projectId: z.string().uuid('Invalid project ID format').optional(),
});
