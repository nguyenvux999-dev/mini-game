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
 * 
 * Production: Limit connection pool for Supabase free tier + Render free tier
 */
const isProd = process.env.NODE_ENV === 'production';

// Build datasource URL with connection pool params for production
function getDatasourceUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  if (!isProd) return baseUrl;
  
  // Add connection pool params if not already present
  const separator = baseUrl.includes('?') ? '&' : '?';
  const params = [
    'connection_limit=5',     // Limit connections (Render free = 512MB)
    'pool_timeout=30',        // Wait up to 30s for a connection
    'connect_timeout=30',     // Connection timeout 30s
  ];
  return `${baseUrl}${separator}${params.join('&')}`;
}

export const prisma = global.prisma || new PrismaClient({
  log: isProd ? ['error'] : ['query', 'info', 'warn', 'error'],
  datasourceUrl: getDatasourceUrl(),
});

if (!isProd) {
  global.prisma = prisma;
}

/**
 * Connect to database with retry logic
 */
export async function connectDatabase(retries = 5, delay = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error);
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All database connection attempts failed');
        process.exit(1);
      }
    }
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
