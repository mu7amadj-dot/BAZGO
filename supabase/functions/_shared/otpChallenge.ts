// Server-only OTP generation and hashing. Never import this module into the app.
export const otpCodeLength = 6;
export const otpExpiresIn = 300;
export const otpResendAfter = 60;

export function generateOtp(randomValues: (array: Uint32Array) => Uint32Array = (array) => crypto.getRandomValues(array)): string {
  const range = 10 ** otpCodeLength;
  const ceiling = Math.floor(0x100000000 / range) * range;
  const value = new Uint32Array(1);
  // Rejection sampling avoids modulo bias. Leading zeros are retained.
  do { randomValues(value); } while (value[0] >= ceiling);
  return String(value[0] % range).padStart(otpCodeLength, '0');
}

export async function hashOtp(secret: string, phoneHash: string, challengeId: string, code: string): Promise<string> {
  if (!secret || !/^[a-f0-9]{64}$/.test(phoneHash) || !/^[a-f0-9-]{36}$/i.test(challengeId) || !/^\d{6}$/.test(code)) throw new Error('invalid_challenge_hash_input');
  // A keyed digest prevents offline enumeration of the small six-digit code space.
  // The preconfigured service-role secret is used only on this server, never stored with the digest.
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`bazgo:phone-otp:v1:${phoneHash}:${challengeId}:${code}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
