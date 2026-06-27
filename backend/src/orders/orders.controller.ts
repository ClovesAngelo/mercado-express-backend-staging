import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  constructor(private ordersService: OrdersService, private prisma: PrismaService, private auditService: AuditService) {}

  @Post('from-cart')
  async createFromCart(@Req() req: Request, @Body() body: CreateOrderDto) {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?.sub;
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
        throw new Error('Carrinho vazio');
      }

      const items = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const order = await this.ordersService.create(userId, items, body);
      
      // Limpar carrinho
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      
      const user = req.user as any;
      if (user) {
        this.auditService.log({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'ORDER_CREATED',
          entity: 'Order',
          entityId: order.id,
          newValues: { total: order.total, marketId: order.marketId, itemCount: items.length },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      
      return order;
    } catch (error) {
      this.logger.error(`ERROR creating order from cart: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao criar pedido',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('my')
  async findMyOrders(@Req() req: Request) {
    try {
      const userId = (req.user as any)?.id || (req.user as any)?.sub;
      return await this.ordersService.findByUser(userId);
    } catch (error) {
      this.logger.error(`ERROR fetching my orders: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedidos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async findAll(@Req() req: Request) {
    try {
      const user = req.user as any;
      if (user.role === 'ADMIN_GERAL') {
        return await this.ordersService.findAll();
      }
      if (user.role === 'GESTOR_MERCADO' && user.marketId) {
        return await this.ordersService.findByMarket(user.marketId);
      }
      return [];
    } catch (error) {
      this.logger.error(`ERROR fetching orders: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedidos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('market/:marketId')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async findByMarket(@Param('marketId') marketId: string, @Req() req: Request) {
    try {
      const user = req.user as any;
      if (user.role === 'GESTOR_MERCADO' && marketId !== user.marketId) {
        throw new Error('Acesso negado');
      }
      return await this.ordersService.findByMarket(marketId);
    } catch (error) {
      this.logger.error(`ERROR fetching market orders: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedidos do mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.ordersService.findOne(id);
    } catch (error) {
      this.logger.error(`ERROR fetching order: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar pedido',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Req() req: Request) {
    try {
      const user = req.user as any;
      const previousOrder = await this.ordersService.findOne(id);
      const result = await this.ordersService.updateStatus(id, body.status, user);
      this.auditService.log({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'ORDER_STATUS_UPDATED',
        entity: 'Order',
        entityId: id,
        oldValues: { status: previousOrder?.status },
        newValues: { status: body.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    } catch (error) {
      this.logger.error(`ERROR updating order status: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar status do pedido',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
