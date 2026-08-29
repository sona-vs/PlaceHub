import api from './api';

export const companyService = {
  getCompanies: async (params?: any) => {
    const res = await api.get('/api/companies', { params });
    return res.data.data || res.data;
  },
  getCompany: async (id: string) => {
    const res = await api.get(`/api/companies/${id}`);
    return res.data.data || res.data;
  },
  getPlacements: async (id: string) => {
    const res = await api.get(`/api/companies/${id}/placements`);
    return res.data.data || res.data;
  },
  createCompany: async (data: any) => {
    const res = await api.post('/api/companies', data);
    return res.data.data || res.data;
  },
  updateCompany: async (id: string, data: any) => {
    const res = await api.put(`/api/companies/${id}`, data);
    return res.data.data || res.data;
  },
  deleteCompany: async (id: string) => {
    const res = await api.delete(`/api/companies/${id}`);
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await api.put(`/api/companies/${id}/status`, { status });
    return res.data.data || res.data;
  },
  forwardCompany: async (id: string) => {
    const res = await api.post(`/api/companies/${id}/forward`);
    return res.data;
  },
  approveCompany: async (id: string) => {
    const res = await api.post(`/api/companies/${id}/approve`);
    return res.data;
  },
  rejectCompany: async (id: string) => {
    const res = await api.post(`/api/companies/${id}/reject`);
    return res.data;
  },
  uploadJD: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/api/companies/${id}/upload-jd`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
