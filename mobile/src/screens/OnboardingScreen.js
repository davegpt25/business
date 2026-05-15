import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>클로젯핏에 오신 것을 환영합니다</Text>
      <Text style={styles.subtitle}>이미 가진 옷으로, 더 잘 입는다</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Main')}>
        <Text style={styles.buttonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32, textAlign: 'center' },
  button: { backgroundColor: '#222', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
