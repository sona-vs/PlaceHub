import api from './api';

export const studentService = {
  getStudents: async (params?: any) => {
    const res = await api.get('/api/students', { params });
    return res.data;
  },
  getStudent: async (id: string) => {
    const res = await api.get(`/api/students/${id}`);
    return res.data.data || res.data;
  },
  getStudentStats: async () => {
    const res = await api.get('/api/students/stats');
    return res.data.data || res.data;
  },
  createStudent: async (data: any) => {
    const res = await api.post('/api/students', data);
    return res.data.data || res.data;
  },
  updateStudent: async (id: string, data: any) => {
    const res = await api.put(`/api/students/${id}`, data);
    return res.data.data || res.data;
  },
  deleteStudent: async (id: string) => {
    const res = await api.delete(`/api/students/${id}`);
    return res.data;
  },
  importStudents: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  downloadTemplate: async () => {
    const res = await api.get('/api/students/template', { responseType: 'blob' });
    return res.data;
  },
};
