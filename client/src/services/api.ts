import axios from 'axios';
import { AuthResponse, Delivery, User, Vehicle } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: Partial<User> & { password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },
};

// Vehicle API
export const vehicleApi = {
  getAll: async (): Promise<Vehicle[]> => {
    const response = await api.get<Vehicle[]>('/vehicles');
    return response.data;
  },

  getById: async (id: string): Promise<Vehicle> => {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  updateLocation: async (id: string, coordinates: [number, number]): Promise<Vehicle> => {
    const response = await api.patch<Vehicle>(`/vehicles/${id}/location`, { coordinates });
    return response.data;
  },

  updateStatus: async (id: string, status: Vehicle['status']): Promise<Vehicle> => {
    const response = await api.patch<Vehicle>(`/vehicles/${id}/status`, { status });
    return response.data;
  },
};

// Delivery API
export const deliveryApi = {
  getAll: async (): Promise<Delivery[]> => {
    const response = await api.get<Delivery[]>('/deliveries');
    return response.data;
  },

  getById: async (id: string): Promise<Delivery> => {
    const response = await api.get<Delivery>(`/deliveries/${id}`);
    return response.data;
  },

  create: async (deliveryData: Partial<Delivery>): Promise<Delivery> => {
    const response = await api.post<Delivery>('/deliveries', deliveryData);
    return response.data;
  },

  updateStatus: async (id: string, status: Delivery['status']): Promise<Delivery> => {
    const response = await api.patch<Delivery>(`/deliveries/${id}/status`, { status });
    return response.data;
  },

  addProofOfDelivery: async (id: string, photo: string, signature: string): Promise<Delivery> => {
    const response = await api.post<Delivery>(`/deliveries/${id}/proof`, { photo, signature });
    return response.data;
  },
};

export default api; 