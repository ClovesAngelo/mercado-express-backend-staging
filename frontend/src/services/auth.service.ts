import api from './api';

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN_GERAL' | 'GESTOR_MERCADO' | 'CLIENTE';
    marketId?: string;
  };
}

interface RegisterResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN_GERAL' | 'GESTOR_MERCADO' | 'CLIENTE';
    marketId?: string;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  register: async (email: string, name: string, password: string): Promise<RegisterResponse> => {
    const { data } = await api.post('/auth/register', { email, name, password });
    return data;
  },

  validateToken: async (userId: string): Promise<{ id: string; email: string; name: string; role: string; marketId?: string }> => {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  },
};