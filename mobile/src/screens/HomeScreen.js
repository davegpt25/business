import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>오늘 뭐 입지?</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ColorMatch')}
      >
        <Text style={styles.buttonText}>코디 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  greeting: { fontSize: 26, fontWeight: 'bold', marginTop: 40, marginBottom: 24 },
  button: {
    backgroundColor: '#222', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
