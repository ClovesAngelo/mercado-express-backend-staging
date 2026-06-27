import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Creates a mock PrismaService with all models available as jest.fn().
 * Only the models/functions needed for a specific test should be mocked.
 */
export function createMockPrismaService(overrides?: Partial<PrismaService>): jest.Mocked<PrismaService> {
  const defaultMock = {
    $transaction: jest.fn((fn: any) => fn(defaultMock)) as any,
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    market: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    productImage: {
      findMany: jest.fn(),
    },
  } as any;

  return Object.assign(defaultMock, overrides || {}) as jest.Mocked<PrismaService>;
}

/**
 * Helper to create a transaction proxy that delegates to the same mock methods.
 */
export function createTxMock(prisma: jest.Mocked<PrismaService>): jest.Mocked<PrismaService> {
  const tx = { ...prisma };
  return tx;
}