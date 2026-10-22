// Powered by OnSpace.AI
import React, { useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { useFloatingTabBarLayout } from '@/hooks/useFloatingTabBarLayout';
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation';
import { timeAgo } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { MarketConnectionBanner } from '@/components/feature/MarketConnectionBanner';
import { colors, layout, radius, spacing, typography, shadow } from '@/constants/theme';
export default function NotificationsScreen() {
  const { contentInset } = useFloatingTabBarLayout();
  const { role, notifications, markNotificationsRead } = useApp();
  const openNotification = useNotificationNavigation();
  const list = useMemo(() => notifications.filter((n) => n.role === role), [notifications, role]);
  useEffect(() => {
    const timer = setTimeout(() => markNotificationsRead(role), 800);
    return () => clearTimeout(timer);
  }, [role, markNotificationsRead]);
  return <View style={styles.screen}>
    <View style={styles.headerWrap}><Header title="الإشعارات" subtitle={`${list.length} إشعار`} /></View>
    <FlatList data={list} keyExtractor={(n) => n.id} contentContainerStyle={[styles.list, { paddingBottom: contentInset }]} showsVerticalScrollIndicator={false}
      ListHeaderComponent={<MarketConnectionBanner />}
      renderItem={({ item }) => <Pressable onPress={() => openNotification(item)} accessibilityRole="button" accessibilityLabel={item.title} style={({ pressed }) => [styles.card, !item.read ? styles.unread : null, pressed ? styles.pressed : null]}>
        <View style={styles.iconWrap}><MaterialCommunityIcons name="truck-fast" size={20} color={colors.primary} /></View>
        <View style={styles.text}><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.time}>{timeAgo(item.createdAt)}</Text></View>
        {!item.read ? <View style={styles.dot} /> : null}
      </Pressable>}
      ListEmptyComponent={<EmptyState title="لا توجد إشعارات" subtitle="ستظهر هنا تحديثات الحجز والتفاوض والنقل" icon={<MaterialCommunityIcons name="bell-outline" size={44} color={colors.textMuted} />} />}
    />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  card: { flexDirection: 'row-reverse', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, ...shadow.card },
  unread: { borderColor: colors.primaryLight, backgroundColor: colors.surfaceTint }, iconWrap: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 }, title: { ...typography.bodyStrong, color: colors.text, textAlign: 'right' }, body: { ...typography.body, color: colors.textSubtle, textAlign: 'right', marginTop: spacing.xs },
  time: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs }, dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.emphasis, marginTop: spacing.xs }, pressed: { opacity: 0.75 },
});
