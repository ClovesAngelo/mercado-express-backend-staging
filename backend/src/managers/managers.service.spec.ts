import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ManagersService } from './managers.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('ManagersService', () => {
  let managersService: ManagersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManagersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    managersService = module.get<ManagersService>(ManagersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockManager = {
    id: 'manager-1',
    email: 'manager@example.com',
    name: 'Manager Test',
    role: 'GESTOR_MERCADO',
    marketId: null,
    market: null,
  };

  const mockManagerWithMarket = {
    ...mockManager,
    marketId: 'market-1',
    market: { id: 'market-1', name: 'Market 1' },
  };

  describe('findAll', () => {
    it('should return all managers with GESTOR_MERCADO role', async () => {
      prisma.user.findMany.mockResolvedValue([mockManagerWithMarket]);

      const result = await managersService.findAll();

      expect(result).toEqual([mockManagerWithMarket]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'GESTOR_MERCADO' },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          role: true,
          marketId: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a manager by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockManagerWithMarket);

      const result = await managersService.findOne('manager-1');

      expect(result).toEqual(mockManagerWithMarket);
    });

    it('should throw NotFoundException when manager does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(managersService.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Manager',
      email: 'newmanager@example.com',
      password: 'plain-text-password',
    };

    it('should create a manager with hashed password and GESTOR_MERCADO role', async () => {
      const hashedPassword = '$2b$10$hashedpassword';

      prisma.user.findUnique.mockResolvedValue(null); // no existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prisma.user.create.mockResolvedValue(mockManager);

      const result = await managersService.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-text-password', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'New Manager',
          email: 'newmanager@example.com',
          password: hashedPassword,
          role: 'GESTOR_MERCADO',
          marketId: null,
        },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          role: true,
          marketId: true,
        }),
      });
      expect(result).toEqual(mockManager);
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockManager); // existing user

      await expect(managersService.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when marketId does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.market.findUnique.mockResolvedValue(null);

      await expect(
        managersService.create({ ...createDto, marketId: 'nonexistent-market' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create manager with market association', async () => {
      const market = { id: 'market-1' };
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.market.findUnique.mockResolvedValue(market);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      prisma.user.create.mockResolvedValue(mockManagerWithMarket);

      const result = await managersService.create({
        ...createDto,
        marketId: 'market-1',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            marketId: 'market-1',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Manager',
      email: 'updated@example.com',
    };

    it('should update a manager', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockManager);
      prisma.user.findUnique.mockResolvedValueOnce(null); // email not in use
      prisma.user.update.mockResolvedValue({ ...mockManager, name: 'Updated Manager', email: 'updated@example.com', market: null });

      const result = await managersService.update('manager-1', updateDto);

      expect(result.name).toBe('Updated Manager');
      expect(result.email).toBe('updated@example.com');
    });

    it('should throw NotFoundException when manager does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(managersService.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockManager);
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'other-user', email: 'updated@example.com' });

      await expect(managersService.update('manager-1', { email: 'updated@example.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a manager and unlink market', async () => {
      prisma.user.findUnique.mockResolvedValue(mockManagerWithMarket);
      prisma.user.delete.mockResolvedValue(mockManagerWithMarket);

      const result = await managersService.remove('manager-1');

      expect(result).toEqual({ message: 'Gestor removido com sucesso' });
      expect(prisma.market.update).toHaveBeenCalledWith({
        where: { id: 'market-1' },
        data: { managerId: null },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'manager-1' } });
    });

    it('should throw NotFoundException when manager does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(managersService.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});