import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { useNegotiationChat } from '@/hooks/useNegotiationChat';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { formatIQD } from '@/services/format';
import { colors, radius, spacing, typography } from '@/constants/theme';
interface NegotiationPanelProps { state: ReturnType<typeof useNegotiationChat>; }
export const NegotiationPanel = memo(function NegotiationPanel({ state }: NegotiationPanelProps) {
  const n = state.negotiation;
  if (!n) return null;
  return <View style={styles.card}>
    <Text style={styles.heading}>{state.load?.cargoType ?? 'حمولة'} · {state.load?.pickupProvince} ← {state.load?.deliveryProvince}</Text>
    <Text style={styles.label}>السعر الأولي المحدد من التاجر</Text>
    <Text style={styles.price}>{formatIQD(n.initial_price)}</Text>
    {state.negotiating ? <>
      <Text style={styles.body}>الحجز مؤقت. اتفقا عبر النص أو الصوت؛ يُرسل السائق السعر المتفق عليه ويؤكده التاجر نهائياً.</Text>
      {n.proposed_price ? <View style={styles.proposal}><Text style={styles.label}>عرض السائق الحالي</Text><Text style={styles.price}>{formatIQD(n.proposed_price)}</Text></View> : null}
      {state.isMerchant ? <>
        <Button title="تأكيد الاتفاق النهائي · Confirm Final Agreement" variant="emphasis" disabled={!n.proposed_price || state.busy} loading={state.busy} onPress={state.confirm} />
        {!n.proposed_price ? <Text style={styles.body}>بانتظار إرسال السائق للسعر المتفق عليه.</Text> : null}
      </> : <>
        <Field label="السعر المقترح للتأكيد (د.ع)" value={state.price} onChangeText={state.setPrice} keyboardType="numeric" />
        <Button title="إرسال السعر إلى التاجر للتأكيد" variant="emphasis" loading={state.busy} onPress={state.propose} />
      </>}
      <Button title="إلغاء التفاوض وتحرير الحجز" variant="ghost" disabled={state.busy} onPress={state.cancel} />
    </> : state.closed ? <Text style={styles.closed}>{n.status === 'cancelled' ? 'أُلغي التفاوض' : 'انتهت مهلة 15 دقيقة'} · أُلغي الحجز المؤقت وأصبحت الحمولة متاحة مجدداً. هذه المحادثة للقراءة فقط.</Text> : <>
      <Text style={styles.label}>السعر النهائي المتفق عليه</Text>
      <Text style={styles.price}>{formatIQD(n.agreed_price ?? n.initial_price)}</Text>
      <Text style={styles.body}>الحجز مؤكد لهذا السائق ولا يمكن لسائق آخر قبول الحمولة.</Text>
      {!state.isMerchant && n.status === 'confirmed' ? <Button title="بدء النقل" onPress={state.startTransport} loading={state.busy} /> : null}
      {state.isMerchant && n.status === 'in_transit' ? <Button title="تأكيد استلام الحمولة والتسليم" onPress={state.confirmDelivery} loading={state.busy} /> : null}
    </>}
  </View>;
});
const styles=StyleSheet.create({
  card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,padding:spacing.md,gap:spacing.sm,marginBottom:spacing.md},
  heading:{...typography.section,color:colors.text,textAlign:'right'},label:{...typography.label,color:colors.textSubtle,textAlign:'right'},price:{...typography.title,color:colors.primary,textAlign:'right'},
  body:{...typography.body,color:colors.textSubtle,textAlign:'right'},closed:{...typography.body,color:colors.warning,textAlign:'right'},
  proposal:{backgroundColor:colors.surfaceSelected,padding:spacing.sm,borderRadius:radius.md,gap:spacing.xs},
});
