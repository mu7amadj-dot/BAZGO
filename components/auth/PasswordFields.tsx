import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Field } from '@/components/ui/Field';
import { colors, typography } from '@/constants/theme';

interface PasswordFieldsProps {
  password: string;
  confirmation: string;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  confirm: boolean;
  disabled: boolean;
}
export const PasswordFields = memo(function PasswordFields({ password, confirmation, onPasswordChange, onConfirmationChange, confirm, disabled }: PasswordFieldsProps) {
  return <View>
    <Field compact icon="lock-outline" label={confirm ? 'الرقم السري الجديد' : 'الرقم السري'} value={password} onChangeText={onPasswordChange} secureTextEntry textContentType={confirm ? 'newPassword' : 'password'} maxLength={72} editable={!disabled} />
    {confirm ? <>
      <Field compact icon="lock-check-outline" label="تأكيد الرقم السري" value={confirmation} onChangeText={onConfirmationChange} secureTextEntry textContentType="newPassword" maxLength={72} editable={!disabled} />
      <Text style={styles.hint}>6 أحرف أو أرقام على الأقل. استخدم رقماً سرياً مختلفاً عن حساباتك الأخرى.</Text>
    </> : null}
  </View>;
});
const styles = StyleSheet.create({ hint: { ...typography.caption, color: colors.textSubtle, textAlign: 'right' } });
