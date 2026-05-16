import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  setAuthenticated: async (token) => {
    await AsyncStorage.setItem('auth_token', token);
    set({ isAuthenticated: true });
  },
  clearAuth: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ isAuthenticated: false });
  },
}));

export default useAuthStore;
