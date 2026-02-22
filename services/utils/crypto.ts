
/**
 * Cryptographic Utilities
 */

/**
 * Hashes a password using SHA-256.
 * Note: Client-side hashing is for demonstration/mock purposes.
 * In production, send raw password over HTTPS.
 */
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateId(prefix: string = 'ID'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
