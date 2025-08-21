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
  API_BASE_URL = `${API_BASE_URL}/api`;
}

const api = axios.create({
  baseURL: API_BASE_URL
});

// Add interceptor to include debug_tenant parameter in requests
api.interceptors.request.use((config) => {
  const urlParams = new URLSearchParams(window.location.search);
  const debugTenant = urlParams.get('debug_tenant');
  
  if (debugTenant) {
    // Add debug_tenant as a custom header
    config.headers['X-Debug-Tenant'] = debugTenant;
  }
  
  return config;
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

export const register = async (email: string, password: string, companyName: string, companySize: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { email, password, companyName, companySize });
  return response.data;
};

export const checkSubdomainAvailability = async (companyName: string) => {
  const response = await api.post('/subdomain/check-availability', { companyName });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export { api };
