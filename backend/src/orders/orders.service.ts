import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FulfillmentType, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  private isWithinDeliveryTime(market: any): boolean {
    if (!market.deliveryStartTime || !market.deliveryEndTime) {
      return true;
    }
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = market.deliveryStartTime.split(':').map(Number);
    const [endH, endM] = market.deliveryEndTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentTime >= startMinutes && currentTime <= endMinutes;
  }

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

    const market = firstProduct.market;
    const fulfillmentType = checkoutData?.fulfillmentType || FulfillmentType.DELIVERY;
    const paymentMethod = checkoutData?.paymentMethod || PaymentMethod.DINHEIRO_NA_ENTREGA;

    if (fulfillmentType === FulfillmentType.DELIVERY && !market.acceptsDelivery) {
      throw new BadRequestException('Este mercado não aceita entrega. Escolha retirada no mercado.');
    }

    if (fulfillmentType === FulfillmentType.PICKUP && !market.acceptsPickup) {
      throw new BadRequestException('Este mercado não aceita retirada. Escolha entrega.');
    }

    if (fulfillmentType === FulfillmentType.DELIVERY && !this.isWithinDeliveryTime(market)) {
      throw new BadRequestException('Entrega indisponível neste horário. Retirada ainda disponível.');
    }

    if (paymentMethod === PaymentMethod.PIX && !market.pixEnabled) {
      throw new BadRequestException('Este mercado não aceita pagamento via PIX no momento.');
    }

    if (paymentMethod === PaymentMethod.PIX && (!market.pixKey || !market.pixRecipientName)) {
      throw new BadRequestException('Mercado não possui dados Pix configurados. Escolha outra forma de pagamento.');
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        marketId: market.id,
        total,
        customerName: checkoutData?.customerName,
        customerPhone: checkoutData?.customerPhone,
        zipCode: checkoutData?.zipCode,
        street: checkoutData?.street,
        number: checkoutData?.number,
        complement: checkoutData?.complement,
        neighborhood: checkoutData?.neighborhood,
        city: 'Várzea Nova',
        state: 'BA',
        reference: checkoutData?.reference,
        fulfillmentType,
        paymentMethod,
        paymentStatus: paymentMethod === PaymentMethod.PIX ? 'PENDING' : 'CONFIRMED',
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
        market: true,
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
