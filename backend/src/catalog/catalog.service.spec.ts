import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OpenFoodFactsService } from './open-food-facts.service';
// Somente para fins de tipo/token. O módulo real não é carregado no teste
// (evita o pacote 'uuid' v14, que é ESM e o Jest CJS não interpreta).
import { UploadService } from '../upload/upload.service';
import {
  createMockPrismaService,
  MockedPrismaService,
} from '../../test/helpers/prisma-mock';

jest.mock('../upload/upload.service', () => ({
  UploadService: class UploadServiceMock {
    importFromOpenFoodFacts = jest.fn();
  },
}));

describe('CatalogService', () => {
  let catalogService: CatalogService;
  let prisma: MockedPrismaService;
  let notificationsService: NotificationsService;
  let openFoodFactsService: {
    searchProducts: jest.Mock;
    isOpenFoodFactsImageUrl: jest.Mock;
  };
  let uploadService: { importFromOpenFoodFacts: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    notificationsService = {
      evaluateProductStock: jest.fn(),
    } as unknown as NotificationsService;
    openFoodFactsService = {
      searchProducts: jest.fn(),
      isOpenFoodFactsImageUrl: jest.fn(),
    };
    uploadService = {
      importFromOpenFoodFacts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: OpenFoodFactsService, useValue: openFoodFactsService },
        { provide: UploadService, useValue: uploadService },
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
    price: 25.0,
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
        price: 30.0,
        marketId: 'market-1',
        categoryId: 'cat-1',
        stock: 100,
        minStock: 5,
      };

      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await catalogService.createProduct(createDto, {
        id: 'admin-1',
        role: 'ADMIN_GERAL',
        email: 'admin@example.com',
      });

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: createDto,
        include: { category: true },
      });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const updateDto = { name: 'Updated Product', price: 35.0 };
      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Product',
        price: 35.0,
      };
      prisma.product.update.mockResolvedValue(updatedProduct);

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      const result = await catalogService.updateProduct('prod-1', updateDto, {
        id: 'admin-1',
        role: 'ADMIN_GERAL',
        email: 'admin@example.com',
      });

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

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      await catalogService.deleteProduct('prod-1', {
        id: 'admin-1',
        role: 'ADMIN_GERAL',
        email: 'admin@example.com',
      });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { deletedAt: expect.any(Date) as never },
      });
    });
  });

  describe('updateStock', () => {
    it('should update stock and minStock', async () => {
      const stockData = { stock: 80, minStock: 10 };
      const updatedProduct = { ...mockProduct, stock: 80, minStock: 10 };
      prisma.product.update.mockResolvedValue(updatedProduct);

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      const result = await catalogService.updateStock('prod-1', stockData, {
        id: 'admin-1',
        role: 'ADMIN_GERAL',
        email: 'admin@example.com',
      });

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
      prisma.category.create.mockResolvedValue({
        ...mockCategory,
        name: 'New Category',
      });

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

  describe('searchProductImages', () => {
    it('should map Open Food Facts results to the product image shape', async () => {
      openFoodFactsService.searchProducts.mockResolvedValue([
        {
          code: '1234567890123',
          productName: 'Arroz Integral',
          brands: 'Marca Teste',
          quantity: '1kg',
          imageUrl:
            'https://images.openfoodfacts.org/images/products/123/456/789/0123/front_pt.1.400.jpg',
        },
      ]);

      const result = await catalogService.searchProductImages('arroz');

      expect(openFoodFactsService.searchProducts).toHaveBeenCalledWith('arroz');
      expect(result).toEqual([
        {
          id: 'off-1234567890123',
          url: 'https://images.openfoodfacts.org/images/products/123/456/789/0123/front_pt.1.400.jpg',
          name: 'Arroz Integral',
          category: 'Marca Teste',
          tags: ['1kg'],
          source: 'open-food-facts',
        },
      ]);
    });
  });

  describe('importProductImage', () => {
    const offImageUrl =
      'https://images.openfoodfacts.org/images/products/123/456/789/0123/front_pt.1.400.jpg';

    it('should import image for a gestor using their market', async () => {
      openFoodFactsService.isOpenFoodFactsImageUrl.mockReturnValue(true);
      uploadService.importFromOpenFoodFacts.mockResolvedValue(
        'https://supabase.example/storage/v1/object/public/market-images/market-1-abc.jpg',
      );

      const result = await catalogService.importProductImage(
        offImageUrl,
        undefined,
        {
          id: 'user-1',
          role: 'GESTOR_MERCADO',
          email: 'g@test.com',
          marketId: 'market-1',
        } as never,
      );

      expect(uploadService.importFromOpenFoodFacts).toHaveBeenCalledWith(
        offImageUrl,
        'market-1',
      );
      expect(result).toEqual({
        url: 'https://supabase.example/storage/v1/object/public/market-images/market-1-abc.jpg',
      });
    });

    it('should import image for an admin with marketId in the body', async () => {
      openFoodFactsService.isOpenFoodFactsImageUrl.mockReturnValue(true);
      uploadService.importFromOpenFoodFacts.mockResolvedValue(
        'https://supabase.example/storage/v1/object/public/market-images/market-2-abc.jpg',
      );

      const result = await catalogService.importProductImage(
        offImageUrl,
        'market-2',
        { id: 'admin-1', role: 'ADMIN_GERAL', email: 'a@test.com' } as never,
      );

      expect(uploadService.importFromOpenFoodFacts).toHaveBeenCalledWith(
        offImageUrl,
        'market-2',
      );
      expect(result).toEqual({
        url: 'https://supabase.example/storage/v1/object/public/market-images/market-2-abc.jpg',
      });
    });

    it('should reject URLs from outside Open Food Facts', async () => {
      openFoodFactsService.isOpenFoodFactsImageUrl.mockReturnValue(false);

      await expect(
        catalogService.importProductImage(
          'https://evil.example.com/x.jpg',
          undefined,
          {
            id: 'user-1',
            role: 'GESTOR_MERCADO',
            email: 'g@test.com',
            marketId: 'market-1',
          } as never,
        ),
      ).rejects.toThrow('A imagem deve ser originada no Open Food Facts.');
    });

    it('should require a market for admins', async () => {
      openFoodFactsService.isOpenFoodFactsImageUrl.mockReturnValue(true);

      await expect(
        catalogService.importProductImage(offImageUrl, undefined, {
          id: 'admin-1',
          role: 'ADMIN_GERAL',
          email: 'a@test.com',
        } as never),
      ).rejects.toThrow('O administrador deve informar o mercado da imagem.');
    });

    it('should forbid gestor without a bound market', async () => {
      openFoodFactsService.isOpenFoodFactsImageUrl.mockReturnValue(true);

      await expect(
        catalogService.importProductImage(offImageUrl, undefined, {
          id: 'user-1',
          role: 'GESTOR_MERCADO',
          email: 'g@test.com',
          marketId: null,
        } as never),
      ).rejects.toThrow('Gestor sem mercado vinculado.');
    });
  });
});
