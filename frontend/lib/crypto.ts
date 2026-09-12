/**
 * Plain Data Storage Helpers (Encryption disabled for 100% reliable document storage).
 */

export async function deriveKey(_passphrase: string, _salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const dummyKey = {} as CryptoKey;
  return { key: dummyKey, salt: new Uint8Array(16) };
}

export async function encryptData(data: string, _passphrase?: string): Promise<Blob> {
  return new Blob([data], { type: "application/json" });
}

export async function decryptData(blob: Blob, _passphrase?: string): Promise<string> {
  try {
    const text = await blob.text();
    return text;
  } catch (err) {
    return "{}";
  }
}
