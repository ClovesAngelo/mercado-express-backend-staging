import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Req,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
  ImportProductImageDto,
} from './dto/product.dto';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  private readonly logger = new Logger(CatalogController.name);
  constructor(private catalogService: CatalogService) {}

  @Get('categories')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO, UserRole.CLIENTE)
  async findAllCategories() {
    try {
      return await this.catalogService.findAllCategories();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching categories: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar categorias',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('categories')
  @Roles(UserRole.ADMIN_GERAL)
  async createCategory(@Body() createCategoryDto: { name: string }) {
    try {
      return await this.catalogService.createCategory(createCategoryDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR creating category: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao criar categoria',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('products')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO, UserRole.CLIENTE)
  async findAllProducts() {
    try {
      return await this.catalogService.findAllProducts();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching all products: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar produtos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('products/market/:marketId')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO, UserRole.CLIENTE)
  async findByMarket(@Param('marketId') marketId: string) {
    try {
      return await this.catalogService.findByMarket(marketId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching products by market: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar produtos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
  ) {
    try {
      return await this.catalogService.createProduct(
        createProductDto,
        req.user!,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR creating product: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao criar produto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('products/:id')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request,
  ) {
    try {
      return await this.catalogService.updateProduct(
        id,
        updateProductDto,
        req.user!,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR updating product: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar produto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('products/:id/stock')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async updateStock(
    @Param('id') id: string,
    @Body() stockData: UpdateStockDto,
    @Req() req: Request,
  ) {
    try {
      return await this.catalogService.updateStock(id, stockData, req.user!);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR updating stock: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar estoque',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async deleteProduct(@Param('id') id: string, @Req() req: Request) {
    try {
      return await this.catalogService.deleteProduct(id, req.user!);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR deleting product: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao excluir produto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('product-images/library')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO, UserRole.CLIENTE)
  async getProductImagesLibrary() {
    try {
      return await this.catalogService.getProductImagesLibrary();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching product images library: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar biblioteca de imagens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('product-images/search')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async searchProductImages(@Query('q') query?: string) {
    try {
      if (!query || !query.trim()) {
        throw new HttpException(
          'Informe um termo de busca.',
          HttpStatus.BAD_REQUEST,
        );
      }
      return await this.catalogService.searchProductImages(query);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR searching product images: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message ||
          'Erro ao buscar imagens no Open Food Facts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('product-images/import')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async importProductImage(
    @Body() importDto: ImportProductImageDto,
    @Req() req: Request,
  ) {
    try {
      return await this.catalogService.importProductImage(
        importDto.imageUrl,
        importDto.marketId,
        req.user!,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR importing product image: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        (error as Error)?.message || 'Erro ao importar imagem',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
