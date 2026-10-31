import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Field } from '@/components/ui/Field';
import { SelectField, type SelectItem } from '@/components/ui/SelectField';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { RegistrationForm } from '@/services/registrationService';
import type { UserRole } from '@/services/types';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface RegistrationDetailsProps {
  role: UserRole;
  form: RegistrationForm;
  onFieldChange: (field: keyof RegistrationForm, value: string) => void;
  provinceItems: SelectItem[];
  vehicleItems: SelectItem[];
  verifiedPhone: string;
  disabled: boolean;
}
export const RegistrationDetails = memo(function RegistrationDetails({ role, form, onFieldChange, provinceItems, vehicleItems, verifiedPhone, disabled }: RegistrationDetailsProps) {
  const isMerchant = role === 'merchant';
  return <View pointerEvents={disabled ? 'none' : 'auto'} style={styles.details}>
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={isMerchant ? 'store-outline' : 'truck-outline'} size={22} color={colors.primary} />
      <Text style={styles.sectionTitle}>{isMerchant ? 'بيانات التاجر والشركة' : 'بيانات السائق'}</Text>
    </View>
    <Field compact icon="account-outline" label={isMerchant ? 'الاسم الكامل' : 'اسم السائق'} value={form.name} onChangeText={(value) => onFieldChange('name', value)} maxLength={120} editable={!disabled} />
    <Field compact icon="phone-outline" label={verifiedPhone ? 'رقم الهاتف المتحقق منه' : 'رقم الهاتف العراقي'} value={form.phone} onChangeText={(value) => onFieldChange('phone', value)} placeholder="07XXXXXXXXX" keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={24} editable={!disabled && !verifiedPhone} />
    {verifiedPhone ? <View style={styles.verifiedRow}><MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.success} /><Text style={styles.verifiedText}>تم التحقق من ملكية الرقم؛ لا يمكن تغييره من بيانات الحساب.</Text></View> : null}
    {isMerchant ? <>
      <Field compact icon="office-building-outline" label="اسم الشركة / المعمل" value={form.companyName} onChangeText={(value) => onFieldChange('companyName', value)} editable={!disabled} />
      <Field compact icon="map-marker-outline" label="الموقع · المدينة / المنطقة" value={form.location} onChangeText={(value) => onFieldChange('location', value)} editable={!disabled} />
    </> : <>
      <Field compact icon="account-outline" label="اسم الأب" value={form.fatherName} onChangeText={(value) => onFieldChange('fatherName', value)} editable={!disabled} />
      <Field compact icon="account-outline" label="اسم الجد" value={form.grandfatherName} onChangeText={(value) => onFieldChange('grandfatherName', value)} editable={!disabled} />
    </>}
    <SelectField compact icon="map-marker-outline" label="المحافظة" title="اختر المحافظة" items={provinceItems} selectedId={form.province} onSelect={(value) => onFieldChange('province', value)} />
    {!isMerchant ? <>
      <View style={styles.divider} />
      <View style={styles.sectionHeader}><MaterialCommunityIcons name="truck-outline" size={22} color={colors.primary} /><Text style={styles.sectionTitle}>المركبة والوثائق</Text></View>
      <SelectField compact icon="truck-outline" label="نوع المركبة" title="اختر نوع المركبة" items={vehicleItems} selectedId={form.vehicleType} onSelect={(value) => onFieldChange('vehicleType', value)} />
      <Field compact icon="weight-kilogram" label="أقصى حمولة (طن)" value={form.maxCapacity} onChangeText={(value) => onFieldChange('maxCapacity', value)} keyboardType="numeric" editable={!disabled} />
      <Text style={styles.label}>صور السائق والمركبة (اختياري)</Text>
      <View style={styles.uploadRow}>
        <ImageUpload label="صورة السائق" value={form.driverPhoto} onChange={(value) => onFieldChange('driverPhoto', value)} icon="account-outline" disabled={disabled} />
        <ImageUpload label="إجازة السوق" value={form.licensePhoto} onChange={(value) => onFieldChange('licensePhoto', value)} icon="card-account-details-outline" disabled={disabled} />
        <ImageUpload label="صورة الشاحنة" value={form.vehiclePhoto} onChange={(value) => onFieldChange('vehiclePhoto', value)} icon="truck-outline" disabled={disabled} />
      </View>
      <Text style={styles.caption}>اختر الصور من المعرض أو الكاميرا. تُرفع بعد التحقق إلى تخزين خاص بحسابك؛ رفعها لا يعني اعتماد الوثائق تلقائياً.</Text>
    </> : null}
  </View>;
});
const styles = StyleSheet.create({
  details: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { ...typography.section, color: colors.text, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  label: { ...typography.label, color: colors.textSubtle, textAlign: 'right', marginBottom: spacing.sm },
  uploadRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  caption: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.sm },
  verifiedRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  verifiedText: { ...typography.caption, color: colors.success, flex: 1, textAlign: 'right' },
});
