import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MarketsService } from './markets.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('MarketsService', () => {
  let marketsService: MarketsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    marketsService = module.get<MarketsService>(MarketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockMarket = {
    id: 'market-1',
    name: 'Test Market',
    address: '123 Test St',
    description: 'A test market',
    phone: '11999999999',
    imageUrl: null,
    isActive: true,
    managerId: null,
    deletedAt: null,
    products: [],
    manager: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a market', async () => {
      const createDto = {
        name: 'New Market',
        address: '456 New St',
        description: 'A new market',
        phone: '11888888888',
      };

      prisma.market.create.mockResolvedValue(mockMarket);

      const result = await marketsService.create(createDto);

      expect(prisma.market.create).toHaveBeenCalledWith({
        data: {
          name: 'New Market',
          address: '456 New St',
          description: 'A new market',
          phone: '11888888888',
          imageUrl: undefined,
        },
      });
      expect(result).toEqual(mockMarket);
    });
  });

  describe('createWithManager', () => {
    it('should create market and manager in a transaction', async () => {
      const marketData = {
        name: 'Market with Manager',
        address: '789 Market St',
        description: 'Market with manager',
        phone: '11777777777',
      };
      const managerData = {
        email: 'manager@market.com',
        name: 'Manager Name',
        password: 'plain-password',
      };

      const createdMarket = { ...mockMarket, id: 'new-market-id' };
      const createdManager = {
        id: 'new-manager-id',
        email: 'manager@market.com',
        name: 'Manager Name',
        role: 'GESTOR_MERCADO',
        marketId: 'new-market-id',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');

      // Mock $transaction to execute the callback with tx proxy
      prisma.$transaction.mockImplementation(async (fn: any) => {
        // Create a mock tx that mirrors prisma methods
        const tx = {
          market: {
            create: jest.fn().mockResolvedValue(createdMarket),
            update: jest.fn().mockResolvedValue({ ...createdMarket, managerId: 'new-manager-id' }),
          },
          user: {
            create: jest.fn().mockResolvedValue(createdManager),
          },
        };
        return fn(tx);
      });

      const result = await marketsService.createWithManager(marketData, managerData);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(result).toBeDefined();
      expect(result.market).toBeDefined();
      expect(result.manager).toBeDefined();
      expect(result.manager.role).toBe('GESTOR_MERCADO');
    });
  });

  describe('findAll', () => {
    it('should return all markets with products and managers', async () => {
      prisma.market.findMany.mockResolvedValue([mockMarket]);

      const result = await marketsService.findAll();

      expect(result).toEqual([mockMarket]);
      expect(prisma.market.findMany).toHaveBeenCalledWith({
        include: {
          products: true,
          managers: {
            where: { role: 'GESTOR_MERCADO' },
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a market by id', async () => {
      prisma.market.findUnique.mockResolvedValue(mockMarket);

      const result = await marketsService.findOne('market-1');

      expect(result).toEqual(mockMarket);
      expect(prisma.market.findUnique).toHaveBeenCalledWith({
        where: { id: 'market-1' },
        include: {
          products: true,
          managers: {
            where: { role: 'GESTOR_MERCADO' },
            select: { id: true, name: true, email: true },
          },
        },
      });
    });

    it('should return null when market does not exist', async () => {
      prisma.market.findUnique.mockResolvedValue(null);

      const result = await marketsService.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findOnePublic', () => {
    it('should return a public market by id with safe fields only', async () => {
      const publicFields = {
        id: 'market-1',
        name: 'Test Market',
        fantasyName: null,
        companyName: null,
        address: '123 Test St',
        description: 'A test market',
        phone: '11999999999',
        whatsapp: null,
        logoUrl: null,
        bannerUrl: null,
        openTime: null,
        closeTime: null,
        deliveryFee: 0,
        minOrderValue: 0,
        avgDeliveryTime: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.market.findUnique.mockResolvedValue(publicFields);

      const result = await marketsService.findOnePublic('market-1');

      expect(result).toEqual(publicFields);
      expect(prisma.market.findUnique).toHaveBeenCalledWith({
        where: { id: 'market-1' },
        select: {
          id: true,
          name: true,
          fantasyName: true,
          companyName: true,
          address: true,
          description: true,
          phone: true,
          whatsapp: true,
          logoUrl: true,
          bannerUrl: true,
          openTime: true,
          closeTime: true,
          deliveryFee: true,
          minOrderValue: true,
          avgDeliveryTime: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return null when public market does not exist', async () => {
      prisma.market.findUnique.mockResolvedValue(null);

      const result = await marketsService.findOnePublic('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a market as admin', async () => {
      const updateData = { name: 'Updated Market' };
      const updatedMarket = { ...mockMarket, name: 'Updated Market' };
      prisma.market.update.mockResolvedValue(updatedMarket);

      const adminUser = { id: 'admin-1', role: 'ADMIN_GERAL' };
      const result = await marketsService.update('market-1', updateData, adminUser);

      expect(result.name).toBe('Updated Market');
      expect(prisma.market.update).toHaveBeenCalledWith({
        where: { id: 'market-1' },
        data: updateData,
      });
    });

    it('should filter allowed fields when gestor updates', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated desc',
        isActive: false, // NOT in allowed fields
      };
      const updatedMarket = { ...mockMarket, name: 'Updated Name', description: 'Updated desc' };
      prisma.market.update.mockResolvedValue(updatedMarket);

      const gestorUser = { id: 'gestor-1', role: 'GESTOR_MERCADO' };
      const result = await marketsService.update('market-1', updateData, gestorUser);

      expect(result.name).toBe('Updated Name');
      // isActive should NOT have been passed since it's not in allowed fields
      const updateCall = (prisma.market.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('isActive');
    });
  });

  describe('setActive', () => {
    it('should set market active status', async () => {
      prisma.market.update.mockResolvedValue({ ...mockMarket, isActive: false });

      const result = await marketsService.setActive('market-1', false);

      expect(prisma.market.update).toHaveBeenCalledWith({
        where: { id: 'market-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete a market', async () => {
      prisma.market.delete.mockResolvedValue(mockMarket);

      const result = await marketsService.remove('market-1');

      expect(result).toEqual(mockMarket);
      expect(prisma.market.delete).toHaveBeenCalledWith({
        where: { id: 'market-1' },
      });
    });
  });
});