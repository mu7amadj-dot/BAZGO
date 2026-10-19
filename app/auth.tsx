// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserRole } from '@/services/types';
import { PROVINCES, VEHICLES } from '@/constants/config';
import { useApp } from '@/hooks/useApp';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setMerchantProfile, setDriverProfile } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  // Merchant extras
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  // Driver extras
  const [fatherName, setFatherName] = useState('');
  const [grandfatherName, setGrandfatherName] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [driverPhoto, setDriverPhoto] = useState('');
  const [licensePhoto, setLicensePhoto] = useState('');
  const [vehiclePhoto, setVehiclePhoto] = useState('');

  const provinceItems = useMemo(() => PROVINCES.map((p) => ({ id: p, label: p, icon: 'map-marker' })), []);

  const proceed = () => {
    if (!selectedRole) return;
    const finalPhone = phone.trim() || '0770 123 4567';

    if (selectedRole === 'merchant') {
      const finalName = name.trim() || 'أبو محمد';
      setMerchantProfile({
        companyName: companyName.trim() || 'شركة أبو محمد التجارية',
        location: location.trim() || 'بغداد - المنصور',
        province: province || 'بغداد',
        phone: finalPhone,
      });
      router.push({ pathname: '/otp', params: { role: selectedRole, name: finalName, phone: finalPhone } });
    } else {
      const finalName = name.trim() || 'علي';
      const chosenVehicle = vehicleType || 'canter';
      const vehCap = VEHICLES.find((v) => v.id === chosenVehicle)?.capacity ?? 7;
      setDriverProfile({
        fatherName: fatherName.trim(),
        grandfatherName: grandfatherName.trim(),
        province: province || 'بغداد',
        vehicleType: chosenVehicle,
        maxCapacity: maxCapacity.trim() || String(vehCap),
        driverPhoto,
        licensePhoto,
        vehiclePhoto,
        phone: finalPhone,
      });
      const fullName = [finalName, fatherName.trim(), grandfatherName.trim()].filter(Boolean).join(' ');
      router.push({ pathname: '/otp', params: { role: selectedRole, name: fullName, phone: finalPhone } });
    }
  };

  const isMerchant = selectedRole === 'merchant';

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <Image source={require('@/assets/images/bazgo-logo.png')} style={styles.logo} contentFit="contain" transition={200} />
        <Text style={styles.brand}>BAZGO</Text>
        <Text style={styles.slogan}>انقل بضاعتك بذكاء</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.mockBanner}>
            <MaterialCommunityIcons name="test-tube" size={16} color={colors.emphasisDark} />
            <Text style={styles.mockText}>وضع تجريبي — بيانات محلية دون تسجيل حقيقي</Text>
          </View>

          {!selectedRole ? (
            <>
              <Text style={styles.title}>اختر نوع الحساب</Text>

              <Pressable style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]} onPress={() => setSelectedRole('merchant')}>
                <View style={[styles.roleIcon, { backgroundColor: colors.surfaceTint }]}>
                  <MaterialCommunityIcons name="store" size={30} color={colors.primary} />
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>تاجر / شركة / مصنع</Text>
                  <Text style={styles.roleSub}>انشر طلبات النقل واستقبل عروض السائقين</Text>
                </View>
                <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textMuted} />
              </Pressable>

              <Pressable style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]} onPress={() => setSelectedRole('driver')}>
                <View style={[styles.roleIcon, { backgroundColor: colors.warningBg }]}>
                  <MaterialCommunityIcons name="truck" size={30} color={colors.emphasisDark} />
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>سائق / ناقل</Text>
                  <Text style={styles.roleSub}>تصفّح الحمولات المتاحة وقدّم على النقل</Text>
                </View>
                <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textMuted} />
              </Pressable>

              <Text style={styles.hint}>اختر نوع حسابك ثم أدخل بياناتك</Text>
            </>
          ) : (
            <>
              <Pressable style={styles.changeRow} onPress={() => setSelectedRole(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="تغيير نوع الحساب">
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
                <Text style={styles.changeText}>تغيير نوع الحساب</Text>
              </Pressable>

              <View style={styles.selectedCard}>
                <View style={[styles.roleIcon, { backgroundColor: isMerchant ? colors.surfaceTint : colors.warningBg }]}>
                  <MaterialCommunityIcons name={isMerchant ? 'store' : 'truck'} size={28} color={isMerchant ? colors.primary : colors.emphasisDark} />
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>{isMerchant ? 'تاجر / شركة / مصنع' : 'سائق / ناقل'}</Text>
                  <Text style={styles.roleSub}>{isMerchant ? 'انشر طلبات النقل واستقبل العروض' : 'تصفّح الحمولات وقدّم على النقل'}</Text>
                </View>
                <MaterialIcons name="check-circle" size={24} color={colors.success} />
              </View>

              <Text style={styles.title}>أكمل بياناتك</Text>

              {isMerchant ? (
                <>
                  <Field label="الاسم الكامل" value={name} onChangeText={setName} placeholder="اكتب اسمك الكامل" />
                  <Field label="اسم الشركة / المصنع" value={companyName} onChangeText={setCompanyName} placeholder="مثال: شركة النور للتجارة" />
                  <Field label="الموقع" value={location} onChangeText={setLocation} placeholder="المدينة / المنطقة" />
                  <SelectField
                    label="المحافظة"
                    title="اختر المحافظة"
                    placeholder="اضغط لاختيار المحافظة"
                    items={provinceItems}
                    selectedId={province}
                    onSelect={setProvince}
                  />
                  <Field label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="07XX XXX XXXX" keyboardType="phone-pad" />
                </>
              ) : (
                <>
                  <Field label="الاسم" value={name} onChangeText={setName} placeholder="الاسم الأول" />
                  <Field label="اسم الأب" value={fatherName} onChangeText={setFatherName} placeholder="اكتب اسم الأب" />
                  <Field label="اسم الجد" value={grandfatherName} onChangeText={setGrandfatherName} placeholder="اكتب اسم الجد" />
                  <Field label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="07XX XXX XXXX" keyboardType="phone-pad" />
                  <SelectField
                    label="المحافظة"
                    title="اختر المحافظة"
                    placeholder="اضغط لاختيار المحافظة"
                    items={provinceItems}
                    selectedId={province}
                    onSelect={setProvince}
                  />
                  <SelectField
                    label="نوع المركبة"
                    title="اختر نوع المركبة"
                    placeholder="اضغط لاختيار نوع المركبة"
                    items={VEHICLES.map((v) => ({ id: v.id, label: v.label, icon: v.icon, meta: `حتى ${v.capacity} طن` }))}
                    selectedId={vehicleType}
                    onSelect={setVehicleType}
                  />
                  <Field label="أقصى حمولة (بالطن)" value={maxCapacity} onChangeText={setMaxCapacity} placeholder="مثال: 25" keyboardType="numeric" />

                  <Text style={styles.sectionLabel}>المستندات المطلوبة</Text>
                  <View style={styles.uploadRow}>
                    <ImageUpload label="صورة السائق" value={driverPhoto} onChange={setDriverPhoto} icon="account" />
                    <ImageUpload label="إجازة السوق" value={licensePhoto} onChange={setLicensePhoto} icon="card-account-details" />
                    <ImageUpload label="صورة الشاحنة" value={vehiclePhoto} onChange={setVehiclePhoto} icon="truck" />
                  </View>
                </>
              )}

              <Button title="متابعة" variant="emphasis" onPress={proceed} />
              <Text style={styles.hint}>سنرسل رمز تحقق إلى رقمك لتفعيل الحساب</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  logo: { width: 72, height: 72, backgroundColor: colors.surface, borderRadius: 20 },
  brand: { fontSize: 30, fontWeight: '800', color: colors.onPrimary, marginTop: spacing.sm, letterSpacing: 2 },
  slogan: { ...typography.caption, color: colors.emphasis, marginTop: 4 },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mockBanner: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.warningBg, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.lg,
  },
  mockText: { ...typography.caption, color: colors.emphasisDark, fontWeight: '600' },
  title: { ...typography.title, color: colors.text, textAlign: 'right', marginBottom: spacing.md },
  roleCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, ...shadow.card,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  roleIcon: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  roleText: { flex: 1 },
  roleTitle: { ...typography.section, color: colors.text, textAlign: 'right' },
  roleSub: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: 2 },
  changeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  changeText: { ...typography.label, color: colors.primary },
  selectedCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.primary, marginBottom: spacing.lg, ...shadow.card,
  },
  sectionLabel: { ...typography.label, color: colors.text, textAlign: 'right', marginBottom: spacing.sm, marginTop: spacing.xs },
  uploadRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
