import { api } from './auth';
import { Roadmap, Item } from '../types';

export const roadmapApi = {
  getPublic: async (): Promise<Roadmap[]> => {
    const response = await api.get('/roadmaps/public');
    return response.data;
  },

  getUserRoadmaps: async (): Promise<Roadmap[]> => {
    const response = await api.get('/roadmaps');
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Roadmap> => {
    const response = await api.get(`/roadmaps/${slug}`);
    return response.data;
  },

  create: async (data: { title: string; description: string; isPublic: boolean }): Promise<Roadmap> => {
    const response = await api.post('/roadmaps', data);
    return response.data;
  },

  update: async (slug: string, data: Partial<Roadmap>): Promise<Roadmap> => {
    const response = await api.put(`/roadmaps/${slug}`, data);
    return response.data;
  },

  delete: async (slug: string): Promise<void> => {
    await api.delete(`/roadmaps/${slug}`);
  }
};

export const itemApi = {
  getByRoadmap: async (roadmapId: string, quarter?: string): Promise<Item[]> => {
    const params = quarter ? { quarter } : {};
    const response = await api.get(`/items/roadmap/${roadmapId}`, { params });
    return response.data;
  },

  getByQuarter: async (roadmapSlug: string, quarter: string) => {
    const response = await api.get(`/items/roadmap/${roadmapSlug}/quarter/${quarter}`);
    return response.data;
  },

  create: async (roadmapId: string, data: Omit<Item, '_id' | 'roadmap' | 'createdAt' | 'updatedAt'>): Promise<Item> => {
    const response = await api.post(`/items/roadmap/${roadmapId}`, data);
    return response.data;
  },

  update: async (itemId: string, data: Partial<Item>): Promise<Item> => {
    const response = await api.put(`/items/${itemId}`, data);
    return response.data;
  },

  delete: async (itemId: string): Promise<void> => {
    await api.delete(`/items/${itemId}`);
  }
};
