import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';

describe('OrdersService', () => {
  let ordersService: OrdersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    price: 10.50,
    marketId: 'market-1',
    market: {
      id: 'market-1',
      name: 'Test Market',
      acceptsDelivery: true,
      acceptsPickup: true,
      deliveryStartTime: null,
      deliveryEndTime: null,
      pixEnabled: false,
      pixKey: null,
      pixKeyType: null,
      pixRecipientName: null,
      pixInstructions: null,
    },
    description: 'A test product',
    imageUrl: null,
    stock: 100,
    minStock: 0,
    isActive: true,
    deletedAt: null,
    categoryId: 'category-1',
    category: null,
    cartItems: [],
    orderItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    marketId: 'market-1',
    status: 'PENDING',
    total: 21.00,
    deliveryFee: 0,
    customerName: null,
    customerPhone: null,
    zipCode: null,
    street: null,
    number: null,
    complement: null,
    neighborhood: null,
    city: null,
    state: null,
    reference: null,
    paymentMethod: null,
    needsChange: null,
    changeFor: null,
    viewedByManager: false,
    deletedAt: null,
    items: [
      {
        id: 'oi-1',
        orderId: 'order-1',
        productId: 'product-1',
        productName: 'Test Product',
        productPrice: 10.50,
        quantity: 2,
        subtotal: 21.00,
        product: {
          id: 'product-1',
          marketId: 'market-1',
          market: { id: 'market-1', name: 'Test Market' },
          name: 'Test Product',
          price: 10.50,
        },
      },
    ],
    user: null,
    market: null,
    rating: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create an order with calculated total', async () => {
      const items = [
        { productId: 'product-1', quantity: 2, price: 10.50 },
      ];

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.order.create.mockResolvedValue(mockOrder);

      const result = await ordersService.create('user-1', items);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: { market: true },
      });
      expect(prisma.order.create).toHaveBeenCalled();
      expect(result.total).toBe(21.00);
      expect(result.marketId).toBe('market-1');
    });

    it('should throw ForbiddenException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        ordersService.create('user-1', [{ productId: 'nonexistent', quantity: 1, price: 10 }]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByUser', () => {
    it('should return orders for a specific user', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await ordersService.findByUser('user-1');

      expect(result).toEqual([mockOrder]);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findByMarket', () => {
    it('should return orders for a specific market', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await ordersService.findByMarket('market-1');

      expect(result).toEqual([mockOrder]);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { marketId: 'market-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await ordersService.findAll();

      expect(result).toEqual([mockOrder]);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await ordersService.findOne('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should return null when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await ordersService.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const order = { ...mockOrder, market: { id: 'market-1' } };
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue({ ...order, status: 'CONFIRMED' });

      const adminUser = { id: 'admin-1', role: 'ADMIN_GERAL', marketId: null };
      const result = await ordersService.updateStatus('order-1', 'CONFIRMED', adminUser);

      expect(result.status).toBe('CONFIRMED');
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CONFIRMED' },
        include: expect.anything(),
      });
    });

    it('should throw ForbiddenException when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      const adminUser = { id: 'admin-1', role: 'ADMIN_GERAL', marketId: null };
      await expect(
        ordersService.updateStatus('nonexistent', 'CONFIRMED', adminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when gestor tries to update order from another market', async () => {
      const order = { ...mockOrder, market: { id: 'other-market' } };
      prisma.order.findUnique.mockResolvedValue(order);

      const gestorUser = { id: 'gestor-1', role: 'GESTOR_MERCADO', marketId: 'my-market' };
      await expect(
        ordersService.updateStatus('order-1', 'CONFIRMED', gestorUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow gestor to update order from their own market', async () => {
      const order = { ...mockOrder, marketId: 'my-market', market: { id: 'my-market' } };
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue({ ...order, status: 'CONFIRMED' });

      const gestorUser = { id: 'gestor-1', role: 'GESTOR_MERCADO', marketId: 'my-market' };
      const result = await ordersService.updateStatus('order-1', 'CONFIRMED', gestorUser);

      expect(result.status).toBe('CONFIRMED');
    });
  });
});