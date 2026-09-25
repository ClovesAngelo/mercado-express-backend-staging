import api from './api';

export interface Category {
  id: string;
  name: string;
}

export interface ProductImage {
  id: string;
  url: string;
  name: string;
  category?: string;
  tags: string[];
}

/** Resultado de busca no Open Food Facts (mapeado pelo backend). */
export interface ProductImageSearchResult {
  id: string;
  url: string;
  name: string;
  category?: string;
  tags: string[];
  source: 'open-food-facts';
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  marketId: string;
  stock: number;
  minStock: number;
}

export const productService = {
  getCategories: async (): Promise<Category[]> => {
    const { data } = await api.get('/catalog/categories');
    return data;
  },

  getProductImagesLibrary: async (): Promise<ProductImage[]> => {
    const { data } = await api.get('/catalog/product-images/library');
    return data;
  },

  /** Busca imagens reais de produtos no Open Food Facts (foto da embalagem). */
  searchProductImages: async (query: string): Promise<ProductImageSearchResult[]> => {
    const { data } = await api.get('/catalog/product-images/search', {
      params: { q: query },
    });
    return data;
  },

  /** Importa a imagem escolhida do Open Food Facts para o armazenamento do mercado. */
  importProductImage: async (imageUrl: string): Promise<{ url: string }> => {
    const { data } = await api.post('/catalog/product-images/import', {
      imageUrl,
    });
    return data;
  },

  createProduct: async (productData: CreateProductData) => {
    const { data } = await api.post('/catalog/products', productData);
    return data;
  },

  getProductsByMarket: async (marketId: string) => {
    const { data } = await api.get(`/catalog/products/market/${marketId}`);
    return data;
  },

  updateProduct: async (id: string, updateData: any) => {
    const { data } = await api.patch(`/catalog/products/${id}`, updateData);
    return data;
  },

  deleteProduct: async (id: string) => {
    const { data } = await api.delete(`/catalog/products/${id}`);
    return data;
  },

  updateStock: async (id: string, stock: number, minStock: number) => {
    const { data } = await api.patch(`/catalog/products/${id}/stock`, { stock, minStock });
    return data;
  },
};