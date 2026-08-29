import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/api/notifications');
    return res.data.data || res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get('/api/notifications/unread-count');
    return res.data.data ?? res.data.count ?? 0;
  },
  markAsRead: async (id: string) => {
    const res = await api.put(`/api/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.put('/api/notifications/read-all');
    return res.data;
  },
};
