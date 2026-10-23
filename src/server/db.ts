import PrismaClientPkg from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const PrismaClient = PrismaClientPkg.PrismaClient || (PrismaClientPkg as any).default?.PrismaClient;

const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';

const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

export const prisma = new PrismaClient({ adapter });