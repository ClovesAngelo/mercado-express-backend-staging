import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../types/express';

export const STOCK_ALERT_TYPE = 'STOCK_ALERT';

interface StockAlertProduct {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  marketId: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Avalua o stock de um produto e cria/resolve a alerta correspondiente.
   * Chamado ao criar/actualizar produto, ao actualizar stock e ao
   * descontar stock por uma entrega marcada como entregada.
   */
  async evaluateProductStock(productId: string): Promise<void> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product || product.deletedAt) return;

      if (product.stock <= product.minStock) {
        await this.raiseStockAlert(product);
      } else {
        await this.resolveStockAlerts(product.id);
      }
    } catch (error) {
      this.logger.error(
        `Falha ao avaliar stock do produto ${productId}: ${(error as Error).message}`,
      );
    }
  }

  private async raiseStockAlert(product: StockAlertProduct): Promise<void> {
    const managers = await this.prisma.user.findMany({
      where: {
        role: UserRole.GESTOR_MERCADO,
        marketId: product.marketId,
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const manager of managers) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId: manager.id,
          productId: product.id,
          type: STOCK_ALERT_TYPE,
        },
        orderBy: { createdAt: 'desc' },
      });

      const title = `Alerta de estoque: ${product.name}`;
      const message =
        `O produto "${product.name}" está por terminar: restam apenas ` +
        `${product.stock} unidade(s). Alerta configurada em ${product.minStock}.`;

      if (existing) {
        // Re-alerta sem duplicar: reativa a notificação como não lida.
        await this.prisma.notification.update({
          where: { id: existing.id },
          data: { isRead: false, readAt: null, title, message },
        });
      } else {
        await this.prisma.notification.create({
          data: {
            userId: manager.id,
            type: STOCK_ALERT_TYPE,
            title,
            message,
            productId: product.id,
            marketId: product.marketId,
          },
        });
      }
    }
  }

  private async resolveStockAlerts(productId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { productId, type: STOCK_ALERT_TYPE, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            stock: true,
            minStock: true,
          },
        },
      },
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }
    if (notification.userId !== user.id) {
      throw new ForbiddenException('Você não pode acessar essa notificação');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
