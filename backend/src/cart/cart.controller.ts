import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/** Extrai o userId do usuário autenticado anexado pelo JwtStrategy. */
function getUserId(req: Request): string {
  const user = req.user;
  const userId = user?.id ?? user?.sub;
  if (!userId) throw new Error('UserId not found in token');
  return userId;
}

@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);
  constructor(private cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@Req() req: Request) {
    try {
      return await this.cartService.getCart(getUserId(req));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching cart: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  async addToCart(
    @Req() req: Request,
    @Body() body: { productId: string; quantity: number },
  ) {
    try {
      return await this.cartService.addToCart(
        getUserId(req),
        body.productId,
        body.quantity ?? 1,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR adding to cart: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao adicionar ao carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('items/:productId')
  @UseGuards(JwtAuthGuard)
  async updateCartItem(
    @Req() req: Request,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    try {
      return await this.cartService.updateCartItem(
        getUserId(req),
        productId,
        body.quantity,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR updating cart item: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar item do carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  async removeFromCart(
    @Req() req: Request,
    @Param('productId') productId: string,
  ) {
    try {
      return await this.cartService.removeFromCart(getUserId(req), productId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR removing from cart: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao remover item do carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
