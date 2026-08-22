"use client";

import React, { useState } from "react";
import { useCrypto } from "../providers/CryptoProvider";

interface PassphraseModalProps {
  onUnlock?: () => void;
}

export default function PassphraseModal({ onUnlock }: PassphraseModalProps) {
  const { isUnlocked, setPassphrase } = useCrypto();
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  if (isUnlocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.length < 8) {
      setError("Passphrase must be at least 8 characters.");
      return;
    }
    setPassphrase(inputVal);
    if (onUnlock) onUnlock();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Unlock Your Vault</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Enter your secure passphrase to access and encrypt your resumes. This key never leaves your browser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setError("");
              }}
              placeholder="Enter passphrase"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2"
          >
            Unlock <span className="material-symbols-outlined text-sm">key</span>
          </button>
        </form>
      </div>
    </div>
  );
}
