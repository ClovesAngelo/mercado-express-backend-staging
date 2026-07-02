import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                stock: true,
                marketId: true,
                market: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { items: [], total: 0 };
    }

    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      total,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    // Validar quantity
    if (!quantity || quantity < 1) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    if (!product.isActive) {
      throw new Error('Produto não está disponível');
    }

    // Verificar estoque disponível
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { productId },
        },
      },
    });

    const existingItem = cart?.items.find(item => item.productId === productId);
    const currentQuantityInCart = existingItem?.quantity || 0;
    const totalQuantityAfterAdd = currentQuantityInCart + quantity;

    if (product.stock < totalQuantityAfterAdd) {
      throw new Error(`Quantidade solicitada maior que o estoque disponível. Estoque: ${product.stock}, No carrinho: ${currentQuantityInCart}`);
    }

    // Criar ou atualizar carrinho
    const upsertedCart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: upsertedCart.id,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: upsertedCart.id,
        productId,
        quantity,
      },
    });
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return null;

    if (quantity < 1) {
      return this.removeFromCart(userId, productId);
    }

    return this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      update: { quantity },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return null;

    return this.prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });
  }
}
