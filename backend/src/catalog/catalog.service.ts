import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadService } from '../upload/upload.service';
import { rethrowPrismaError } from '../prisma/prisma-error.utils';
import { AuthenticatedUser } from '../types/express';
import { OpenFoodFactsService } from './open-food-facts.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
} from './dto/product.dto';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private openFoodFactsService: OpenFoodFactsService,
    private uploadService: UploadService,
  ) {}

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
  }

  async findAllProducts() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        market: true,
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByMarket(marketId: string) {
    return this.prisma.product.findMany({
      where: {
        marketId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
  }

  async getProductsByCategory(categoryId: string) {
    return this.prisma.product.findMany({
      where: { categoryId },
      include: {
        market: true,
        category: true,
      },
    });
  }

  private async assertProductAccess(id: string, user: AuthenticatedUser) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    if (
      user.role === UserRole.GESTOR_MERCADO &&
      product.marketId !== user.marketId
    ) {
      throw new ForbiddenException(
        'Você só pode gerenciar produtos do seu mercado.',
      );
    }
    return product;
  }

  async createProduct(
    createProductDto: CreateProductDto,
    user: AuthenticatedUser,
  ) {
    if (user.role === UserRole.GESTOR_MERCADO && !user.marketId) {
      throw new ForbiddenException('Gestor sem mercado vinculado.');
    }
    const { marketId: requestedMarketId, ...productData } = createProductDto;
    if (user.role === UserRole.ADMIN_GERAL && !requestedMarketId) {
      throw new ForbiddenException(
        'O administrador deve informar o mercado do produto.',
      );
    }
    const created = await this.prisma.product.create({
      data: {
        ...productData,
        marketId:
          user.role === UserRole.GESTOR_MERCADO
            ? user.marketId!
            : requestedMarketId!,
      },
      include: {
        category: true,
      },
    });
    await this.notificationsService.evaluateProductStock(created.id);
    return created;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    user: AuthenticatedUser,
  ) {
    await this.assertProductAccess(id, user);
    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: {
          category: true,
        },
      });
      await this.notificationsService.evaluateProductStock(updated.id);
      return updated;
    } catch (error) {
      // Corrida: produto removido entre a checagem e o update
      rethrowPrismaError(error, { notFoundMessage: 'Produto não encontrado' });
    }
  }

  async deleteProduct(id: string, user: AuthenticatedUser) {
    await this.assertProductAccess(id, user);
    try {
      return await this.prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      rethrowPrismaError(error, { notFoundMessage: 'Produto não encontrado' });
    }
  }

  async updateStock(
    id: string,
    stockData: UpdateStockDto,
    user: AuthenticatedUser,
  ) {
    await this.assertProductAccess(id, user);
    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: {
          stock: stockData.stock,
          minStock: stockData.minStock,
        },
        include: {
          category: true,
        },
      });
      await this.notificationsService.evaluateProductStock(updated.id);
      return updated;
    } catch (error) {
      rethrowPrismaError(error, { notFoundMessage: 'Produto não encontrado' });
    }
  }

  async createCategory(createCategoryDto: Prisma.CategoryUncheckedCreateInput) {
    return this.prisma.category.create({
      data: createCategoryDto,
      include: {
        products: true,
      },
    });
  }

  async updateCategory(
    id: string,
    updateCategoryDto: Prisma.CategoryUncheckedUpdateInput,
  ) {
    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          products: true,
        },
      });
    } catch (error) {
      rethrowPrismaError(error, {
        notFoundMessage: 'Categoria não encontrada',
      });
    }
  }

  async deleteCategory(id: string) {
    try {
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      rethrowPrismaError(error, {
        notFoundMessage: 'Categoria não encontrada',
      });
    }
  }

  async getProductImagesLibrary() {
    return this.prisma.productImage.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca imagens reais de produtos no Open Food Facts (fotos da embalagem).
   * O resultado é usado na tela de criação de produto como nova galeria.
   */
  async searchProductImages(query: string) {
    const results = await this.openFoodFactsService.searchProducts(query);
    return results.map((item) => ({
      id: `off-${item.code}`,
      url: item.imageUrl,
      name: item.productName,
      category: item.brands,
      tags: item.quantity ? [item.quantity] : [],
      source: 'open-food-facts' as const,
    }));
  }

  /**
   * Importa uma imagem do Open Food Facts e a rehospeda no armazenamento do
   * mercado (Supabase), retornando a URL pública permanente do produto.
   */
  async importProductImage(
    imageUrl: string,
    marketId: string | undefined,
    user: AuthenticatedUser,
  ) {
    if (!this.openFoodFactsService.isOpenFoodFactsImageUrl(imageUrl)) {
      throw new BadRequestException(
        'A imagem deve ser originada no Open Food Facts.',
      );
    }

    const targetMarketId =
      user.role === UserRole.GESTOR_MERCADO ? user.marketId : marketId;

    if (!targetMarketId) {
      if (user.role === UserRole.ADMIN_GERAL) {
        throw new BadRequestException(
          'O administrador deve informar o mercado da imagem.',
        );
      }
      throw new ForbiddenException('Gestor sem mercado vinculado.');
    }

    const url = await this.uploadService.importFromOpenFoodFacts(
      imageUrl,
      targetMarketId,
    );
    return { url };
  }
}
