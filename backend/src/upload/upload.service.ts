import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private supabase;

  constructor(configService: ConfigService) {
    this.supabase = createClient(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async uploadProductImage(file: Express.Multer.File, marketId: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 5MB.');
    }

    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${marketId}-${uuidv4()}.${fileExt}`;

    this.logger.log(`Fazendo upload: ${fileName}`);

    const { data, error } = await this.supabase.storage
      .from('market-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Erro ao fazer upload: ${error.message}`);
    }

    const { data: publicData } = this.supabase.storage
      .from('market-images')
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      if (fileName) {
        const { error } = await this.supabase.storage
          .from('market-images')
          .remove([fileName]);

        if (error) {
          this.logger.error(`Erro ao deletar imagem: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao processar URL da imagem: ${(error as Error).message}`);
    }
  }
}
