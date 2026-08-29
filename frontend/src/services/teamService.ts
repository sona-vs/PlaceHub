import api from './api';

export const teamService = {
  getTeam: async () => {
    const res = await api.get('/api/team');
    return res.data.data || res.data;
  },
  getMember: async (id: string) => {
    const res = await api.get(`/api/team/${id}`);
    return res.data.data || res.data;
  },
  createMember: async (data: any) => {
    const res = await api.post('/api/team', data);
    return res.data.data || res.data;
  },
  updateMember: async (id: string, data: any) => {
    const res = await api.put(`/api/team/${id}`, data);
    return res.data.data || res.data;
  },
  deleteMember: async (id: string) => {
    const res = await api.delete(`/api/team/${id}`);
    return res.data;
  },
  assignCompany: async (memberId: string, companyId: string) => {
    const res = await api.put(`/api/team/${memberId}/assign`, { companyId });
    return res.data;
  },
};
