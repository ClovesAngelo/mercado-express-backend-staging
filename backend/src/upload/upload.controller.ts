import { Controller, Post, Delete, UseGuards, UploadedFile, UseInterceptors, HttpException, HttpStatus, Req, Body, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { UploadService } from './upload.service';
import type { Request } from 'express';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  constructor(private uploadService: UploadService) {}

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    try {
      const user = req.user as any;
      const marketId = user.marketId || user.id;
      const imageUrl = await this.uploadService.uploadProductImage(file, marketId);
      return { url: imageUrl };
    } catch (error) {
      this.logger.error(`ERROR uploading image: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao fazer upload da imagem',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('product-image')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async deleteProductImage(
    @Body('imageUrl') imageUrl: string,
    @Req() req: Request
  ) {
    try {
      await this.uploadService.deleteImage(imageUrl);
      return { success: true };
    } catch (error) {
      this.logger.error(`ERROR deleting image: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao deletar imagem',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}