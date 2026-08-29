import api from './api';

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/api/dashboard/stats');
    return res.data.data || res.data;
  },
};
