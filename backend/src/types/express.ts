import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  marketId?: string | null;
}

declare global {
  namespace Express {
    interface User {
      id: string;
      /** `sub` do payload JWT (compatibilidade com tokens antigos). */
      sub?: string;
      email: string;
      name?: string | null;
      role: UserRole;
      marketId?: string | null;
    }
  }
}

export {};
