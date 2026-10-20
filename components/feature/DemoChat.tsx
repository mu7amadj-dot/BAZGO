// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { formatTime } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { colors, radius, spacing, typography } from '@/constants/theme';
interface DemoChatProps { id: string; }
export function DemoChat({ id }: DemoChatProps) {
  const insets = useSafeAreaInsets();
  const { role, conversations, messages, sendMessage } = useApp();
  const [text, setText] = useState('');
  const conversation = conversations.find((c) => c.id === id);
  const thread = useMemo(() => messages.filter((m) => m.conversationId === id), [messages, id]);
  const send = () => { const value=text.trim(); if(!value)return; sendMessage(id,value,role);setText(''); };
  return <View style={styles.screen}>
    <Header title={conversation?.peerName??'محادثة تجريبية'} subtitle={conversation?.freightTitle} showBack />
    <Text style={styles.demo}>محادثة تجريبية محلية · ليست حجزاً على الخادم</Text>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={insets.top+8}>
      <FlatList data={thread} keyExtractor={(m)=>m.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.empty}><MaterialCommunityIcons name="message-text-outline" size={40} color={colors.textMuted}/><Text style={styles.emptyText}>ابدأ المحادثة حول تفاصيل النقل</Text></View>}
        renderItem={({item})=>{const mine=item.senderRole===role;return <View style={[styles.bubbleRow,mine?styles.rowMine:styles.rowTheirs]}><View style={[styles.bubble,mine?styles.bubbleMine:styles.bubbleTheirs]}><Text style={[styles.bubbleText,mine?styles.bubbleTextMine:null]}>{item.text}</Text><Text style={[styles.time,mine?styles.timeMine:null]}>{formatTime(item.createdAt)}</Text></View></View>;}} />
      <View style={[styles.inputBar,{paddingBottom:insets.bottom+spacing.sm}]}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="اكتب رسالة..." placeholderTextColor={colors.textMuted} textAlign="right" accessibilityLabel="اكتب رسالة" multiline />
        <Pressable style={({pressed})=>[styles.sendBtn,pressed?styles.pressed:null]} onPress={send} accessibilityRole="button" accessibilityLabel="إرسال"><MaterialCommunityIcons name="send-outline" size={20} color={colors.onPrimary}/></Pressable>
      </View>
    </KeyboardAvoidingView>
  </View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},flex:{flex:1},demo:{...typography.label,color:colors.warning,textAlign:'center',padding:spacing.sm},list:{padding:spacing.md,flexGrow:1},empty:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:spacing.xxl,gap:spacing.sm},emptyText:{...typography.body,color:colors.textSubtle},bubbleRow:{flexDirection:'row',marginBottom:spacing.sm},rowMine:{justifyContent:'flex-start'},rowTheirs:{justifyContent:'flex-end'},bubble:{maxWidth:'80%',borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:spacing.sm},bubbleMine:{backgroundColor:colors.primary},bubbleTheirs:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},bubbleText:{...typography.body,color:colors.text,textAlign:'right'},bubbleTextMine:{color:colors.onPrimary},time:{...typography.caption,color:colors.textMuted,textAlign:'left',marginTop:spacing.xs},timeMine:{color:colors.onPrimary},inputBar:{flexDirection:'row-reverse',alignItems:'flex-end',gap:spacing.sm,padding:spacing.sm,backgroundColor:colors.surface,borderTopWidth:1,borderTopColor:colors.border},input:{flex:1,backgroundColor:colors.background,borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:spacing.sm,maxHeight:120,...typography.body,color:colors.text},pressed:{opacity:0.75},sendBtn:{width:48,height:48,borderRadius:radius.md,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'}});
