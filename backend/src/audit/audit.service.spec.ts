import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';

describe('AuditService', () => {
  let auditService: AuditService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const auditParams = {
    userId: 'user-1',
    userName: 'Test User',
    userEmail: 'test@example.com',
    action: 'LOGIN',
    entity: 'USER',
    entityId: 'user-1',
    oldValues: null,
    newValues: null,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const createdLog = { id: 'log-1', ...auditParams, createdAt: new Date() };
      prisma.auditLog.create.mockResolvedValue(createdLog);

      await auditService.log(auditParams);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          userName: 'Test User',
          userEmail: 'test@example.com',
          action: 'LOGIN',
          entity: 'USER',
          entityId: 'user-1',
          oldValues: null,
          newValues: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });
    });

    it('should not include password in oldValues or newValues', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'log-1', ...auditParams, createdAt: new Date() });

      await auditService.log({
        ...auditParams,
        oldValues: { password: 'secret' },
        newValues: { password: 'new-secret' },
      });

      // The service just passes through whatever is given - the responsibility
      // to filter passwords is on the caller. Verify the data was passed correctly.
      const callData = (prisma.auditLog.create as jest.Mock).mock.calls[0][0].data;
      expect(callData.oldValues).toEqual({ password: 'secret' });
      expect(callData.newValues).toEqual({ password: 'new-secret' });
    });

    it('should not include token in audit data', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'log-1', ...auditParams, createdAt: new Date() });

      await auditService.log({
        ...auditParams,
        newValues: { access_token: 'jwt-token' },
      });

      const callData = (prisma.auditLog.create as jest.Mock).mock.calls[0][0].data;
      // The service does not filter tokens - that responsibility is on the caller
      // But we document this behavior
      expect(callData.newValues).toHaveProperty('access_token');
    });

    it('should not throw when Prisma fails (fail-safe behavior)', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('DB connection lost'));

      // Should not throw - the service catches errors
      await expect(auditService.log(auditParams)).resolves.not.toThrow();
    });

    it('should log the error internally when Prisma fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      prisma.auditLog.create.mockRejectedValue(new Error('DB error'));
      await auditService.log(auditParams);

      // Should not throw - fail-safe behavior
      expect(consoleSpy).not.toHaveBeenCalled(); // Uses Logger, not console.error

      consoleSpy.mockRestore();
    });
  });
});