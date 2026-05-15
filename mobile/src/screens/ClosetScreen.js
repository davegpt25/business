import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native';
import useClosetStore from '../store/useClosetStore';

export default function ClosetScreen({ navigation }) {
  const { items, loading, fetchItems, deleteItem } = useClosetStore();

  useEffect(() => { fetchItems(); }, []);

  return (
    <View style={styles.container}>
      <Button title="+ 옷 추가" onPress={() => navigation.navigate('AddItem')} />
      {loading && <Text style={styles.loading}>불러오는 중...</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.colorDot, { backgroundColor: item.primary_color || '#ddd' }]} />
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.color}>{item.primary_color_name || item.primary_color || '색상 없음'}</Text>
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <Text style={styles.delete}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  loading: { textAlign: 'center', padding: 16, color: '#888' },
  card: {
    flex: 1, margin: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8,
  },
  colorDot: { width: 32, height: 32, borderRadius: 16, marginBottom: 8 },
  category: { fontWeight: 'bold', textTransform: 'uppercase', fontSize: 11, color: '#888' },
  color: { fontSize: 14, marginTop: 2 },
  delete: { color: '#e53e3e', marginTop: 8, fontSize: 12 },
});
