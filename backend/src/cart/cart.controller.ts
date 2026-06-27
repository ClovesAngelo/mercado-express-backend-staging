import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);
  constructor(private cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@Req() req: any) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new Error('UserId not found in token');
      return await this.cartService.getCart(userId);
    } catch (error) {
      this.logger.error(`ERROR fetching cart: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  async addToCart(@Req() req: any, @Body() body: { productId: string; quantity: number }) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new Error('UserId not found in token');
      return await this.cartService.addToCart(userId, body.productId, body.quantity ?? 1);
    } catch (error) {
      this.logger.error(`ERROR adding to cart: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao adicionar ao carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('items/:productId')
  @UseGuards(JwtAuthGuard)
  async updateCartItem(@Req() req: any, @Param('productId') productId: string, @Body() body: { quantity: number }) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new Error('UserId not found in token');
      return await this.cartService.updateCartItem(userId, productId, body.quantity);
    } catch (error) {
      this.logger.error(`ERROR updating cart item: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar item do carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  async removeFromCart(@Req() req: any, @Param('productId') productId: string) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) throw new Error('UserId not found in token');
      return await this.cartService.removeFromCart(userId, productId);
    } catch (error) {
      this.logger.error(`ERROR removing from cart: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao remover item do carrinho',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}