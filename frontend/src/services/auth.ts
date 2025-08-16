import axios from 'axios';
import { AuthResponse } from '../types';

// Set the base API URL
let API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Handle API base URL properly
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1); // Remove trailing slash
}

// If the URL doesn't already include /api, add it
if (!API_BASE_URL.includes('/api')) {
  API_BASE_URL = API_BASE_URL + '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export { api };