"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getToken, fetchEncryptionKey } from "../../lib/api";

interface CryptoContextType {
  passphrase: string | null;
  isUnlocked: boolean;
  isLoading: boolean;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

/**
 * CryptoProvider — transparently manages the per-user AES-256 encryption key.
 *
 * On mount it checks for a cached key in sessionStorage (so page refreshes
 * are instant). If none exists it fetches a fresh deterministic key from
 * GET /api/v1/auth/encryption-key, which the backend derives as
 * HMAC-SHA256(user_id, JWT_SECRET).
 *
 * Because the derivation is 100% deterministic, the same user always gets
 * the same key — resumes saved today can be decrypted months later with
 * zero user interaction.
 */
export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [passphrase, setPassphraseState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Serve from session cache for instant subsequent page loads
      const cached = sessionStorage.getItem("makemycv_crypto_key");
      if (cached) {
        setPassphraseState(cached);
        setIsLoading(false);
        return;
      }

      // 2. Fetch from backend (only needs network on first page load per session)
      const token = getToken();
      if (!token) {
        // Not logged in — no key needed yet
        setIsLoading(false);
        return;
      }

      try {
        const key = await fetchEncryptionKey(token);
        if (key) {
          sessionStorage.setItem("makemycv_crypto_key", key);
          setPassphraseState(key);
        }
      } catch {
        // Network error — encryption will be unavailable this session
        // The UI will still work; cloud save will gracefully fail with a toast
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return (
    <CryptoContext.Provider
      value={{
        passphrase,
        isUnlocked: !!passphrase,
        isLoading,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return context;
}
