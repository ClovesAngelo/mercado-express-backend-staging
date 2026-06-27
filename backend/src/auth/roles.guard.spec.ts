import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { MarketsController } from '../markets/markets.controller';
import { UserRole } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow CLIENTE to access MarketsController.findAll', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN_GERAL,
      UserRole.GESTOR_MERCADO,
      UserRole.CLIENTE,
    ]);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.CLIENTE } }),
      }),
      getHandler: () => MarketsController.prototype.findAll,
      getClass: () => MarketsController,
    } as any;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
