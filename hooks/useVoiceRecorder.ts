import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Audio } from 'expo-av';
export interface VoiceDraft { uri: string; durationMs: number; mime: string; }
export function useVoiceRecorder() {
  const recording = useRef<Audio.Recording | null>(null);
  const mounted = useRef(true);
  const changing = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [draft, setDraft] = useState<VoiceDraft | null>(null);
  const [error, setError] = useState('');
  const stop = useCallback(async () => {
    const current = recording.current;
    if (!current || changing.current) return;
    changing.current = true;
    try {
      const status = await current.getStatusAsync();
      await current.stopAndUnloadAsync();
      const uri = current.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (mounted.current && uri) setDraft({ uri, durationMs: Math.min(60000, Math.max(1,status.durationMillis)), mime: Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4' });
    } catch (issue) { if (mounted.current) setError(issue instanceof Error ? issue.message : 'تعذر إنهاء التسجيل'); }
    finally { recording.current = null; changing.current = false; if (mounted.current) setIsRecording(false); }
  }, []);
  const start = useCallback(async () => {
    if (changing.current || recording.current) return;
    changing.current = true; setError(''); setDraft(null);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) throw new Error('يرجى السماح باستخدام الميكروفون لإرسال رسالة صوتية.');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      if (!mounted.current) { await result.recording.stopAndUnloadAsync(); await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); return; }
      recording.current = result.recording; setIsRecording(true); setDurationMs(0);
      result.recording.setProgressUpdateInterval(250);
      result.recording.setOnRecordingStatusUpdate((status) => {
        if (mounted.current && status.isRecording) setDurationMs(status.durationMillis);
        if (status.isRecording && status.durationMillis >= 60000) void stop();
      });
    } catch (issue) {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => undefined);
      if (mounted.current) setError(issue instanceof Error ? issue.message : 'تعذر بدء التسجيل');
    }
    finally { changing.current = false; }
  }, [stop]);
  const discard = useCallback(() => { setDraft(null); setError(''); }, []);
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') void stop(); });
    return () => {
      subscription.remove();
      mounted.current = false;
      const current = recording.current; recording.current = null;
      if (current) void current.stopAndUnloadAsync().catch(() => undefined).finally(() => Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => undefined));
    };
  }, [stop]);
  return { isRecording, durationMs, draft, error, start, stop, discard };
}
