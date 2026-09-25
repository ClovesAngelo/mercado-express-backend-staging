import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FulfillmentType, PaymentMethod, Prisma } from '@prisma/client';
import { OrderStatus } from './dto/update-order-status.dto';
import {
  assertOrderStatusTransition,
  isWithinDeliveryTime,
} from './order-policy';
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  marketId?: string | null;
}
const orderItemInclude: Prisma.OrderItemInclude = {
  product: {
    include: {
      market: true,
    },
  },
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      productName?: string;
    }>,
    checkoutData?: CreateOrderDto,
  ) {
    this.logger.log(
      `Creating order for user ${userId} with ${items.length} items`,
    );
    if (!items.length)
      throw new BadRequestException('O pedido deve conter itens.');

    const firstProduct = await this.prisma.product.findUnique({
      where: { id: items[0].productId },
      include: { market: true },
    });

    if (!firstProduct) {
      throw new ForbiddenException('Produto não encontrado');
    }

    const market = firstProduct.market;
    if (market.isActive === false || market.deletedAt) {
      throw new BadRequestException(
        'Este mercado não está disponível para pedidos.',
      );
    }
    const fulfillmentType =
      checkoutData?.fulfillmentType || FulfillmentType.DELIVERY;
    const paymentMethod =
      checkoutData?.paymentMethod || PaymentMethod.DINHEIRO_NA_ENTREGA;

    if (
      fulfillmentType === FulfillmentType.DELIVERY &&
      !market.acceptsDelivery
    ) {
      throw new BadRequestException(
        'Este mercado não aceita entrega. Escolha retirada no mercado.',
      );
    }
    if (fulfillmentType === FulfillmentType.PICKUP && !market.acceptsPickup) {
      throw new BadRequestException(
        'Este mercado não aceita retirada. Escolha entrega.',
      );
    }
    if (
      fulfillmentType === FulfillmentType.DELIVERY &&
      !isWithinDeliveryTime(market)
    ) {
      throw new BadRequestException(
        'Entrega indisponível neste horário. Retirada ainda disponível.',
      );
    }
    if (paymentMethod === PaymentMethod.PIX && !market.pixEnabled) {
      throw new BadRequestException(
        'Este mercado não aceita pagamento via PIX no momento.',
      );
    }
    if (
      paymentMethod === PaymentMethod.PIX &&
      (!market.pixKey || !market.pixRecipientName)
    ) {
      throw new BadRequestException(
        'Mercado não possui dados Pix configurados. Escolha outra forma de pagamento.',
      );
    }

    let subtotal = 0;
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException(
          `O produto ${item.productId || 'desconhecido'} não foi encontrado.`,
        );
      }
      if (product.marketId !== market.id) {
        throw new BadRequestException(
          'Todos os itens do pedido devem pertencer ao mesmo mercado.',
        );
      }
      if (!product.isActive || product.deletedAt) {
        throw new BadRequestException(
          `O produto ${product.name} não está disponível.`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `O produto ${product.name} não possui estoque suficiente. ` +
            `Solicitado: ${item.quantity}, Disponível: ${product.stock}`,
        );
      }
      item.price = product.price;
      item.productName = product.name;
      subtotal += product.price * item.quantity;
    }
    const minOrderValue = market.minOrderValue ?? 0;
    if (subtotal < minOrderValue) {
      throw new BadRequestException(
        `O pedido mínimo deste mercado é R$ ${minOrderValue.toFixed(2)}.`,
      );
    }
    const deliveryFee =
      fulfillmentType === FulfillmentType.DELIVERY
        ? (market.deliveryFee ?? 0)
        : 0;
    const total = subtotal + deliveryFee;
    if (
      checkoutData?.needsChange &&
      (!checkoutData.changeFor || checkoutData.changeFor < total)
    ) {
      throw new BadRequestException(
        'O valor para troco deve ser maior ou igual ao total do pedido.',
      );
    }
    this.logger.log(`Total calculated: ${total}`);

    const order = await this.prisma.order.create({
      data: {
        userId,
        marketId: market.id,
        total,
        deliveryFee,
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
        paymentStatus:
          paymentMethod === PaymentMethod.PIX ? 'PENDING' : 'CONFIRMED',
        needsChange: checkoutData?.needsChange,
        changeFor: checkoutData?.changeFor,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName ?? 'Produto',
            productPrice: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: orderItemInclude,
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
      include: { items: { include: orderItemInclude } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMarket(marketId: string) {
    return this.prisma.order.findMany({
      where: { marketId },
      include: { items: { include: orderItemInclude }, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { items: { include: orderItemInclude }, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: orderItemInclude,
        },
        user: true,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        market: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new ForbiddenException('Pedido não encontrado');
    }

    if (user.role === 'GESTOR_MERCADO' && order.marketId !== user.marketId) {
      throw new ForbiddenException(
        'Acesso negado: você só pode atualizar pedidos do seu mercado',
      );
    }

    assertOrderStatusTransition(order.status, status);

    if (status === 'DELIVERED' && !order.stockDeductedAt) {
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new ForbiddenException(
              `Produto ${item.productName} não encontrado no sistema`,
            );
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Não há estoque suficiente para marcar este pedido como entregue. ` +
                `Produto: ${product.name}. ` +
                `Solicitado: ${item.quantity}, Disponível: ${product.stock}`,
            );
          }
        }

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        return tx.order.update({
          where: { id },
          data: {
            status,
            stockDeductedAt: new Date(),
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
            user: true,
          },
        });
      });

      this.logger.log(`Order ${id} marked as DELIVERED and stock deducted`);
      void Promise.all(
        updatedOrder.items.map((item) =>
          this.notificationsService.evaluateProductStock(item.productId),
        ),
      );
      return updatedOrder;
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
