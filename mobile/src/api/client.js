import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:3000/api/v1';

const client = axios.create({ baseURL: API_BASE, timeout: 15000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  socialLogin: (data) => client.post('/auth/social-login', data),
};

export const uploadAPI = {
  uploadImage: (formData) =>
    client.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
};

export const closetAPI = {
  getItems: (params) => client.get('/closet/items', { params }),
  addItem: (data) => client.post('/closet/items', data),
  deleteItem: (id) => client.delete(`/closet/items/${id}`),
};

export const outfitAPI = {
  getRecommendations: (base_item_id) =>
    client.get('/outfit/recommendations', { params: { base_item_id } }),
};

export default client;
