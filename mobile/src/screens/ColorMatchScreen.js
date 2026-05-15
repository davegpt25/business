import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import useClosetStore from '../store/useClosetStore';

export default function ColorMatchScreen({ navigation }) {
  const { items, fetchItems } = useClosetStore();

  useEffect(() => { fetchItems('top'); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>기준 아이템 선택</Text>
      <Text style={styles.subtitle}>어울리는 조합을 찾을 아이템을 선택하세요</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemRow}
            onPress={() => navigation.navigate('OutfitResult', { baseItemId: item.id })}
          >
            <View style={[styles.colorDot, { backgroundColor: item.primary_color || '#ddd' }]} />
            <View>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <Text style={styles.itemColor}>{item.primary_color_name || item.primary_color || '색상 없음'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', marginBottom: 24, fontSize: 14 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', marginBottom: 8,
  },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  itemCategory: { fontSize: 11, color: '#888', textTransform: 'uppercase' },
  itemColor: { fontSize: 16, fontWeight: '500', marginTop: 2 },
});
