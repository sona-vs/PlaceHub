import api from './api';

export const reportService = {
  getCompanyRegistrations: async () => {
    const res = await api.get('/api/reports/company-registrations');
    return res.data.data || res.data;
  },
  getDriveSelections: async () => {
    const res = await api.get('/api/reports/drive-selections');
    return res.data.data || res.data;
  },
  getPlacementMaster: async () => {
    const res = await api.get('/api/reports/placement-master');
    return res.data.data || res.data;
  },
  getCompanyMaster: async () => {
    const res = await api.get('/api/reports/company-master');
    return res.data.data || res.data;
  },
};
