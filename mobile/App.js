import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/store/useAuthStore';

export default function App() {
  const [checking, setChecking] = useState(true);
  const { isAuthenticated, setAuthenticated } = useAuthStore();

  useEffect(() => {
    AsyncStorage.getItem('auth_token')
      .then((token) => {
        if (token) setAuthenticated(token);
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
      });
  }, []);

  if (checking) return null;
  return <AppNavigator isOnboarded={isAuthenticated} />;
}
