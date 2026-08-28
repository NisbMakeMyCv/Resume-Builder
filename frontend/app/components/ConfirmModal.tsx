"use client";

import { useEffect } from "react";
import MaterialIcon from "./MaterialIcon";

/**
 * Accessible confirmation modal — used for destructive actions like
 * account deletion. Blocks interaction with the page behind it, locks
 * scroll, and responds to Escape.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Lock scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Dialog card */}
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl p-6 entrance-fade-up">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-error-container flex items-center justify-center shrink-0">
            <MaterialIcon name="warning" className="text-error" filled />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-modal-title"
              className="text-headline-md font-semibold text-on-surface"
            >
              {title}
            </h2>
            <div className="text-body-md text-on-surface-variant mt-1.5">
              {message}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error-container bg-error-container/40 px-4 py-3 text-label-md text-on-error-container">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-outline px-5 py-2.5 rounded-full text-label-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary px-5 py-2.5 rounded-full text-label-md !bg-error text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <MaterialIcon name="sync" className="animate-spin text-[18px]" />
                Deleting...
              </>
            ) : (
              <>
                <MaterialIcon name="delete_forever" className="text-[18px]" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
