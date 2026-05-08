// PCM Utilities for Audio Processing

/**
 * Convert Float32 audio samples to PCM16 little-endian, then to base64
 */
export function float32ToPcm16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  return uint8ArrayToBase64(bytes);
}

/**
 * Convert base64 to Float32Array (PCM16 little-endian)
 */
export function base64ToFloat32(base64: string, sampleRate: number = 24000): Float32Array {
  const bytes = base64ToUint8Array(base64);
  const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Calculate RMS (Root Mean Square) for audio level metering
 */
export function calculateRMS(float32: Float32Array): number {
  if (float32.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < float32.length; i++) {
    sum += float32[i] * float32[i];
  }
  return Math.sqrt(sum / float32.length);
}

/**
 * Convert RMS to decibels
 */
export function rmsToDb(rms: number): number {
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

/**
 * Normalize RMS to 0-1 range for VU meter display
 */
export function normalizeRms(rms: number, minDb: number = -60, maxDb: number = 0): number {
  const db = rmsToDb(rms);
  const normalized = (db - minDb) / (maxDb - minDb);
  return Math.max(0, Math.min(1, normalized));
}