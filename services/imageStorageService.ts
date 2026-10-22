import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { randomUUID } from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import { getSupabaseClient } from '@/template';
import { readNativeBase64 } from './fileSystemService';

export async function uploadJpegImage(bucket: 'bazgo-cargo' | 'bazgo-profiles', uri: string, userId: string): Promise<string> {
  if (!userId || !uri) throw new Error('يلزم تسجيل الدخول وإضافة صورة');
  const image = await manipulateAsync(uri, [{ resize: { width: 1600 } }], { compress: 0.75, format: SaveFormat.JPEG });
  let body: Blob | ArrayBuffer;
  if (Platform.OS === 'web') {
    const response = await fetch(image.uri);
    if (!response.ok) throw new Error('تعذر قراءة الصورة');
    body = await response.blob();
  } else {
    body = decode(await readNativeBase64(image.uri));
  }
  const size = body instanceof ArrayBuffer ? body.byteLength : body.size;
  if (!size || size > 5 * 1024 * 1024) throw new Error('حجم الصورة يجب أن يكون أقل من 5 ميغابايت');
  const path = `${userId}/${randomUUID()}.jpg`;
  const { error } = await getSupabaseClient().storage.from(bucket).upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
