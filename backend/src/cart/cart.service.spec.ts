import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';

describe('CartService', () => {
  let cartService: CartService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    price: 15.00,
    description: null,
    imageUrl: null,
    stock: 50,
    minStock: 0,
    isActive: true,
    deletedAt: null,
    marketId: 'market-1',
    categoryId: 'category-1',
    market: { id: 'market-1', name: 'Test Market' },
    category: { id: 'category-1', name: 'Test Category' },
    cartItems: [],
    orderItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        id: 'ci-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
        product: mockProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getCart', () => {
    it('should return cart with total when cart exists', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);

      const result = await cartService.getCart('user-1');

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(30.00); // 2 * 15.00
    });

    it('should return empty cart when no cart exists', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      const result = await cartService.getCart('user-1');

      expect(result).toEqual({ items: [], total: 0 });
    });
  });

  describe('addToCart', () => {
    it('should add item to cart using upsert', async () => {
      const mockCartItem = {
        id: 'ci-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.cart.upsert.mockResolvedValue(mockCart);
      prisma.cartItem.upsert.mockResolvedValue(mockCartItem);

      const result = await cartService.addToCart('user-1', 'product-1', 1);

      expect(prisma.cart.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {},
        create: { userId: 'user-1' },
      });
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cartId_productId: { cartId: 'cart-1', productId: 'product-1' },
        },
        update: { quantity: { increment: 1 } },
        create: { cartId: 'cart-1', productId: 'product-1', quantity: 1 },
      });
      expect(result).toEqual(mockCartItem);
    });
  });

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      const updatedItem = {
        id: 'ci-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.upsert.mockResolvedValue(updatedItem);

      const result = await cartService.updateCartItem('user-1', 'product-1', 3);

      expect(result.quantity).toBe(3);
    });

    it('should return null when cart does not exist', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      const result = await cartService.updateCartItem('user-1', 'product-1', 3);

      expect(result).toBeNull();
    });

    it('should remove item when quantity is less than 1', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.delete.mockResolvedValue({} as any);

      await cartService.updateCartItem('user-1', 'product-1', 0);

      expect(prisma.cartItem.delete).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.delete.mockResolvedValue({} as any);

      const result = await cartService.removeFromCart('user-1', 'product-1');

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: {
          cartId_productId: { cartId: 'cart-1', productId: 'product-1' },
        },
      });
    });

    it('should return null when cart does not exist', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      const result = await cartService.removeFromCart('user-1', 'product-1');

      expect(result).toBeNull();
    });
  });
});