import { BadRequestException, Injectable, Logger } from '@nestjs/common';

export interface OpenFoodFactsProductImage {
  code: string;
  productName: string;
  brands: string;
  quantity: string;
  imageUrl: string;
}

interface OpenFoodFactsSearchItem {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
}

interface OpenFoodFactsSearchResponse {
  count?: number;
  products?: OpenFoodFactsSearchItem[];
}

interface CacheEntry {
  expiresAt: number;
  data: OpenFoodFactsProductImage[];
}

const OFF_SEARCH_HOSTS = [
  'https://world.openfoodfacts.org',
  // Fallback regional: reduz o impacto de 503/rate-limit do cluster principal.
  'https://br.openfoodfacts.org',
];
const OFF_SEARCH_PATH = '/cgi/search.pl';
const OFF_IMAGES_BASE_URL = 'https://images.openfoodfacts.org';
const OFF_USER_AGENT =
  'MercadoExpress/1.0 (https://github.com/ClovesAngelo/mercado-express-backend-staging; contato@mercadoexpress.com.br)';

/**
 * Integração com o Open Food Facts (https://openfoodfacts.org).
 *
 * O OFF é um banco de dados aberto (licença ODbL / imagens CC-BY-SA) com milhões
 * de produtos reais e fotos de embalagem, acessível sem API key.
 * A busca usa o endpoint legado /cgi/search.pl (full-text), que retorna os
 * campos `image_front_url` — a foto 'front' em ~400px, ideal para catálogo.
 *
 * Por padrão, o OFF pede UA identificável e respeita ~100 requisições/minuto.
 * Por isso mantemos um cache em memória (TTL 10min) por termo de busca e
 * tentamos mais de um host (world → br) para tolerar 503 transitórios.
 */
@Injectable()
export class OpenFoodFactsService {
  private readonly logger = new Logger(OpenFoodFactsService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 10 * 60 * 1000;

  async searchProducts(
    query: string,
    limit = 24,
  ): Promise<OpenFoodFactsProductImage[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      throw new BadRequestException('Informe um termo de busca.');
    }
    if (normalizedQuery.length > 100) {
      throw new BadRequestException(
        'Termo de busca muito longo (máx. 100 caracteres).',
      );
    }
    const pageSize = Math.min(Math.max(limit, 1), 48);

    const cacheKey = `${normalizedQuery.toLowerCase()}:${pageSize}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const params = new URLSearchParams({
      search_terms: normalizedQuery,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: String(pageSize),
      fields: 'code,product_name,brands,image_front_url,quantity',
      lang: 'pt',
    });

    this.logger.log(
      `Buscando imagens no Open Food Facts: "${normalizedQuery}"`,
    );

    let payload: OpenFoodFactsSearchResponse | null = null;
    let lastError: Error | null = null;

    for (const host of OFF_SEARCH_HOSTS) {
      const url = `${host}${OFF_SEARCH_PATH}?${params.toString()}`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': OFF_USER_AGENT },
          signal: AbortSignal.timeout(8_000),
        });

        if (!response.ok) {
          lastError = new Error(
            `Open Food Facts respondeu HTTP ${response.status}.`,
          );
          this.logger.warn(`Falha ao buscar em ${host}: ${lastError.message}`);
          continue;
        }
        payload = (await response.json()) as OpenFoodFactsSearchResponse;
        break;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Falha ao buscar em ${host}: ${lastError.message}`);
      }
    }

    if (!payload) {
      this.logger.error(
        `Falha ao consultar o Open Food Facts: ${lastError?.message ?? 'erro desconhecido'}`,
      );
      throw new Error(
        'Serviço de busca de imagens indisponível no momento. Tente novamente em instantes.',
      );
    }

    const results = (payload.products ?? [])
      .filter(
        (
          item,
        ): item is OpenFoodFactsSearchItem & {
          image_front_url: string;
          code?: string;
          product_name?: string;
          brands?: string;
          quantity?: string;
        } => Boolean(item.image_front_url),
      )
      .map((item) => ({
        code: item.code ?? '',
        productName: this.fallbackText(item.product_name, 'Produto sem nome'),
        brands: this.fallbackText(item.brands, 'Marca não informada'),
        quantity: this.fallbackText(item.quantity, ''),
        imageUrl: item.image_front_url,
      }))
      .slice(0, pageSize);

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + this.cacheTtlMs,
      data: results,
    });
    return results;
  }

  isOpenFoodFactsImageUrl(imageUrl: string): boolean {
    return imageUrl.startsWith(`${OFF_IMAGES_BASE_URL}/images/products/`);
  }

  private fallbackText(value: string | undefined, fallback: string): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
  }
}
