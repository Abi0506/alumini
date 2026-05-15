
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/alumni',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});
export const searchAlumni = async (filters = {}, page = 1) => {
  try {
    const response = await api.post('/search', { ...filters, page });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Search failed');
  }
};

export const searchAlumniWithAI = async (query, page = 1) => {
  try {
    const response = await api.post('/ai-search', { query, page });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'AI search failed');
  }
};

export const saveAlumni = async (alumniData) => {
  try {
    const response = await api.post('/', alumniData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Save failed');
  }
};

export const importExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Import failed');
  }
  
};

export const getDepartments = async () => {
  try {
    const response = await api.get('/departments');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to load departments');
  }
};
