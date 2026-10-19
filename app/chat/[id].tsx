// Powered by OnSpace.AI
import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/hooks/useApp';
import { formatTime } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { colors, radius, spacing, typography } from '@/constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { role, conversations, messages, sendMessage } = useApp();
  const [text, setText] = useState('');

  const conversation = conversations.find((c) => c.id === id);
  const thread = useMemo(() => messages.filter((m) => m.conversationId === id), [messages, id]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(id as string, t, role);
    setText('');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header title={conversation?.peerName ?? 'محادثة'} subtitle={conversation?.freightTitle} showBack />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 8}>
        <FlatList
          data={thread}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>ابدأ المحادثة حول تفاصيل النقل</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderRole === role;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                  <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="اكتب رسالة..."
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={send} hitSlop={8} accessibilityRole="button" accessibilityLabel="إرسال">
            <MaterialIcons name="send" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { padding: spacing.md, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSubtle },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  rowMine: { justifyContent: 'flex-start' },
  rowTheirs: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.primary, borderBottomLeftRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomRightRadius: 4 },
  bubbleText: { ...typography.body, color: colors.text, textAlign: 'right' },
  bubbleTextMine: { color: colors.onPrimary },
  time: { ...typography.caption, color: colors.textMuted, textAlign: 'left', marginTop: 4 },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 120, ...typography.body, color: colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
