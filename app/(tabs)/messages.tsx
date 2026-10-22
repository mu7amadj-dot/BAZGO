// Powered by OnSpace.AI
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useFloatingTabBarLayout } from '@/hooks/useFloatingTabBarLayout';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, layout, radius, spacing, typography, shadow } from '@/constants/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const { contentInset } = useFloatingTabBarLayout();
  const { conversations, messages } = useApp();

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header title="المحادثات" subtitle={`${conversations.length} محادثة`} />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.list, { paddingBottom: contentInset }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const last = [...messages].reverse().find((m) => m.conversationId === item.id);
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.peer} numberOfLines={1}>{item.peerName}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {last ? last.text : item.freightTitle}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textMuted} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="لا توجد محادثات بعد"
            subtitle="تبدأ المحادثة بعد قبول السائق للنقل"
            icon={<MaterialCommunityIcons name="message-text-outline" size={44} color={colors.textMuted} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, ...shadow.card,
  },
  pressed: { opacity: 0.92 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  peer: { ...typography.bodyStrong, color: colors.text, textAlign: 'right' },
  preview: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: 2 },
});
