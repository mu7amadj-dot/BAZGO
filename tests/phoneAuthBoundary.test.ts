// deno test --allow-read tests/phoneAuthBoundary.test.ts
// Static client/server boundary check; does not read .env, keys, bundles or user data.
import { assert } from 'jsr:@std/assert@1';

async function checkDirectory(directory: URL): Promise<void> {
  for await (const entry of Deno.readDir(directory)) {
    const path = new URL(`${entry.name}${entry.isDirectory ? '/' : ''}`, directory);
    if (entry.isDirectory) await checkDirectory(path);
    else if (/\.(tsx?|js)$/.test(entry.name)) {
      const content = await Deno.readTextFile(path);
      assert(!/\b(?:OTPIQ_API_KEY|SUPABASE_SERVICE_ROLE_KEY)\b/.test(content), `Server credential referenced in client source: ${path.pathname}`);
      assert(!content.includes('api.otpiq.com'), `Direct provider request in client source: ${path.pathname}`);
      assert(!/from\s+['"][^'"]*supabase\/functions\//.test(content), `Edge Function imported into client source: ${path.pathname}`);
    }
  }
}
Deno.test('Frontend cannot import server credentials, provider requests or Edge Function modules', async () => {
  for (const folder of ['app', 'components', 'contexts', 'hooks', 'services', 'constants', 'template']) {
    await checkDirectory(new URL(`../${folder}/`, import.meta.url));
  }
});
