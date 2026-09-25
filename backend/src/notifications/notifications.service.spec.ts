import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockedPrismaService,
} from '../../test/helpers/prisma-mock';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: MockedPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const lowProduct = {
    id: 'prod-1',
    name: 'Arroz 1kg',
    stock: 3,
    minStock: 5,
    marketId: 'market-1',
  };

  const okProduct = {
    id: 'prod-1',
    name: 'Arroz 1kg',
    stock: 20,
    minStock: 5,
    marketId: 'market-1',
  };

  describe('evaluateProductStock', () => {
    it('creates an alert for every manager when stock is at/below the threshold', async () => {
      prisma.product.findUnique.mockResolvedValue(lowProduct);
      prisma.user.findMany.mockResolvedValue([{ id: 'gestor-1' }]);
      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      await service.evaluateProductStock('prod-1');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'gestor-1',
          type: 'STOCK_ALERT',
          title: 'Alerta de estoque: Arroz 1kg',
          message: expect.stringContaining(
            'restam apenas 3 unidade(s)',
          ) as never,
          productId: 'prod-1',
          marketId: 'market-1',
        },
      });
    });

    it('re-activates the existing alert instead of duplicating it', async () => {
      prisma.product.findUnique.mockResolvedValue(lowProduct);
      prisma.user.findMany.mockResolvedValue([{ id: 'gestor-1' }]);
      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif-1',
        isRead: true,
      });

      await service.evaluateProductStock('prod-1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          isRead: false,
          readAt: null,
          title: expect.any(String) as never,
          message: expect.any(String) as never,
        },
      });
    });

    it('marks alerts as read when stock is replenished above the threshold', async () => {
      prisma.product.findUnique.mockResolvedValue(okProduct);

      await service.evaluateProductStock('prod-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          productId: 'prod-1',
          type: 'STOCK_ALERT',
          isRead: false,
        },
        data: { isRead: true, readAt: expect.any(Date) as never },
      });
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('does nothing when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await service.evaluateProductStock('missing');

      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('countUnread', () => {
    it('returns the number of unread notifications', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.countUnread('gestor-1');

      expect(result).toBe(3);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'gestor-1', isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    const user = {
      id: 'gestor-1',
      email: 'gestor@example.com',
      role: 'GESTOR_MERCADO' as const,
    };

    it('marks a notification of the current user as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'gestor-1',
      });
      prisma.notification.update.mockResolvedValue({ id: 'notif-1' });

      await service.markAsRead('notif-1', user);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: expect.any(Date) as never },
      });
    });

    it('throws NotFoundException when the notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('notif-1', user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the notification belongs to another user', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'other-user',
      });

      await expect(service.markAsRead('notif-1', user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications of the user as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 2 });

      await service.markAllAsRead('gestor-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'gestor-1', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) as never },
      });
    });
  });
});
