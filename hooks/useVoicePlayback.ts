import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { getVoiceUrl } from '@/services/bookingService';
export function useVoicePlayback(path: string, disabled = false) {
  const sound = useRef<Audio.Sound | null>(null);
  const mounted = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toggle = useCallback(async () => {
    if (busy || disabled) return;
    setBusy(true); setError('');
    try {
      if (sound.current) {
        const current = sound.current; sound.current = null;
        await current.stopAsync(); await current.unloadAsync(); setPlaying(false); return;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const uri = await getVoiceUrl(path);
      const result = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      if (!mounted.current) { await result.sound.unloadAsync(); return; }
      sound.current = result.sound; setPlaying(true);
      result.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          if (mounted.current) setPlaying(false);
          sound.current = null; void result.sound.unloadAsync();
        }
      });
    } catch (issue) { if (mounted.current) setError(issue instanceof Error ? issue.message : 'تعذر تشغيل الرسالة'); }
    finally { if (mounted.current) setBusy(false); }
  }, [path, busy, disabled]);
  useEffect(() => {
    if (disabled && sound.current) {
      const current = sound.current; sound.current = null; setPlaying(false);
      void current.unloadAsync().catch(() => undefined);
    }
  }, [disabled]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (sound.current) { void sound.current.unloadAsync().catch(() => undefined); sound.current = null; } };
  }, [path]);
  return { playing, busy, error, toggle };
}
