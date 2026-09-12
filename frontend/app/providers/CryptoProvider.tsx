"use client";

import React, { createContext, useContext, useState } from "react";

interface CryptoContextType {
  passphrase: string | null;
  isUnlocked: boolean;
  isLoading: boolean;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [passphrase] = useState<string | null>("plain-storage");

  return (
    <CryptoContext.Provider
      value={{
        passphrase,
        isUnlocked: true,
        isLoading: false,
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
