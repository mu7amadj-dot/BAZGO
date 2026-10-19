// Powered by OnSpace.AI
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '@/template';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (uri: string) => void;
  icon?: string;
}

export function ImageUpload({ label, value, onChange, icon = 'camera-plus-outline' }: ImageUploadProps) {
  const { showAlert } = useAlert();

  const applyResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets?.[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert('الإذن مطلوب', 'يرجى السماح بالوصول إلى الكاميرا لالتقاط الصورة.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      applyResult(result);
    } catch (e) {
      showAlert('تعذّر فتح الكاميرا', 'حدث خطأ أثناء التقاط الصورة. حاول مرة أخرى.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert('الإذن مطلوب', 'يرجى السماح بالوصول إلى الصور لرفع المستند.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      applyResult(result);
    } catch (e) {
      showAlert('تعذّر فتح المعرض', 'حدث خطأ أثناء اختيار الصورة. حاول مرة أخرى.');
    }
  };

  const chooseSource = () => {
    showAlert('إضافة صورة', 'اختر مصدر الصورة', [
      { text: 'التقاط بالكاميرا', onPress: () => takePhoto() },
      { text: 'اختيار من المعرض', onPress: () => pickFromGallery() },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.box, value ? styles.boxFilled : null, pressed && styles.pressed]}
        onPress={chooseSource}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {value ? (
          <>
            <Image source={{ uri: value }} style={styles.preview} contentFit="cover" transition={200} />
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={13} color={colors.onPrimary} />
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name={icon as any} size={24} color={colors.primary} />
            <Text style={styles.hint}>رفع</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  label: { ...typography.caption, color: colors.text, textAlign: 'center', marginBottom: spacing.xs, fontWeight: '600' },
  box: {
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  boxFilled: { borderStyle: 'solid', borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  preview: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', gap: 4 },
  hint: { ...typography.caption, color: colors.textSubtle },
  editBadge: {
    position: 'absolute', bottom: 6, left: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
});
