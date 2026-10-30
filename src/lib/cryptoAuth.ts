/**
 * Cryptographic security utilities for CivicTrace.
 * - Salted password hashing (never stored as plain text)
 * - Session token generation
 * - SHA-256 evidence digests
 */

// Fallback SHA-256 implementation
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  const hash: number[] = [];
  const k: number[] = [];

  let primeCounter = 0;
  for (let candidate = 2; primeCounter < 64; candidate++) {
    let isPrime = true;
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii.length; i++) {
    j = i >> 2;
    words[j] = (words[j] || 0) | (ascii.charCodeAt(i) << (24 - (i % 4) * 8));
  }

  for (j = 0; j < words.length; j += 16) {
    const w: number[] = [];
    for (i = 0; i < 64; i++) {
      if (i < 16) {
        w[i] = words[j + i] || 0;
      } else {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = ((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0);
      }
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = ((h + s1) | 0) + ((ch + k[i]) | 0) + w[i];
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  let result = '';
  for (i = 0; i < 8; i++) {
    for (let shift = 28; shift >= 0; shift -= 4) {
      result += ((hash[i] >> shift) & 0xf).toString(16);
    }
  }
  return result;
}

/**
 * Computes deterministic SHA-256 hash.
 */
export async function computeSha256(payload: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return sha256Sync(payload);
    }
  }
  return sha256Sync(payload);
}

/**
 * Synchronous version for testing and immediate hashing.
 */
export function computeSha256Sync(payload: string): string {
  return sha256Sync(payload);
}

/**
 * Generates a random cryptographic salt.
 */
export function generateSalt(length: number = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Math.random fallback
  let salt = '';
  for (let i = 0; i < length * 2; i++) {
    salt += Math.floor(Math.random() * 16).toString(16);
  }
  return salt;
}

/**
 * Hashes a plain password with a unique salt:
 * Returns hash = SHA256(password + ":" + salt)
 */
export function hashPassword(password: string, salt: string): string {
  return sha256Sync(`${password}:${salt}`);
}

/**
 * Verifies a plain password against stored salt and hash.
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const computed = hashPassword(password, salt);
  return computed === storedHash;
}

/**
 * Generates a secure session token.
 */
export function generateSessionToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return generateSalt(24);
}

/**
 * Formats a SHA-256 hash for UI display (e.g. SHA-256: 7f8a...b41c).
 */
export function formatShaBadge(hash: string): string {
  if (!hash) return 'SHA-256: Pending';
  const clean = hash.replace(/^SHA-256:\s*/i, '');
  if (clean.length <= 12) return `SHA-256: ${clean}`;
  return `SHA-256: ${clean.substring(0, 6)}...${clean.substring(clean.length - 4)}`;
}
