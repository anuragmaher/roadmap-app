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
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
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