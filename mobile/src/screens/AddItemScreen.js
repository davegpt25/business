import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import useClosetStore from '../store/useClosetStore';

const CATEGORIES = ['top', 'bottom', 'outer', 'shoes', 'accessory'];

export default function AddItemScreen({ navigation }) {
  const [category, setCategory] = useState('top');
  const [imageUri, setImageUri] = useState(null);
  const { addItem } = useClosetStore();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('이미지를 선택해주세요.');
      return;
    }
    try {
      await addItem({ category, image_url: imageUri });
      Alert.alert('등록 완료!');
      navigation.goBack();
    } catch {
      Alert.alert('등록에 실패했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>카테고리</Text>
      <View style={styles.row}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={category === cat ? styles.chipTextSelected : styles.chipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text>{imageUri ? '이미지 선택됨 ✓' : '이미지 선택'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>저장하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#ccc',
  },
  chipSelected: { backgroundColor: '#222', borderColor: '#222' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff' },
  imagePicker: {
    height: 160, backgroundColor: '#f0f0f0', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#222', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
