// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { PROVINCES } from '@/constants/config';
import { Field } from '@/components/ui/Field';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing, typography } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const {
    role, merchantName, driverName, merchantProfile, driverProfile,
    setNames, setMerchantProfile, setDriverProfile,
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

  const save = () => {
    const finalName = name.trim();
    if (!finalName) {
      showAlert('الاسم مطلوب', 'يرجى إدخال الاسم قبل حفظ التغييرات.');
      return;
    }
    if (isMerchant) {
      setNames(finalName, '');
      setMerchantProfile({ ...merchantProfile, companyName: companyName.trim(), location: location.trim(), province, phone: phone.trim() });
    } else {
      setNames('', finalName);
      setDriverProfile({ ...driverProfile, province, phone: phone.trim() });
    }
    showAlert('تم الحفظ', 'تم تحديث بيانات حسابك بنجاح.', [
      { text: 'حسناً', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="رجوع">
          <MaterialIcons name="arrow-forward" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>تعديل بيانات الحساب</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

          <Button title="حفظ التغييرات" variant="emphasis" onPress={save} />
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
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.section, color: colors.text },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  roleBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-end',
    backgroundColor: colors.surfaceTint, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, marginBottom: spacing.lg,
  },
  roleBadgeText: { ...typography.label, color: colors.primary },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
