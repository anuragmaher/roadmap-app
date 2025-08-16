export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Roadmap {
  _id: string;
  title: string;
  description: string;
  slug: string;
  owner: User;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items?: Item[];
}

export interface Item {
  _id: string;
  title: string;
  description: string;
  quarter: string; // Format: "YYYY-QN" (e.g., "2025-Q1")
  tags: string[];
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  roadmap: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  mode: 'light' | 'dark';
}