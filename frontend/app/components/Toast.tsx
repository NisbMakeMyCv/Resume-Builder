"use client";

import { useEffect, useRef, useState } from "react";
import MaterialIcon from "./MaterialIcon";

type ToastKind = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  kind: ToastKind;
  text: string;
};

/**
 * Lightweight toast system for save/error feedback.
 *
 * <ToastStack toasts={toasts} onDismiss={remove} />
 * Rendered once at page root; toasts auto-dismiss after 4s (errors 6s).
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  function push(kind: ToastKind, text: string) {
    const id = ++nextId.current;
    setToasts((prev) => [...prev.slice(-3), { id, kind, text }]);
    return id;
  }
  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }
  const notify = {
    success: (text: string) => push("success", text),
    error: (text: string) => push("error", text),
    info: (text: string) => push("info", text),
  };

  return { toasts, push, dismiss, notify };
}

const KIND_STYLES: Record<ToastKind, string> = {
  success: "bg-[#006496] text-white",
  error: "bg-error text-on-error",
  info: "bg-tertiary text-on-tertiary",
};

const KIND_ICONS: Record<ToastKind, string> = {
  success: "check_circle",
  error: "error",
  info: "info",
};

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  // Auto-dismiss after a delay (errors linger a little longer).
  useEffect(() => {
    const t = setTimeout(
      () => onDismiss(toast.id),
      toast.kind === "error" ? 6000 : 4000
    );
    return () => clearTimeout(t);
  }, [toast.id, toast.kind, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 pl-4 pr-2 py-2.5 rounded-full shadow-lg ${KIND_STYLES[toast.kind]} entrance-fade-up`}
    >
      <MaterialIcon name={KIND_ICONS[toast.kind]} className="text-[18px]" filled />
      <span className="text-label-md">{toast.text}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="ml-1 p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
      >
        <MaterialIcon name="close" className="text-[16px]" />
      </button>
    </div>
  );
}
