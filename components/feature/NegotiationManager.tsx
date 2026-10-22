import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLoadBooking } from '@/hooks/useLoadBooking';
import { formatIQD } from '@/services/format';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/loadStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MarketConnectionBanner } from './MarketConnectionBanner';
import { colors, radius, spacing, typography } from '@/constants/theme';
interface NegotiationManagerProps { loadId: string; }
export const NegotiationManager = memo(function NegotiationManager({ loadId }: NegotiationManagerProps) {
  const state = useLoadBooking(loadId);
  if (!state.load) return <Text style={styles.body}>الحمولة غير متوفرة.</Text>;
  return <View style={styles.wrap}>
    <MarketConnectionBanner />
    <View style={styles.card}>
      <Badge label={STATUS_LABELS[state.load.status]} tone={STATUS_COLORS[state.load.status]} />
      <Text style={styles.title}>{state.load.cargoType}</Text>
      <Text style={styles.body}>السعر الأولي: {formatIQD(state.load.priceIQD)}</Text>
      {state.negotiation ? <>
        <Text style={styles.title}>السائق: {state.negotiation.driver_name}</Text>
        <Text style={styles.body}>{state.negotiation.status === 'negotiating' ? 'حجز مؤقت لمدة 15 دقيقة. تأكيد الاتفاق النهائي يتم داخل المحادثة فقط.' : 'تابع النقل والتسليم والتقييم من المحادثة.'}</Text>
        <Button title="فتح محادثة السائق" onPress={state.openChat} />
      </> : <Text style={styles.body}>{state.load.status === 'available' ? 'الحمولة متاحة. تبدأ محادثة خاصة فور حجزها مؤقتاً من سائق.' : 'تم إلغاء هذه الحمولة.'}</Text>}
    </View>
    {state.load.status === 'available' ? <Button title="إلغاء الحمولة" variant="outline" loading={state.busy} onPress={state.cancelLoad} /> : null}
    <Text style={styles.body}>التقييم اختياري بعد التسليم، من 1 إلى 5 نجوم، دون نقاط أو مكافآت.</Text>
  </View>;
});
const styles=StyleSheet.create({wrap:{gap:spacing.md},card:{backgroundColor:colors.surface,borderRadius:radius.lg,padding:spacing.md,borderWidth:1,borderColor:colors.border,gap:spacing.md},title:{...typography.section,color:colors.text,textAlign:'right'},body:{...typography.body,color:colors.textSubtle,textAlign:'right'}});
