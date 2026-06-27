import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, items: Array<{ productId: string; quantity: number; price: number }>, checkoutData?: CreateOrderDto) {
    this.logger.log(`Creating order for user ${userId} with ${items.length} items`);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.logger.log(`Total calculated: ${total}`);

    const firstProduct = await this.prisma.product.findUnique({
      where: { id: items[0].productId },
      include: { market: true },
    });

    if (!firstProduct) {
      throw new ForbiddenException('Produto não encontrado');
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        marketId: firstProduct.marketId,
        total,
        customerName: checkoutData?.customerName,
        zipCode: checkoutData?.zipCode,
        street: checkoutData?.street,
        number: checkoutData?.number,
        complement: checkoutData?.complement,
        neighborhood: checkoutData?.neighborhood,
        city: checkoutData?.city,
        state: checkoutData?.state,
        reference: checkoutData?.reference,
        paymentMethod: checkoutData?.paymentMethod,
        needsChange: checkoutData?.needsChange,
        changeFor: checkoutData?.changeFor,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: (item as any).productName || 'Produto',
            productPrice: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })) as any,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                market: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Order created: ${order.id}`);
    return order;
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                market: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMarket(marketId: string) {
    return this.prisma.order.findMany({
      where: { marketId },
      include: {
        items: {
          include: {
            product: {
              include: {
                market: true,
              },
            },
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              include: {
                market: true,
              },
            },
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                market: true,
              },
            },
          },
        },
        user: true,
      },
    });
  }

  async updateStatus(id: string, status: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { market: true },
    });

    if (!order) {
      throw new ForbiddenException('Pedido não encontrado');
    }

    if (user.role === 'GESTOR_MERCADO' && order.marketId !== user.marketId) {
      throw new ForbiddenException('Acesso negado: você só pode atualizar pedidos do seu mercado');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              include: {
                market: true,
              },
            },
          },
        },
        user: true,
      },
    });
  }
}
