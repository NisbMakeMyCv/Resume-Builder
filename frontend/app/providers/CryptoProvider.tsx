"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CryptoContextType {
  passphrase: string | null;
  setPassphrase: (passphrase: string) => void;
  clearPassphrase: () => void;
  isUnlocked: boolean;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [passphrase, setPassphraseState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load from sessionStorage on mount
    const stored = sessionStorage.getItem("makemycv_crypto_key");
    if (stored) {
      setPassphraseState(stored);
    }
    setIsInitialized(true);
  }, []);

  const setPassphrase = (key: string) => {
    sessionStorage.setItem("makemycv_crypto_key", key);
    setPassphraseState(key);
  };

  const clearPassphrase = () => {
    sessionStorage.removeItem("makemycv_crypto_key");
    setPassphraseState(null);
  };

  if (!isInitialized) return null; // Or a minimal loading spinner

  return (
    <CryptoContext.Provider
      value={{
        passphrase,
        setPassphrase,
        clearPassphrase,
        isUnlocked: !!passphrase,
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
