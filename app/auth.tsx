// Powered by OnSpace.AI
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegistration } from '@/hooks/useRegistration';
import { BrandMark } from '@/components/feature/BrandMark';
import { AccountTypePicker } from '@/components/feature/AccountTypePicker';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

export default function AuthScreen() {
  const { selectedRole, setSelectedRole, mode, toggleMode, form, setField, provinceItems, vehicleItems, proceed, close } = useRegistration();
  const isMerchant = selectedRole === 'merchant';
  const isRegister = mode === 'register';
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable onPress={close} style={({ pressed }) => [styles.close, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="إغلاق التسجيل وفتح النسخة التجريبية">
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </Pressable>
              <BrandMark />
            </View>
            <AccountTypePicker selectedRole={selectedRole} onSelect={setSelectedRole} />
            {selectedRole ? (
              <View style={styles.form}>
                {isRegister ? (
                  <>
                    <Field compact icon="account-outline" label={isMerchant ? 'الاسم الكامل' : 'الاسم'} value={form.name} onChangeText={(value) => setField('name', value)} placeholder={isMerchant ? 'اكتب اسمك الكامل' : 'الاسم الأول'} />
                    {isMerchant ? (
                      <Field compact icon="office-building-outline" label="اسم الشركة / المعمل" value={form.companyName} onChangeText={(value) => setField('companyName', value)} placeholder="مثال: شركة الرافدين" />
                    ) : (
                      <>
                        <Field compact icon="account-outline" label="اسم الأب" value={form.fatherName} onChangeText={(value) => setField('fatherName', value)} placeholder="اكتب اسم الأب" />
                        <Field compact icon="account-outline" label="اسم الجد" value={form.grandfatherName} onChangeText={(value) => setField('grandfatherName', value)} placeholder="اكتب اسم الجد" />
                      </>
                    )}
                  </>
                ) : <Text style={styles.loginTitle}>تسجيل الدخول التجريبي</Text>}
                <Field compact icon="phone-outline" label="رقم الهاتف +964" value={form.phone} onChangeText={(value) => setField('phone', value)} placeholder="07XX XXX XXXX" keyboardType="phone-pad" />
                {isRegister ? (
                  <>
                    <SelectField compact icon="map-marker-outline" label="المحافظة" title="اختر المحافظة" placeholder="اضغط لاختيار المحافظة" items={provinceItems} selectedId={form.province} onSelect={(value) => setField('province', value)} />
                    {isMerchant ? (
                      <Field compact icon="map-marker-radius-outline" label="الموقع" value={form.location} onChangeText={(value) => setField('location', value)} placeholder="المدينة / المنطقة" />
                    ) : (
                      <>
                        <SelectField compact icon="truck-outline" label="نوع المركبة" title="اختر نوع المركبة" placeholder="اضغط لاختيار نوع المركبة" items={vehicleItems} selectedId={form.vehicleType} onSelect={(value) => setField('vehicleType', value)} />
                        <Field compact icon="weight-kilogram" label="أقصى حمولة (بالطن)" value={form.maxCapacity} onChangeText={(value) => setField('maxCapacity', value)} placeholder="مثال: 25" keyboardType="numeric" />
                        <Text style={styles.sectionLabel}>صور السائق والمركبة</Text>
                        <View style={styles.uploadRow}>
                          <ImageUpload label="صورة السائق" value={form.driverPhoto} onChange={(value) => setField('driverPhoto', value)} icon="account-outline" />
                          <ImageUpload label="إجازة السوق" value={form.licensePhoto} onChange={(value) => setField('licensePhoto', value)} icon="card-account-details-outline" />
                          <ImageUpload label="صورة الشاحنة" value={form.vehiclePhoto} onChange={(value) => setField('vehiclePhoto', value)} icon="truck-outline" />
                        </View>
                      </>
                    )}
                  </>
                ) : null}
                <View style={styles.action}>
                  <Button title={isRegister ? 'إنشاء الحساب وإرسال رمز التحقق' : 'متابعة إلى رمز التحقق'} variant="emphasis" onPress={proceed} />
                </View>
              </View>
            ) : <Text style={styles.chooseHint}>اختر نوع الحساب لعرض بيانات التسجيل</Text>}
            <Pressable onPress={toggleMode} style={({ pressed }) => [styles.loginLink, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel={isRegister ? 'تسجيل الدخول التجريبي' : 'إنشاء حساب تجريبي'}>
              <Text style={styles.linkText}>{isRegister ? 'لديك حساب؟ ' : 'ليس لديك حساب؟ '}<Text style={styles.linkAccent}>{isRegister ? 'تسجيل الدخول' : 'إنشاء حساب'}</Text></Text>
            </Pressable>
            <View style={styles.demoBanner}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.warning} />
              <Text style={styles.demoText}>MOCK LOGIN · نسخة تجريبية محلية{"\n"}رمز التحقق: 123456 — لا تُرسل رسائل SMS</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  content: { width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center' },
  header: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.lg },
  close: { position: 'absolute', left: -spacing.sm, top: spacing.sm, width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  form: { width: '100%' },
  loginTitle: { ...typography.section, color: colors.text, textAlign: 'right', marginBottom: spacing.md },
  sectionLabel: { ...typography.label, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.md, marginBottom: spacing.sm },
  uploadRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  action: { marginTop: spacing.md },
  chooseHint: { ...typography.body, color: colors.textSubtle, textAlign: 'center', paddingVertical: spacing.md },
  loginLink: { minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  linkText: { ...typography.body, color: colors.textSubtle, textAlign: 'center' },
  linkAccent: { color: colors.primary, fontWeight: '700' },
  demoBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.warningBg, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.md },
  demoText: { ...typography.caption, color: colors.warning, textAlign: 'right', flex: 1 },
  pressed: { opacity: 0.75 },
});
