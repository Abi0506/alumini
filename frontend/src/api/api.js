
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/alumni',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});


// src/api/api.js – updated searchAlumni
export const searchAlumni = async (filters = {}) => {
  try {
    const response = await api.post('/search', filters);
    
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      return []; // fallback
    }
  } catch (error) {
    console.error('searchAlumni failed:', error);
    throw new Error(error.response?.data?.error || 'Search failed');
  }
};

export const saveAlumni = async (alumniData) => {
  try {
    const response = await api.post('/', alumniData);
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
      headers: { 'Content-Type': 'multipart/form-data' },
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