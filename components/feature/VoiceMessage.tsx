import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVoicePlayback } from '@/hooks/useVoicePlayback';
import { colors, layout, spacing, typography } from '@/constants/theme';
interface VoiceMessageProps { path: string; durationMs: number; mine: boolean; disabled?: boolean; }
export const VoiceMessage = memo(function VoiceMessage({ path, durationMs, mine, disabled = false }: VoiceMessageProps) {
  const playback = useVoicePlayback(path, disabled);
  const color = mine ? colors.onPrimary : colors.text;
  return <View>
    <Pressable onPress={playback.toggle} disabled={playback.busy || disabled} accessibilityRole="button" accessibilityLabel={playback.playing ? 'إيقاف الرسالة الصوتية' : 'تشغيل الرسالة الصوتية'} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      {playback.busy ? <ActivityIndicator color={color} /> : <MaterialCommunityIcons name={playback.playing ? 'stop-circle-outline' : 'play-circle-outline'} size={32} color={color} />}
      <MaterialCommunityIcons name="waveform" size={32} color={color} />
      <Text style={[styles.text, { color }]}>{Math.ceil(durationMs / 1000)} ث</Text>
    </Pressable>
    {playback.error ? <Text style={[styles.text,{ color }]}>{playback.error}</Text> : null}
  </View>;
});
const styles=StyleSheet.create({row:{minHeight:layout.touchTarget,flexDirection:'row-reverse',alignItems:'center',gap:spacing.sm},text:{...typography.label},pressed:{opacity:0.65}});
