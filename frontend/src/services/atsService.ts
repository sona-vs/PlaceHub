import api from './api';

export const atsService = {
  getATSCompanies: async () => {
    const res = await api.get('/api/ats/companies');
    return res.data.data || res.data;
  },
  runMatching: async (companyId: string) => {
    const res = await api.post(`/api/ats/match/${companyId}`);
    return res.data.data || res.data;
  },
  getResults: async (companyId: string) => {
    const res = await api.get(`/api/ats/results/${companyId}`);
    return res.data.data || res.data;
  },
};
