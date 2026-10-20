// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useApp } from '@/hooks/useApp';
import { PROVINCES, VEHICLES, CARGO_TYPES } from '@/constants/config';
import { FreightRequest } from '@/services/types';
import { formatIQD } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { colors, layout, spacing, typography } from '@/constants/theme';

export default function CreateRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { merchantName, addRequest } = useApp();

  const [pickupProvince, setPickupProvince] = useState('');
  const [deliveryProvince, setDeliveryProvince] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [weight, setWeight] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [description, setDescription] = useState('');
  const [cargoImage, setCargoImage] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const provinceItems = useMemo(() => PROVINCES.map((p) => ({ id: p, label: p, icon: 'map-marker' })), []);
  const vehicleItems = useMemo(
    () => VEHICLES.map((v) => ({ id: v.id, label: v.label, icon: v.icon, meta: `حتى ${v.capacity} طن` })),
    []
  );
  const cargoItems = useMemo(() => CARGO_TYPES.map((c) => ({ id: c, label: c, icon: 'package-variant' })), []);

  const priceNum = parseInt(price || '0', 10);

  const submit = async () => {
    if (submitting) return;
    if (!pickupProvince || !deliveryProvince || !weight || !cargoType || !vehicle || !price) {
      showAlert('بيانات ناقصة', 'يرجى إكمال المحافظات والحمولة والمركبة والسعر.');
      return;
    }
    if (!Number.isFinite(Number(weight)) || Number(weight) <= 0 || !Number.isFinite(priceNum) || priceNum <= 0) {
      showAlert('بيانات غير صالحة', 'أدخل وزناً وسعراً أكبر من صفر.'); return;
    }
    const req: FreightRequest = {
      id: `r${Date.now()}`,
      merchantName: merchantName || 'تاجر BAZGO',
      merchantRating: 4.7,
      pickupProvince,
      pickupArea: '',
      pickupAddress,
      deliveryProvince,
      deliveryArea: '',
      deliveryAddress,
      weightTons: parseFloat(weight) || 0,
      cargoType,
      cargoDescription: description,
      cargoImage: cargoImage || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
      vehicleType: vehicle,
      priceIQD: priceNum,
      pickupDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      notes,
      status: 'open',
      distanceKm: 350,
      createdAt: Date.now(),
    };
    setSubmitting(true);
    try {
      await addRequest(req);
      router.replace('/(tabs)/requests');
    } catch (error) { showAlert('تعذر النشر', error instanceof Error ? error.message : 'حاول مجدداً.'); }
    finally { setSubmitting(false); }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header title="طلب ناقل جديد" showBack />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>موقع التحميل</Text>
          <SelectField
            label="محافظة التحميل"
            title="اختر محافظة التحميل"
            placeholder="اضغط لاختيار المحافظة"
            items={provinceItems}
            selectedId={pickupProvince}
            onSelect={setPickupProvince}
          />
          <Field label="عنوان التحميل" value={pickupAddress} onChangeText={setPickupAddress} placeholder="المنطقة والشارع" />

          <Text style={styles.section}>موقع التفريغ</Text>
          <SelectField
            label="محافظة التفريغ"
            title="اختر محافظة التفريغ"
            placeholder="اضغط لاختيار المحافظة"
            items={provinceItems}
            selectedId={deliveryProvince}
            onSelect={setDeliveryProvince}
          />
          <Field label="عنوان التفريغ" value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="المنطقة والشارع" />

          <Text style={styles.section}>الحمولة</Text>
          <Field label="الوزن (طن)" value={weight} onChangeText={setWeight} placeholder="مثال: 20" keyboardType="numeric" />
          <SelectField
            label="نوع الحمولة"
            title="اختر نوع الحمولة"
            placeholder="اضغط لاختيار نوع الحمولة"
            items={cargoItems}
            selectedId={cargoType}
            onSelect={setCargoType}
          />
          <Field label="وصف الحمولة" value={description} onChangeText={setDescription} placeholder="تفاصيل إضافية" multiline />
          <Text style={styles.imageLabel}>صورة عن البضاعة (اختياري)</Text>
          <View style={styles.cargoImageWrap}>
            <ImageUpload label="اضغط لإضافة صورة" value={cargoImage} onChange={setCargoImage} icon="image-plus" />
          </View>

          <Text style={styles.section}>المركبة المطلوبة</Text>
          <SelectField
            label="نوع المركبة"
            title="اختر نوع المركبة"
            placeholder="اضغط لاختيار نوع المركبة"
            items={vehicleItems}
            selectedId={vehicle}
            onSelect={setVehicle}
          />

          <Text style={styles.section}>السعر والملاحظات</Text>
          <Field label="سعر النقل (دينار عراقي)" value={price} onChangeText={setPrice} placeholder="مثال: 1500000" keyboardType="numeric" />
          {priceNum > 0 ? <Text style={styles.priceHint}>{formatIQD(priceNum)}</Text> : null}
          <Field label="ملاحظات إضافية" value={notes} onChangeText={setNotes} placeholder="تعليمات خاصة" multiline />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button title="نشر الطلب" variant="emphasis" onPress={submit} loading={submitting} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.md, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  section: { ...typography.section, color: colors.primary, textAlign: 'right', marginTop: spacing.sm, marginBottom: spacing.sm },
  imageLabel: { ...typography.label, color: colors.text, textAlign: 'right', marginBottom: spacing.xs },
  cargoImageWrap: { width: 150, alignSelf: 'flex-end', marginBottom: spacing.md },
  priceHint: { ...typography.bodyStrong, color: colors.success, textAlign: 'right', marginTop: -spacing.sm, marginBottom: spacing.md },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
