/**
 * Test data factories for auth-related tests.
 * These are simple factory functions, not complex mocks.
 */

export function makeUser(overrides?: Partial<{
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  marketId: string | null;
}>) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$hashedpassword',
    role: 'CLIENTE',
    marketId: null,
    ...overrides,
  };
}

export function makeLoginDto(overrides?: Partial<{ email: string; password: string }>) {
  return {
    email: 'test@example.com',
    password: 'correct-password',
    ...overrides,
  };
}

export function makeRegisterDto(overrides?: Partial<{
  email: string;
  name: string;
  password: string;
  role: string;
}>) {
  return {
    email: 'newuser@example.com',
    name: 'New User',
    password: 'password123',
    role: 'CLIENTE',
    ...overrides,
  };
}

export function makeJwtPayload(overrides?: Partial<{
  email: string;
  sub: string;
  role: string;
  marketId: string | null;
}>) {
  return {
    email: 'test@example.com',
    sub: 'user-123',
    role: 'CLIENTE',
    marketId: null,
    ...overrides,
  };
}