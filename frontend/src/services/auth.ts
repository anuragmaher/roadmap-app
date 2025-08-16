import axios from 'axios';
import { AuthResponse } from '../types';

// Handle API URL with or without trailing slash
let API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Ensure the base URL doesn't end with a slash to prevent double slashes
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL + 'api';
} else {
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