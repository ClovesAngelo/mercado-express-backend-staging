import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OpenFoodFactsService } from './open-food-facts.service';

describe('OpenFoodFactsService', () => {
  let service: OpenFoodFactsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OpenFoodFactsService],
    }).compile();
    service = module.get<OpenFoodFactsService>(OpenFoodFactsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockOkResponse = (payload: unknown) =>
    ({
      ok: true,
      status: 200,
      json: () => Promise.resolve(payload),
    }) as unknown as Response;

  describe('searchProducts', () => {
    it('should reject an empty search term', async () => {
      await expect(service.searchProducts('   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should map results and filter out items without an image', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
        mockOkResponse({
          products: [
            {
              code: '123',
              product_name: 'Arroz Integral',
              brands: 'Marca Teste',
              quantity: '1kg',
              image_front_url:
                'https://images.openfoodfacts.org/images/products/123/front_pt.1.400.jpg',
            },
            { code: '456', product_name: 'Produto sem foto' },
          ],
        }),
      );

      const results = await service.searchProducts('arroz');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        code: '123',
        productName: 'Arroz Integral',
        brands: 'Marca Teste',
        quantity: '1kg',
        imageUrl:
          'https://images.openfoodfacts.org/images/products/123/front_pt.1.400.jpg',
      });
    });

    it('should use fallbacks for missing name, brand and quantity', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue(
        mockOkResponse({
          products: [
            {
              code: '789',
              image_front_url:
                'https://images.openfoodfacts.org/images/products/789/front_pt.1.400.jpg',
            },
          ],
        }),
      );

      const results = await service.searchProducts('sem-nome');

      expect(results[0]).toMatchObject({
        code: '789',
        productName: 'Produto sem nome',
        brands: 'Marca não informada',
        quantity: '',
      });
    });

    it('should cache results for the same query', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
        mockOkResponse({
          products: [
            {
              code: '123',
              product_name: 'Arroz',
              image_front_url:
                'https://images.openfoodfacts.org/images/products/123/front_pt.1.400.jpg',
            },
          ],
        }),
      );

      await service.searchProducts('arroz');
      await service.searchProducts('arroz');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should fall back to the regional host when the main host fails', async () => {
      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response)
        .mockResolvedValueOnce(
          mockOkResponse({
            products: [
              {
                code: '999',
                product_name: 'Arroz Integral',
                image_front_url:
                  'https://images.openfoodfacts.org/images/products/999/front_pt.1.400.jpg',
              },
            ],
          }),
        );

      const results = await service.searchProducts('arroz');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('999');
    });

    it('should throw a friendly error when the API is unreachable', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

      await expect(service.searchProducts('arroz')).rejects.toThrow(
        'Serviço de busca de imagens indisponível no momento.',
      );
    });

    it('should throw a friendly error on non-2xx response', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue({ ok: false, status: 503 } as unknown as Response);

      await expect(service.searchProducts('arroz')).rejects.toThrow(
        'Serviço de busca de imagens indisponível no momento.',
      );
    });
  });

  describe('isOpenFoodFactsImageUrl', () => {
    it('should accept only URLs from the Open Food Facts images host', () => {
      expect(
        service.isOpenFoodFactsImageUrl(
          'https://images.openfoodfacts.org/images/products/123/front_pt.1.400.jpg',
        ),
      ).toBe(true);
      expect(
        service.isOpenFoodFactsImageUrl('https://evil.example.com/x.jpg'),
      ).toBe(false);
      expect(
        service.isOpenFoodFactsImageUrl(
          'https://images.openfoodfacts.org.evil.example/x.jpg',
        ),
      ).toBe(false);
    });
  });
});
