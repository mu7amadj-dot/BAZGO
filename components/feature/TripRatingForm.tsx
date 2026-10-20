import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';
interface TripRatingFormProps {
  stars: number; comment: string; submitted: boolean; savedStars?: number; busy: boolean; isMerchant: boolean;
  onStars: (value: number) => void; onComment: (value: string) => void; onSubmit: () => void;
}
const starsList = [1,2,3,4,5];
export const TripRatingForm = memo(function TripRatingForm(props: TripRatingFormProps) {
  return <View style={styles.card}>
    <Text style={styles.title}>{props.isMerchant ? 'قيّم السائق' : 'قيّم التاجر'} · اختياري</Text>
    <Text style={styles.body}>من 1 إلى 5 نجوم، مع تعليق اختياري. لا توجد نقاط أو مكافآت.</Text>
    {props.submitted ? <Text style={styles.saved}>تم حفظ تقييمك: {props.savedStars} / 5</Text> : <>
      <View style={styles.stars}>{starsList.map((value) => <Pressable key={value} disabled={props.busy} onPress={() => props.onStars(value)} accessibilityRole="radio" accessibilityState={{selected:props.stars===value}} accessibilityLabel={`${value} نجوم`} style={({pressed})=>[styles.star,pressed?styles.pressed:null]}>
        <MaterialCommunityIcons name={value <= props.stars ? 'star' : 'star-outline'} size={32} color={colors.primary} />
      </Pressable>)}</View>
      <Field label="تعليق اختياري (حتى 1000 حرف)" value={props.comment} onChangeText={(value)=>props.onComment(value.slice(0,1000))} multiline />
      <Button title="حفظ التقييم" onPress={props.onSubmit} loading={props.busy} disabled={props.stars<1} variant="outline" />
    </>}
  </View>;
});
const styles=StyleSheet.create({card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,padding:spacing.md,gap:spacing.sm,marginTop:spacing.md},title:{...typography.section,color:colors.text,textAlign:'right'},body:{...typography.body,color:colors.textSubtle,textAlign:'right'},saved:{...typography.bodyStrong,color:colors.success,textAlign:'right'},stars:{flexDirection:'row',justifyContent:'center'},star:{width:layout.touchTarget,height:layout.touchTarget,alignItems:'center',justifyContent:'center'},pressed:{opacity:0.7}});
