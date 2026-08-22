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

  const handleGenerate = () => {
    // Generate a strong random 16-character string
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    const randomKey = Array.from(array, dec => ('0' + dec.toString(16)).substr(-8)).join('');
    setInputVal(randomKey);
    setError("");
  };

  const handleDownload = () => {
    if (inputVal.length < 8) {
      setError("Generate or type a valid passphrase first.");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([`MakeMyCV Encryption Key:\n\n${inputVal}\n\nWARNING: Do not lose this key. If you lose it, you will never be able to decrypt your saved resumes from the cloud!`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "makemycv_encryption_key.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-lg p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">enhanced_encryption</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zero-Knowledge Vault</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm leading-relaxed">
            Your resumes are incredibly sensitive. Before saving to the cloud, they are heavily encrypted <strong>directly inside your browser</strong> using AES-256-GCM. 
          </p>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm font-medium">
            ⚠️ The server never sees this key. If you lose it, your cloud resumes are permanently gone forever.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Encryption Passphrase</label>
              <button 
                type="button" 
                onClick={handleGenerate}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Generate Strong Key
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setError("");
                }}
                placeholder="Type a strong password or generate one..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors flex justify-center items-center gap-2 border border-gray-300 dark:border-gray-600"
            >
              <span className="material-symbols-outlined text-sm">download</span> Save Key
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-green-500/30"
            >
              Unlock <span className="material-symbols-outlined text-sm">lock_open</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
