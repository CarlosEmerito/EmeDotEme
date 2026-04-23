const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('No secret configured for session management');
  }
  return secret;
}

async function getKey(secret: string) {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function createSession() {
  const secret = getSecret();
  const key = await getKey(secret);

  // Set expiration to 7 days from now
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ role: 'admin', exp: expiresAt });

  const data = encoder.encode(payload);
  const signature = await crypto.subtle.sign('HMAC', key, data);

  const payloadBase64 = btoa(payload);
  const signatureBase64 = arrayBufferToBase64(signature);

  return `${payloadBase64}.${signatureBase64}`;
}

export async function verifySession(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadBase64, signatureBase64] = parts;
    const secret = getSecret();
    const key = await getKey(secret);

    const signature = base64ToArrayBuffer(signatureBase64);
    const data = encoder.encode(atob(payloadBase64));

    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);

    if (!isValid) return false;

    const payload = JSON.parse(atob(payloadBase64));

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
