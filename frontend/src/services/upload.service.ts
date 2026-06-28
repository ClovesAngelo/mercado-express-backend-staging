import api from './api';

export const uploadService = {
  uploadProductImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/upload/product-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data.url;
  },
  deleteProductImage: async (imageUrl: string): Promise<void> => {
    await api.delete('/upload/product-image', {
      data: { imageUrl },
    });
  },

};