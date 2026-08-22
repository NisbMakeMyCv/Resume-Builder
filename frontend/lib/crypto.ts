/**
 * Zero-Knowledge Client-Side Encryption using Web Crypto API
 * Uses AES-256-GCM for encryption/decryption.
 */

// Generate a random initialization vector (IV)
const generateIv = () => window.crypto.getRandomValues(new Uint8Array(12));

/**
 * Derives an AES-256-GCM crypto key from a user-provided passphrase.
 * Uses PBKDF2 with a random or provided salt.
 */
export async function deriveKey(passphrase: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const enc = new TextEncoder();
  
  // Create a base key material from the passphrase
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Use the provided salt or generate a new 16-byte salt
  const activeSalt = salt || window.crypto.getRandomValues(new Uint8Array(16));

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: activeSalt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return { key, salt: activeSalt };
}

/**
 * Encrypts a string (e.g., JSON resume data) using AES-256-GCM.
 * Returns a binary Blob containing: [Salt (16 bytes)] + [IV (12 bytes)] + [Ciphertext]
 */
export async function encryptData(data: string, passphrase: string): Promise<Blob> {
  const { key, salt } = await deriveKey(passphrase);
  const iv = generateIv();
  
  const enc = new TextEncoder();
  const encodedData = enc.encode(data);
  
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedData
  );
  
  // Combine salt, iv, and ciphertext into a single buffer
  const ciphertextArray = new Uint8Array(ciphertext);
  const combined = new Uint8Array(salt.length + iv.length + ciphertextArray.length);
  
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(ciphertextArray, salt.length + iv.length);
  
  return new Blob([combined], { type: "application/octet-stream" });
}

/**
 * Decrypts a binary Blob back into a string using AES-256-GCM.
 * Expects the Blob to contain: [Salt (16 bytes)] + [IV (12 bytes)] + [Ciphertext]
 */
export async function decryptData(blob: Blob, passphrase: string): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const dataArray = new Uint8Array(buffer);
  
  // Extract salt, IV, and ciphertext
  const salt = dataArray.slice(0, 16);
  const iv = dataArray.slice(16, 28);
  const ciphertext = dataArray.slice(28);
  
  const { key } = await deriveKey(passphrase, salt);
  
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed. Invalid passphrase or corrupted data.", error);
    throw new Error("Decryption failed");
  }
}
