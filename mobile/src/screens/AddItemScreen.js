import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import useClosetStore from '../store/useClosetStore';
import { uploadAPI } from '../api/client';

const CATEGORIES = [
  { key: 'top', label: '상의' },
  { key: 'bottom', label: '하의' },
  { key: 'outer', label: '아우터' },
  { key: 'shoes', label: '신발' },
  { key: 'accessory', label: '악세서리' },
];

export default function AddItemScreen({ navigation }) {
  const [category, setCategory] = useState('top');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { addItem } = useClosetStore();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadToServer = async (uri) => {
    const filename = uri.split('/').pop();
    const ext = filename.split('.').pop() || 'jpg';
    const formData = new FormData();
    formData.append('image', { uri, name: filename, type: `image/${ext}` });
    const res = await uploadAPI.uploadImage(formData);
    return res.data.url;
  };

  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('이미지를 선택해주세요.');
      return;
    }
    setUploading(true);
    try {
      const imageUrl = await uploadToServer(imageUri);
      await addItem({ category, image_url: imageUrl });
      Alert.alert('등록 완료!', '옷장에 추가되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('등록 실패', '다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.label}>카테고리</Text>
      <View style={styles.row}>
        {CATEGORIES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, category === key && styles.chipSelected]}
            onPress={() => setCategory(key)}
          >
            <Text style={category === key ? styles.chipTextSelected : styles.chipText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>사진</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>📷</Text>
            <Text style={styles.imagePlaceholderText}>사진 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, uploading && styles.disabled]}
        onPress={handleSave}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>저장하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd',
  },
  chipSelected: { backgroundColor: '#222', borderColor: '#222' },
  chipText: { color: '#555', fontSize: 14 },
  chipTextSelected: { color: '#fff', fontSize: 14 },
  imagePicker: {
    height: 220, backgroundColor: '#f8f8f8', borderRadius: 16,
    overflow: 'hidden', marginBottom: 28,
    borderWidth: 1.5, borderColor: '#eee', borderStyle: 'dashed',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderIcon: { fontSize: 36, marginBottom: 8 },
  imagePlaceholderText: { color: '#aaa', fontSize: 15 },
  saveButton: {
    backgroundColor: '#222', padding: 16, borderRadius: 14, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
