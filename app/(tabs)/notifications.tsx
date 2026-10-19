// Powered by OnSpace.AI
import React, { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { timeAgo } from '@/services/format';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius, spacing, typography, shadow } from '@/constants/theme';

export default function NotificationsScreen() {
  const { role, notifications, markNotificationsRead } = useApp();

  const list = useMemo(() => notifications.filter((n) => n.role === role), [notifications, role]);

  useEffect(() => {
    const t = setTimeout(() => markNotificationsRead(role), 800);
    return () => clearTimeout(t);
  }, [role, markNotificationsRead]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerWrap}>
        <Header title="الإشعارات" subtitle={`${list.length} إشعار`} />
      </View>

      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.unread]}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="truck-fast" size={20} color={colors.primary} />
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read ? <View style={styles.dot} /> : null}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="لا توجد إشعارات"
            subtitle="ستظهر هنا تحديثات طلباتك ورسائلك"
            icon={<MaterialIcons name="notifications-none" size={44} color={colors.textMuted} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row-reverse', gap: spacing.sm, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm, ...shadow.card,
  },
  unread: { borderColor: colors.primaryLight, backgroundColor: colors.surfaceTint },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.text, textAlign: 'right' },
  body: { ...typography.caption, color: colors.textSubtle, textAlign: 'right', marginTop: 2 },
  time: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.emphasis, marginTop: 4 },
});
