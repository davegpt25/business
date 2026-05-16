import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import useAuthStore from '../store/useAuthStore';
import { authAPI } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

export default function OnboardingScreen() {
  const { setAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleToken(response.authentication.accessToken);
    } else if (response?.type === 'error') {
      Alert.alert('로그인 실패', response.error?.message || '다시 시도해주세요.');
    }
  }, [response]);

  const handleGoogleToken = async (accessToken) => {
    setLoading(true);
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoRes.json();
      const res = await authAPI.socialLogin({
        provider: 'google',
        provider_id: userInfo.id,
        email: userInfo.email,
        nickname: userInfo.name,
      });
      await setAuthenticated(res.data.token);
    } catch {
      Alert.alert('로그인 실패', '서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👗</Text>
      <Text style={styles.title}>클로젯핏</Text>
      <Text style={styles.subtitle}>이미 가진 옷으로, 더 잘 입는다</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#222" style={{ marginTop: 32 }} />
      ) : (
        <TouchableOpacity
          style={[styles.googleButton, !request && styles.disabled]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>Google로 계속하기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 48, textAlign: 'center' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd',
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#4285F4', marginRight: 10 },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: '#222' },
  disabled: { opacity: 0.5 },
});
