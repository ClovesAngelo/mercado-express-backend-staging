import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private supabase: ReturnType<typeof createClient>;

  constructor(configService: ConfigService) {
    this.supabase = createClient(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async uploadProductImage(
    file: Express.Multer.File,
    marketId: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException(
        'Arquivo muito grande. Tamanho máximo: 5MB.',
      );
    }

    const fileExt = file.originalname.split('.').pop() || 'jpg';
    return this.storeImage(file.buffer, file.mimetype, marketId, fileExt);
  }

  /**
   * Importa para o armazenamento do mercado uma imagem hospedada no Open Food
   * Facts (images.openfoodfacts.org). Baixa a foto do produto, valida tipo e
   * tamanho e rehospeda no Supabase — garantindo durabilidade (não depende do
   * hotlink do OFF) e consistência com o fluxo de upload já existente.
   */
  async importFromOpenFoodFacts(
    imageUrl: string,
    marketId: string,
  ): Promise<string> {
    if (!imageUrl.startsWith('https://images.openfoodfacts.org/')) {
      throw new BadRequestException(
        'A imagem deve ser originada no armazenamento do Open Food Facts.',
      );
    }

    let response: Response;
    try {
      response = await fetch(imageUrl, {
        headers: {
          'User-Agent':
            'MercadoExpress/1.0 (https://github.com/ClovesAngelo/mercado-express-backend-staging)',
        },
        signal: AbortSignal.timeout(15_000),
        redirect: 'follow',
      });
    } catch {
      throw new BadRequestException(
        'Não foi possível baixar a imagem do Open Food Facts.',
      );
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Falha ao baixar a imagem do Open Food Facts (HTTP ${response.status}).`,
      );
    }

    const contentType = (response.headers.get('content-type') ?? '')
      .toLowerCase()
      .trim();
    if (!this.isAllowedContentType(contentType)) {
      throw new BadRequestException(
        'O arquivo baixado não é uma imagem válida (JPG, PNG ou WEBP).',
      );
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagem muito grande (máx. 5MB).');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagem muito grande (máx. 5MB).');
    }

    return this.storeImage(buffer, contentType, marketId);
  }

  private isAllowedContentType(contentType: string): boolean {
    const baseType = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
      baseType,
    );
  }

  private async storeImage(
    buffer: Buffer,
    contentType: string,
    marketId: string,
    fileExtOverride?: string,
  ): Promise<string> {
    const fileExt =
      fileExtOverride ??
      contentType.split('/')[1]?.split(';')[0]?.trim() ??
      'jpg';
    const fileName = `${marketId}-${uuidv4()}.${fileExt}`;

    this.logger.log(`Fazendo upload: ${fileName}`);

    const { error } = await this.supabase.storage
      .from('market-images')
      .upload(fileName, buffer, {
        contentType,
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

  async deleteImage(
    imageUrl: string,
    user: { role: UserRole; marketId?: string | null },
  ): Promise<void> {
    try {
      const url = new URL(imageUrl);
      if (!url.pathname.includes('/storage/v1/object/public/market-images/')) {
        throw new BadRequestException('URL de imagem inválida.');
      }
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      if (
        user.role === UserRole.GESTOR_MERCADO &&
        (!user.marketId || !fileName.startsWith(`${user.marketId}-`))
      ) {
        throw new ForbiddenException(
          'Você só pode excluir imagens do seu mercado.',
        );
      }

      if (fileName) {
        const { error } = await this.supabase.storage
          .from('market-images')
          .remove([fileName]);

        if (error) {
          this.logger.error(`Erro ao deletar imagem: ${error.message}`);
        }
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao processar URL da imagem: ${(error as Error).message}`,
      );
      throw new BadRequestException('URL de imagem inválida.');
    }
  }
}
