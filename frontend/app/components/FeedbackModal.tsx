"use client";

import { useState, useEffect, FormEvent } from "react";
import MaterialIcon from "./MaterialIcon";
import { sendFeedback } from "@/lib/api";

const CATEGORIES = [
  { id: "general", label: "General Feedback", icon: "forum" },
  { id: "bug", label: "Bug Report", icon: "bug_report" },
  { id: "feature", label: "Feature Request", icon: "lightbulb" },
  { id: "contact", label: "Contact Us", icon: "mail" },
] as const;

export default function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Reset form state when opened
  useEffect(() => {
    if (open) {
      setMessage("");
      setEmail("");
      setError("");
      setSubmitted(false);
      setLoading(false);
    }
  }, [open]);

  // Lock scroll + close on Escape key
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter your message or feedback.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendFeedback({
        message: message.trim(),
        category,
        email: email.trim() || null,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl overflow-hidden entrance-fade-up">
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <MaterialIcon name="chat" filled className="text-[22px]" />
            </div>
            <div>
              <h2
                id="feedback-modal-title"
                className="text-headline-md font-bold text-on-surface"
              >
                Send Us Feedback
              </h2>
              <p className="text-label-sm text-on-surface-variant">
                100% Anonymous & Direct to our team
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              <MaterialIcon name="check_circle" filled className="text-4xl" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface">Thank You!</h3>
            <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
              Your feedback has been submitted anonymously. We read every response to keep improving NISB-MakeMyCV.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Category Selector Pills */}
            <div className="space-y-2">
              <label className="text-label-md font-semibold text-on-surface block">
                What is this about?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-label-sm font-medium transition-all gap-1 ${
                      category === cat.id
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                        : "border-outline-variant bg-surface-bright text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <MaterialIcon name={cat.icon} className="text-[18px]" />
                    <span className="truncate w-full text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="feedback-message" className="text-label-md font-semibold text-on-surface">
                  Your Message <span className="text-error">*</span>
                </label>
                <span className="text-label-sm text-on-surface-variant/70">
                  {message.length}/2000
                </span>
              </div>
              <textarea
                id="feedback-message"
                rows={4}
                maxLength={2000}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you like, report an issue, or suggest a new feature..."
                className="w-full p-3 bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant rounded-2xl text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-email" className="text-label-md font-semibold text-on-surface flex items-center justify-between">
                <span>Email Address <span className="text-on-surface-variant/60 font-normal">(Optional)</span></span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-normal">
                  <MaterialIcon name="lock" className="text-[14px]" /> Anonymous unless specified
                </span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com (only if you'd like a reply)"
                className="w-full px-4 py-2.5 bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant rounded-xl text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl border border-error-container bg-error-container/40 text-on-error-container text-label-md flex items-center gap-2">
                <MaterialIcon name="error" className="text-error text-[18px]" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end gap-3 items-center border-t border-outline-variant/60">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-outline px-5 py-2.5 rounded-full text-label-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="btn-primary btn-shine btn-magnetic px-6 py-2.5 rounded-full text-label-md font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <MaterialIcon name="sync" className="animate-spin text-[18px]" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MaterialIcon name="send" className="text-[18px]" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
