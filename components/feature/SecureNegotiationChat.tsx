import React, { memo, useCallback } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNegotiationChat } from '@/hooks/useNegotiationChat';
import type { BookingMessage } from '@/services/bookingTypes';
import { formatTime } from '@/services/format';
import { STATUS_LABELS, STATUS_COLORS } from '@/services/mockData';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { NegotiationPanel } from './NegotiationPanel';
import { TripRatingForm } from './TripRatingForm';
import { VoiceMessage } from './VoiceMessage';
import { MarketConnectionBanner } from './MarketConnectionBanner';
import { colors, layout, radius, spacing, typography } from '@/constants/theme';
interface SecureNegotiationChatProps { id: string; }
export const SecureNegotiationChat = memo(function SecureNegotiationChat({ id }: SecureNegotiationChatProps) {
  const state = useNegotiationChat(id);
  const renderMessage = useCallback(({item}:{item:BookingMessage}) => {
    const mine=item.user_id===state.userId;
    return <View style={[styles.bubbleRow,mine?styles.rowMine:styles.rowTheirs]}>
      <View style={[styles.bubble,mine?styles.bubbleMine:styles.bubbleTheirs]}>
        {item.kind==='voice' && item.audio_path ? <VoiceMessage path={item.audio_path} durationMs={item.duration_ms??0} mine={mine} disabled={state.voice.isRecording} /> : <Text style={[styles.message,mine?styles.onPrimary:null]}>{item.text}</Text>}
        <Text style={[styles.time,mine?styles.onPrimary:null]}>{formatTime(new Date(item.created_at).getTime())}</Text>
      </View>
    </View>;
  },[state.userId,state.voice.isRecording]);
  const n=state.negotiation;
  const title=n ? state.isMerchant ? n.driver_name : n.merchant_name : 'محادثة التفاوض';
  const status=state.closed ? n?.status==='cancelled'?'cancelled':'expired' : n?.status??'negotiating';
  return <SafeAreaView edges={['bottom']} style={styles.screen}>
    <Header title={title} subtitle="محادثة خاصة · نص وصوت" showBack />
    {!n ? <View style={styles.empty}><MarketConnectionBanner />{state.loading ? <ActivityIndicator color={colors.primary} /> : <EmptyState title="المحادثة غير متاحة" subtitle="لا يمكن فتح محادثة إلا لطرفي الحجز." />}</View> : <>
      <View style={styles.statusBar}>
        <Badge label={STATUS_LABELS[status]} tone={STATUS_COLORS[status]} />
        {state.negotiating ? <View style={styles.timer}><MaterialCommunityIcons name="timer-outline" size={18} color={colors.primary} /><Text accessibilityLabel={`الوقت المتبقي للتفاوض ${state.remaining} ثانية`} style={styles.timerText}>{`${Math.floor(state.remaining/60).toString().padStart(2,'0')}:${(state.remaining%60).toString().padStart(2,'0')}`} · وقت الخادم</Text></View> : null}
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':'height'}>
        <FlatList style={styles.flex} data={state.thread} keyExtractor={(m)=>m.id} renderItem={renderMessage} showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<><MarketConnectionBanner /><NegotiationPanel state={state} /><Text style={styles.conversationLabel}>المحادثة</Text></>}
          ListFooterComponent={n.status==='delivered'||n.status==='completed' ? <TripRatingForm stars={state.stars} comment={state.comment} submitted={!!state.myRating} savedStars={state.myRating?.stars} busy={state.busy} isMerchant={state.isMerchant} onStars={state.setStars} onComment={state.setComment} onSubmit={state.rate} /> : null} />
        {state.voice.error ? <Text style={styles.error}>{state.voice.error}</Text> : null}
        {state.canChat ? <View style={styles.composerWrap}>
          {state.voice.isRecording ? <Text style={styles.recording}>جارٍ التسجيل · {Math.floor(state.voice.durationMs/1000)} / 60 ثانية · اضغط لإيقاف التسجيل</Text> : state.voice.draft ? <View style={styles.draft}>
            <Text style={styles.body}>رسالة صوتية جاهزة · {Math.ceil(state.voice.draft.durationMs/1000)} ثانية</Text>
            <Pressable disabled={state.busy} onPress={state.voice.discard} accessibilityLabel="حذف التسجيل قبل الإرسال" style={({pressed})=>[styles.iconButton,pressed?styles.pressed:null]}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></Pressable>
          </View> : null}
          <View style={styles.inputBar}>
            <TextInput accessibilityLabel="نص الرسالة" style={styles.input} value={state.text} onChangeText={state.setText} placeholder="اكتب رسالة..." placeholderTextColor={colors.textMuted} textAlign="right" multiline maxLength={4000} editable={!state.busy&&!state.voice.isRecording&&!state.voice.draft} />
            <Pressable disabled={state.busy} onPress={state.voice.isRecording?state.voice.stop:state.voice.start} accessibilityRole="button" accessibilityLabel={state.voice.isRecording?'إنهاء التسجيل الصوتي':'تسجيل رسالة صوتية'} style={({pressed})=>[styles.iconButton,pressed?styles.pressed:null]}><MaterialCommunityIcons name={state.voice.isRecording?'stop-circle-outline':'microphone-outline'} size={26} color={state.voice.isRecording?colors.danger:colors.primary} /></Pressable>
            <Pressable disabled={state.busy||state.voice.isRecording||(!state.text.trim()&&!state.voice.draft)} onPress={state.send} accessibilityRole="button" accessibilityLabel="إرسال الرسالة" style={({pressed})=>[styles.sendButton,pressed?styles.pressed:null,state.busy||state.voice.isRecording||(!state.text.trim()&&!state.voice.draft)?styles.disabled:null]}>
              {state.busy?<ActivityIndicator color={colors.onPrimary}/>:<MaterialCommunityIcons name="send-outline" size={22} color={colors.onPrimary}/>}
            </Pressable>
          </View>
        </View> : <Text style={styles.closed}>المحادثة مغلقة · أُلغي الحجز المؤقت</Text>}
      </KeyboardAvoidingView>
    </>}
  </SafeAreaView>;
});
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},flex:{flex:1},empty:{flex:1,padding:spacing.md},
  statusBar:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',gap:spacing.sm,paddingHorizontal:spacing.md,paddingVertical:spacing.sm,backgroundColor:colors.surfaceAlt},
  timer:{flexDirection:'row',alignItems:'center',gap:spacing.xs},timerText:{...typography.label,color:colors.primary},
  list:{padding:spacing.md,paddingBottom:spacing.lg,width:'100%',maxWidth:layout.contentMaxWidth,alignSelf:'center'},conversationLabel:{...typography.label,color:colors.textSubtle,textAlign:'right',marginBottom:spacing.md},
  bubbleRow:{marginBottom:spacing.sm,flexDirection:'row'},rowMine:{justifyContent:'flex-start'},rowTheirs:{justifyContent:'flex-end'},
  bubble:{maxWidth:'85%',borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:spacing.sm},bubbleMine:{backgroundColor:colors.primary},bubbleTheirs:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  message:{...typography.body,color:colors.text,textAlign:'right'},onPrimary:{color:colors.onPrimary},time:{...typography.caption,color:colors.textMuted,marginTop:spacing.xs},
  composerWrap:{backgroundColor:colors.surface,borderTopWidth:1,borderTopColor:colors.border,padding:spacing.sm},inputBar:{flexDirection:'row-reverse',alignItems:'flex-end',gap:spacing.xs},
  input:{...typography.body,color:colors.text,flex:1,minHeight:layout.touchTarget,maxHeight:120,borderWidth:1,borderColor:colors.borderStrong,borderRadius:radius.md,padding:spacing.sm,backgroundColor:colors.background},
  iconButton:{width:layout.touchTarget,height:layout.touchTarget,alignItems:'center',justifyContent:'center'},sendButton:{width:layout.touchTarget,height:layout.touchTarget,alignItems:'center',justifyContent:'center',borderRadius:radius.md,backgroundColor:colors.primary},
  recording:{...typography.label,color:colors.danger,textAlign:'right',padding:spacing.sm},body:{...typography.label,color:colors.textSubtle},draft:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.sm},
  error:{...typography.label,color:colors.danger,textAlign:'right',padding:spacing.sm},closed:{...typography.body,color:colors.warning,textAlign:'center',padding:spacing.md},pressed:{opacity:0.7},disabled:{opacity:0.45},
});
