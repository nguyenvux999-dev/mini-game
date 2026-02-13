// src/config/database.ts
// Prisma Client singleton

import { PrismaClient } from '@prisma/client';

// Declare global type for prisma in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma Client singleton instance
 * In development, we store the client in global to prevent
 * multiple instances due to hot reloading
 */
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📤 Database disconnected');
}

export default prisma;
