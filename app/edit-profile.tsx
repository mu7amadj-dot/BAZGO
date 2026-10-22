// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { useProfileSave } from '@/hooks/useProfileSave';
import { useAlert } from '@/template';
import { AccountGate } from '@/components/auth/AccountGate';
import { PROVINCES } from '@/constants/config';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';

export default function EditProfileScreen() { return <AccountGate><EditAccountScreen /></AccountGate>; }
function EditAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const secureProfile = useProfileSave();
  const {
    role, merchantName, driverName, merchantProfile, driverProfile,
  } = useApp();

  const isMerchant = role === 'merchant';
  const currentName = isMerchant ? merchantName : driverName;
  const currentProfile = isMerchant ? merchantProfile : driverProfile;

  const [name, setName] = useState(currentName);
  const [companyName, setCompanyName] = useState(merchantProfile.companyName);
  const [location, setLocation] = useState(merchantProfile.location);
  const [province, setProvince] = useState(currentProfile.province);
  const [phone, setPhone] = useState(currentProfile.phone);

  const provinceItems = useMemo(() => PROVINCES.map((p) => ({ id: p, label: p, icon: 'map-marker' })), []);

  const save = async () => {
    if (secureProfile.busy) return;
    const finalName = name.trim();
    if (!finalName) {
      showAlert('الاسم مطلوب', 'يرجى إدخال الاسم قبل حفظ التغييرات.');
      return;
    }
    try {
      const nextProfile = isMerchant ? { ...merchantProfile, companyName: companyName.trim(), location: location.trim(), province, phone: phone.trim() } : { ...driverProfile, province, phone: phone.trim() };
      await secureProfile.saveProfile(finalName, { ...nextProfile });
      router.back();
    } catch (error) { showAlert('تعذر حفظ البيانات', error instanceof Error ? error.message : 'حاول مجدداً.'); }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]} accessibilityRole="button" accessibilityLabel="رجوع">
          <MaterialCommunityIcons name="arrow-right" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>تعديل بيانات الحساب</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name={isMerchant ? 'store' : 'truck'} size={18} color={isMerchant ? colors.primary : colors.emphasisDark} />
            <Text style={styles.roleBadgeText}>{isMerchant ? 'حساب تاجر / شركة' : 'حساب سائق'}</Text>
          </View>

          <Field label="الاسم" value={name} onChangeText={setName} placeholder="اكتب اسمك" />
          {isMerchant ? (
            <>
              <Field label="اسم الشركة / المصنع" value={companyName} onChangeText={setCompanyName} placeholder="مثال: شركة النور للتجارة" />
              <Field label="الموقع" value={location} onChangeText={setLocation} placeholder="المدينة / المنطقة" />
            </>
          ) : null}
          <SelectField
            label="المحافظة"
            title="اختر المحافظة"
            placeholder="اضغط لاختيار المحافظة"
            items={provinceItems}
            selectedId={province}
            onSelect={setProvince}
          />
          <Field label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="07XX XXX XXXX" keyboardType="phone-pad" />

          <Button title="حفظ التغييرات" variant="emphasis" onPress={save} loading={secureProfile.busy} />
          <Text style={styles.hint}>تُحفظ التغييرات في حسابك مباشرةً</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconBtn: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  headerTitle: { ...typography.section, color: colors.text },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, width: '100%', maxWidth: layout.authMaxWidth, alignSelf: 'center' },
  roleBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-end',
    backgroundColor: colors.surfaceTint, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, marginBottom: spacing.lg,
  },
  roleBadgeText: { ...typography.label, color: colors.primary },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
