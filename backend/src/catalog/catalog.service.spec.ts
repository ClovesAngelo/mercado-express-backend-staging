import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/helpers/prisma-mock';

describe('CatalogService', () => {
  let catalogService: CatalogService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    catalogService = module.get<CatalogService>(CatalogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockCategory = {
    id: 'cat-1',
    name: 'Test Category',
    deletedAt: null,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: 25.00,
    imageUrl: null,
    stock: 100,
    minStock: 5,
    isActive: true,
    deletedAt: null,
    marketId: 'market-1',
    categoryId: 'cat-1',
    market: { id: 'market-1', name: 'Test Market' },
    category: { id: 'cat-1', name: 'Test Category' },
    cartItems: [],
    orderItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findAllCategories', () => {
    it('should return all categories with products', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await catalogService.findAllCategories();

      expect(result).toEqual([mockCategory]);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        include: { products: true },
      });
    });
  });

  describe('findAllProducts', () => {
    it('should return only active products', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await catalogService.findAllProducts();

      expect(result).toEqual([mockProduct]);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        include: { market: true, category: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByMarket', () => {
    it('should return active products for a market', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await catalogService.findByMarket('market-1');

      expect(result).toEqual([mockProduct]);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { marketId: 'market-1', isActive: true, deletedAt: null },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const createDto = {
        name: 'New Product',
        price: 30.00,
        marketId: 'market-1',
        categoryId: 'cat-1',
      };

      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await catalogService.createProduct(createDto);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: createDto,
        include: { category: true },
      });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updateDto = { name: 'Updated Product', price: 35.00 };
      const updatedProduct = { ...mockProduct, name: 'Updated Product', price: 35.00 };
      prisma.product.update.mockResolvedValue(updatedProduct);

      const result = await catalogService.updateProduct('prod-1', updateDto);

      expect(result.name).toBe('Updated Product');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: updateDto,
        include: { category: true },
      });
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      prisma.product.update.mockResolvedValue(mockProduct);

      const result = await catalogService.deleteProduct('prod-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('updateStock', () => {
    it('should update stock and minStock', async () => {
      const stockData = { stock: 80, minStock: 10 };
      const updatedProduct = { ...mockProduct, stock: 80, minStock: 10 };
      prisma.product.update.mockResolvedValue(updatedProduct);

      const result = await catalogService.updateStock('prod-1', stockData);

      expect(result.stock).toBe(80);
      expect(result.minStock).toBe(10);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: 80, minStock: 10 },
        include: { category: true },
      });
    });
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      const createDto = { name: 'New Category' };
      prisma.category.create.mockResolvedValue({ ...mockCategory, name: 'New Category' });

      const result = await catalogService.createCategory(createDto);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: createDto,
        include: { products: true },
      });
      expect(result.name).toBe('New Category');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      prisma.category.delete.mockResolvedValue(mockCategory);

      const result = await catalogService.deleteCategory('cat-1');

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(result).toEqual(mockCategory);
    });
  });
});