import { api } from './auth';
import { Roadmap, Item } from '../types';

export const roadmapApi = {
  getHomeData: async () => {
    const response = await api.get('/roadmaps/home-data');
    return response.data;
  },

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

export const voteApi = {
  vote: async (itemId: string, email: string): Promise<{ message: string; voteCount: number; isHighDemand: boolean }> => {
    const response = await api.post(`/votes/items/${itemId}/vote`, { email });
    return response.data;
  },

  removeVote: async (itemId: string, email: string): Promise<{ message: string; voteCount: number; isHighDemand: boolean }> => {
    const response = await api.delete(`/votes/items/${itemId}/vote`, { data: { email } });
    return response.data;
  },

  getVotes: async (itemId: string): Promise<{ voteCount: number; isHighDemand: boolean }> => {
    const response = await api.get(`/votes/items/${itemId}/votes`);
    return response.data;
  },

  checkUserVote: async (itemId: string, email: string): Promise<{ hasVoted: boolean }> => {
    const response = await api.get(`/votes/items/${itemId}/vote/check?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  notifyVoters: async (itemId: string): Promise<{ message: string; emails: string[] }> => {
    const response = await api.post(`/votes/items/${itemId}/notify-voters`);
    return response.data;
  }
};

export const tenantApi = {
  getSettings: async () => {
    const response = await api.get('/tenant/settings');
    return response.data;
  },

  updateSettings: async (settings: any) => {
    const response = await api.put('/tenant/settings', settings);
    return response.data;
  },

  getInfo: async () => {
    const response = await api.get('/tenant/info');
    return response.data;
  },

  checkDomainAvailability: async (domain: string, type: 'custom' | 'subdomain' = 'custom') => {
    const response = await api.post('/tenant/check-domain', { domain, type });
    return response.data;
  }
};
