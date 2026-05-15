import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('auth_token').then((token) => {
      setIsOnboarded(!!token);
      setChecking(false);
    });
  }, []);

  if (checking) return null;
  return <AppNavigator isOnboarded={isOnboarded} />;
}
