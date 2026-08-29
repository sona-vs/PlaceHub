import api from './api';

export const authService = {
  login: async (email?: string, password?: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/api/auth/me');
    return res.data.data;
  },
};
