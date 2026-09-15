import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import type { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  constructor(
    private ordersService: OrdersService,
    private prisma: PrismaService,
    private auditService: AuditService,
    private whatsappService: WhatsAppService,
  ) {}

  @Post('from-cart')
  async createFromCart(@Req() req: Request, @Body() body: CreateOrderDto) {
    try {
      const userId = req.user!.id;
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new HttpException('Carrinho vazio', HttpStatus.BAD_REQUEST);
      }

      const items = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const order = await this.ordersService.create(userId, items, body);

      this.whatsappService.sendOrderConfirmation(order).catch(() => undefined);

      // Limpar carrinho — se a limpeza falhar o pedido já foi criado, então
      // registramos o erro e mantemos o sucesso na resposta.
      try {
        await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      } catch (error) {
        this.logger.error(
          `ERROR clearing cart after order creation: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }

      const user = req.user;
      if (user) {
        this.auditService
          .log({
            userId: user.id,
            userName: user.name ?? '',
            userEmail: user.email,
            action: 'ORDER_CREATED',
            entity: 'Order',
            entityId: order.id,
            newValues: {
              total: order.total,
              marketId: order.marketId,
              itemCount: items.length,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          })
          .catch(() => undefined);
      }

      return order;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR creating order from cart: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao criar pedido',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my')
  async findMyOrders(@Req() req: Request) {
    try {
      const userId = req.user!.id;
      return await this.ordersService.findByUser(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching my orders: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedidos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async findAll(@Req() req: Request) {
    try {
      const user = req.user!;
      if (user.role === 'ADMIN_GERAL') {
        return await this.ordersService.findAll();
      }
      if (user.role === 'GESTOR_MERCADO' && user.marketId) {
        return await this.ordersService.findByMarket(user.marketId);
      }
      return [];
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching orders: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedidos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('market/:marketId')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async findByMarket(@Param('marketId') marketId: string, @Req() req: Request) {
    try {
      const user = req.user!;
      if (user.role === 'GESTOR_MERCADO' && marketId !== user.marketId) {
        throw new HttpException('Acesso negado', HttpStatus.FORBIDDEN);
      }
      return await this.ordersService.findByMarket(marketId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching market orders: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedidos do mercado',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order)
        throw new HttpException('Pedido não encontrado', HttpStatus.NOT_FOUND);
      const user = req.user!;
      if (
        user.role !== UserRole.ADMIN_GERAL &&
        order.userId !== user.id &&
        !(
          user.role === UserRole.GESTOR_MERCADO &&
          order.marketId === user.marketId
        )
      ) {
        throw new HttpException('Acesso negado', HttpStatus.FORBIDDEN);
      }
      return order;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching order: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedido',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    try {
      const user = req.user!;
      const previousOrder = await this.ordersService.findOne(id);
      const result = await this.ordersService.updateStatus(
        id,
        body.status,
        user,
      );
      this.auditService
        .log({
          userId: user.id,
          userName: user.name ?? '',
          userEmail: user.email,
          action: 'ORDER_STATUS_UPDATED',
          entity: 'Order',
          entityId: id,
          oldValues: { status: previousOrder?.status },
          newValues: { status: body.status },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        })
        .catch(() => undefined);
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR updating order status: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar status do pedido',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
