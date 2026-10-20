import * as FileSystem from 'expo-file-system';

// SDK 53 exports the classic API from the root; newer SDKs export File there.
// Avoid a /legacy import, which is absent from SDK 53's installed package.
interface CompatibleFileSystem {
  File?: new (uri: string) => { base64: () => Promise<string> };
  readAsStringAsync?: (uri: string, options: { encoding: string }) => Promise<string>;
}
export async function readNativeBase64(uri: string): Promise<string> {
  const compatible = FileSystem as unknown as CompatibleFileSystem;
  if (compatible.File) return new compatible.File(uri).base64();
  if (compatible.readAsStringAsync) return compatible.readAsStringAsync(uri, { encoding: 'base64' });
  throw new Error('Native attachment reading is unavailable');
}
