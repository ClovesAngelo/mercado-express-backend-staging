import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../types/express';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
} from './dto/product.dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.product.create({
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
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    user: AuthenticatedUser,
  ) {
    await this.assertProductAccess(id, user);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(id: string, user: AuthenticatedUser) {
    await this.assertProductAccess(id, user);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStock(
    id: string,
    stockData: UpdateStockDto,
    user: AuthenticatedUser,
  ) {
    await this.assertProductAccess(id, user);
    return this.prisma.product.update({
      where: { id },
      data: {
        stock: stockData.stock,
        minStock: stockData.minStock,
      },
      include: {
        category: true,
      },
    });
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
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        products: true,
      },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getProductImagesLibrary() {
    return this.prisma.productImage.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
