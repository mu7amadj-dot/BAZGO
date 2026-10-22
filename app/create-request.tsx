// Powered by OnSpace.AI
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateRequest } from '@/hooks/useCreateRequest';
import { AccountGate } from '@/components/auth/AccountGate';
import { formatIQD } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { colors, layout, spacing, typography } from '@/constants/theme';

export default function CreateRequestScreen() { return <AccountGate><CreateLoadScreen /></AccountGate>; }
function CreateLoadScreen() {
  const insets = useSafeAreaInsets();
  const { form, setField, provinceItems, vehicleItems, cargoItems, priceNum, submit, submitting } = useCreateRequest();
  const { pickupProvince, deliveryProvince, pickupAddress, deliveryAddress, weight, cargoType, description, cargoImage, vehicle, price, notes, pickupDate, distance } = form;

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
            onSelect={(value) => setField('pickupProvince', value)}
          />
          <Field label="عنوان التحميل" value={pickupAddress} onChangeText={(value) => setField('pickupAddress', value)} placeholder="المنطقة والشارع" />

          <Text style={styles.section}>موقع التفريغ</Text>
          <SelectField
            label="محافظة التفريغ"
            title="اختر محافظة التفريغ"
            placeholder="اضغط لاختيار المحافظة"
            items={provinceItems}
            selectedId={deliveryProvince}
            onSelect={(value) => setField('deliveryProvince', value)}
          />
          <Field label="عنوان التفريغ" value={deliveryAddress} onChangeText={(value) => setField('deliveryAddress', value)} placeholder="المنطقة والشارع" />

          <Text style={styles.section}>الحمولة</Text>
          <Field label="الوزن (طن)" value={weight} onChangeText={(value) => setField('weight', value)} placeholder="مثال: 20" keyboardType="numeric" />
          <SelectField
            label="نوع الحمولة"
            title="اختر نوع الحمولة"
            placeholder="اضغط لاختيار نوع الحمولة"
            items={cargoItems}
            selectedId={cargoType}
            onSelect={(value) => setField('cargoType', value)}
          />
          <Field label="وصف الحمولة" value={description} onChangeText={(value) => setField('description', value)} placeholder="تفاصيل إضافية" multiline />
          <Text style={styles.imageLabel}>صورة عن البضاعة (اختياري)</Text>
          <View style={styles.cargoImageWrap}>
            <ImageUpload label="اضغط لإضافة صورة" value={cargoImage} onChange={(value) => setField('cargoImage', value)} disabled={submitting} icon="image-plus" />
          </View>

          <Text style={styles.section}>المركبة المطلوبة</Text>
          <SelectField
            label="نوع المركبة"
            title="اختر نوع المركبة"
            placeholder="اضغط لاختيار نوع المركبة"
            items={vehicleItems}
            selectedId={vehicle}
            onSelect={(value) => setField('vehicle', value)}
          />

          <Text style={styles.section}>موعد التحميل والمسافة</Text>
          <Field label="تاريخ التحميل (YYYY-MM-DD)" value={pickupDate} onChangeText={(value) => setField('pickupDate', value)} placeholder="2026-10-25" />
          <Field label="المسافة بالكيلومتر (اختياري)" value={distance} onChangeText={(value) => setField('distance', value)} placeholder="اتركها فارغة إن كانت غير معروفة" keyboardType="numeric" />
          <Text style={styles.section}>السعر والملاحظات</Text>
          <Field label="سعر النقل (دينار عراقي)" value={price} onChangeText={(value) => setField('price', value)} placeholder="مثال: 1500000" keyboardType="numeric" />
          {priceNum > 0 ? <Text style={styles.priceHint}>{formatIQD(priceNum)}</Text> : null}
          <Field label="ملاحظات إضافية" value={notes} onChangeText={(value) => setField('notes', value)} placeholder="تعليمات خاصة" multiline />
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
