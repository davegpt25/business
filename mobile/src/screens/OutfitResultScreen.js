import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { outfitAPI } from '../api/client';

export default function OutfitResultScreen({ route }) {
  const { baseItemId } = route.params;
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    outfitAPI.getRecommendations(baseItemId)
      .then((res) => {
        setRecommendations(res.data.recommendations);
        setLoading(false);
      })
      .catch((err) => {
        setError('추천을 불러오지 못했습니다.');
        setLoading(false);
      });
  }, [baseItemId]);

  if (loading) return <ActivityIndicator style={styles.center} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>추천 코디</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {!error && recommendations.length === 0 && (
        <Text style={styles.empty}>등록된 아이템이 부족합니다. 옷장에 더 추가해보세요.</Text>
      )}
      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.colorBar, { backgroundColor: item.primary_color || '#eee' }]} />
            <View style={styles.info}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.colorName}>{item.primary_color_name || item.primary_color || '색상 없음'}</Text>
              <Text style={styles.score}>호환성: {item.compatibility_score}점</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  error: { color: '#e53e3e', textAlign: 'center', marginTop: 40 },
  card: {
    flexDirection: 'row', backgroundColor: '#f5f5f5',
    borderRadius: 12, marginBottom: 12, overflow: 'hidden',
  },
  colorBar: { width: 8 },
  info: { padding: 16 },
  category: { fontSize: 11, color: '#888', textTransform: 'uppercase' },
  colorName: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  score: { fontSize: 12, color: '#555', marginTop: 4 },
});
