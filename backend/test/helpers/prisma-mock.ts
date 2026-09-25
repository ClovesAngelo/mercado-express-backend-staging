import { PrismaService } from '../../src/prisma/prisma.service';

export interface PrismaModelMock {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  updateMany: jest.Mock;
  upsert: jest.Mock;
  createMany: jest.Mock;
  count: jest.Mock;
}

export interface MockedPrismaService {
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  user: PrismaModelMock;
  market: PrismaModelMock;
  product: PrismaModelMock;
  category: PrismaModelMock;
  cart: PrismaModelMock;
  cartItem: PrismaModelMock;
  order: PrismaModelMock;
  orderItem: PrismaModelMock;
  auditLog: PrismaModelMock;
  productImage: PrismaModelMock;
  notification: PrismaModelMock;
}

const jestFn = (): jest.Mock => jest.fn();

function createModelMock(): PrismaModelMock {
  return {
    findUnique: jestFn(),
    findFirst: jestFn(),
    findMany: jestFn(),
    create: jestFn(),
    update: jestFn(),
    delete: jestFn(),
    updateMany: jestFn(),
    upsert: jestFn(),
    createMany: jestFn(),
    count: jestFn(),
  };
}

/**
 * Creates a mock PrismaService with all models available as jest.fn().
 * Only the models/functions needed for a specific test should be mocked.
 */
export function createMockPrismaService(): MockedPrismaService {
  const defaultMock: MockedPrismaService = {
    $transaction: jest.fn((fn: (tx: MockedPrismaService) => unknown) =>
      fn(defaultMock),
    ),
    $connect: jestFn(),
    $disconnect: jestFn(),
    user: createModelMock(),
    market: createModelMock(),
    product: createModelMock(),
    category: createModelMock(),
    cart: createModelMock(),
    cartItem: createModelMock(),
    order: createModelMock(),
    orderItem: createModelMock(),
    auditLog: createModelMock(),
    productImage: createModelMock(),
    notification: createModelMock(),
  };

  return defaultMock;
}

/**
 * Helper to create a transaction proxy that delegates to the same mock methods.
 */
export function createTxMock(
  prisma: MockedPrismaService,
): MockedPrismaService {
  return { ...prisma };
}

// Keeps the type import used by consumers of this module in sync with PrismaService
export type { PrismaService };
