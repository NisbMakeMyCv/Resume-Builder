"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/* =========================================================
   Types
   ========================================================= */

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

/* =========================================================
   Context
   ========================================================= */

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

/* =========================================================
   Icons (inline SVG — no extra dependency)
   ========================================================= */

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const STYLES: Record<ToastType, string> = {
  success: "bg-white border-l-4 border-green-500 text-on-surface",
  error:   "bg-white border-l-4 border-error text-on-surface",
  info:    "bg-white border-l-4 border-secondary text-on-surface",
  warning: "bg-white border-l-4 border-amber-500 text-on-surface",
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-green-500",
  error:   "text-error",
  info:    "text-secondary",
  warning: "text-amber-500",
};

/* =========================================================
   Single Toast item
   ========================================================= */

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Slide in on mount.
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Auto-dismiss.
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(item.id), 300);
    }, item.duration);
    return () => clearTimeout(timerRef.current);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full pointer-events-auto",
        "transition-all duration-300",
        STYLES[item.type],
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      )}
    >
      <span className={cn("shrink-0 mt-0.5", ICON_COLORS[item.type])}>
        {ICONS[item.type]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
      <button
        aria-label="Dismiss notification"
        className="shrink-0 text-outline hover:text-on-surface transition-colors"
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(item.id), 300);
        }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

/* =========================================================
   Provider + Toaster
   ========================================================= */

let _uid = 0;
function uid() { return `toast-${++_uid}`; }

/**
 * ToastProvider — wrap your app with this at the layout level.
 * Use the `useToast()` hook to fire notifications from any client component.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback(
    (message: string, type: ToastType, duration = 4000) => {
      setToasts((prev) => [...prev, { id: uid(), message, type, duration }]);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx: ToastContextValue = {
    success: (m, d) => add(m, "success", d),
    error:   (m, d) => add(m, "error", d),
    info:    (m, d) => add(m, "info", d),
    warning: (m, d) => add(m, "warning", d),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Fixed stack — top-right on desktop, bottom-center on mobile */}
      <div
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[800] flex flex-col gap-2 pointer-events-none sm:bottom-auto sm:top-4 sm:right-4"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast — returns methods to fire toast notifications.
 *
 * ```tsx
 * const toast = useToast();
 * toast.success("Resume saved!");
 * toast.error("Something went wrong.");
 * ```
 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
