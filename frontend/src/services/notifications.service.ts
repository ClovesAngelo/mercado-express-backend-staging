import api from './api';

export interface StockNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  productId?: string | null;
  marketId?: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    imageUrl?: string | null;
    stock: number;
    minStock: number;
  } | null;
}

export const notificationsService = {
  getNotifications: async (): Promise<StockNotification[]> => {
    const { data } = await api.get('/notifications');
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count');
    return data.count;
  },

  markAsRead: async (id: string) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },
};