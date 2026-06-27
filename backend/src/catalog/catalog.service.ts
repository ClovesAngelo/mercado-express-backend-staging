import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async createProduct(createProductDto: any) {
    return this.prisma.product.create({
      data: createProductDto,
      include: {
        category: true,
      },
    });
  }

  async updateProduct(id: string, updateProductDto: any) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStock(id: string, stockData: { stock: number; minStock: number }) {
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

  async createCategory(createCategoryDto: any) {
    return this.prisma.category.create({
      data: createCategoryDto,
      include: {
        products: true,
      },
    });
  }

  async updateCategory(id: string, updateCategoryDto: any) {
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