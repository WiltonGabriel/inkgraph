import type { AppSettings, ProjectData } from '../types/project';

export interface InkpackEnvelope {
  readonly format: 'inkpack-v1';
  readonly kdf: 'PBKDF2-HMAC-SHA256';
  readonly iterations: 600000;
  readonly cipher: 'AES-256-GCM';
  readonly saltB64: string;
  readonly ivB64: string;
  readonly ciphertextB64: string;
  readonly exportedAt: string;
}

export interface InkpackPlaintextPayload {
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly workspaces: ProjectData[];
  readonly sanitizedSettings?: Omit<AppSettings, 'geminiApiKey'>;
}

const PBKDF2_ITERATIONS = 600_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  usage: KeyUsage[]
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  );
}

/**
 * Strips cloud API keys/secrets from settings before packing portable backups.
 */
export function sanitizeSettingsForExport(
  settings: AppSettings
): Omit<AppSettings, 'geminiApiKey'> {
  const { geminiApiKey: _redacted, ...rest } = settings;
  return rest;
}

export async function encryptInkpack(
  payload: InkpackPlaintextPayload,
  passphrase: string
): Promise<InkpackEnvelope> {
  if (!passphrase || passphrase.length < 6) {
    throw new Error('Passphrase must contain at least 6 characters.');
  }
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt, ['encrypt']);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoded
  );

  return {
    format: 'inkpack-v1',
    kdf: 'PBKDF2-HMAC-SHA256',
    iterations: PBKDF2_ITERATIONS,
    cipher: 'AES-256-GCM',
    saltB64: bytesToBase64(salt),
    ivB64: bytesToBase64(iv),
    ciphertextB64: bytesToBase64(new Uint8Array(encrypted)),
    exportedAt: new Date().toISOString(),
  };
}

export async function decryptInkpack(
  envelope: InkpackEnvelope,
  passphrase: string
): Promise<InkpackPlaintextPayload> {
  if (envelope.format !== 'inkpack-v1') {
    throw new Error('Unsupported .inkpack archive format.');
  }
  const salt = base64ToBytes(envelope.saltB64);
  const iv = base64ToBytes(envelope.ivB64);
  const ciphertext = base64ToBytes(envelope.ciphertextB64);
  const key = await deriveAesKey(passphrase, salt, ['decrypt']);

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );
  const jsonText = new TextDecoder().decode(decrypted);
  return JSON.parse(jsonText) as InkpackPlaintextPayload;
}
