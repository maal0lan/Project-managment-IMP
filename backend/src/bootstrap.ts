import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from './config/prisma';

const demoAccounts = [
  {
    fullName: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'Password123!',
    role: Role.USER,
  },
  {
    fullName: 'Sarah Administrator',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: Role.ADMIN,
  },
] as const;

export async function ensureDemoAccounts(): Promise<void> {
  for (const account of demoAccounts) {
    const passwordHash = await bcrypt.hash(account.password, 10);

    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        fullName: account.fullName,
        role: account.role,
      },
      create: {
        fullName: account.fullName,
        email: account.email,
        passwordHash,
        role: account.role,
      },
    });
  }

  console.log('Demo user and admin accounts are ready.');
}