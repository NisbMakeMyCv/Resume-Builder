"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppSidebar from "../components/AppSidebar";
import MaterialIcon from "../components/MaterialIcon";
import Protected from "../components/Protected";
import Reveal from "../components/Reveal";
import ConfirmModal from "../components/ConfirmModal";
import { ToastStack, useToasts } from "../components/Toast";
import { useTheme } from "../providers/ThemeProvider";
import {
  apiRequest,
  clearSession,
  deleteAccount,
  getStoredUser,
  getToken,
  type CurrentUser,
} from "../../lib/api";

export default function SettingsPage() {
  return (
    <Protected>
      <SettingsInner />
    </Protected>
  );
}

function SettingsInner() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<CurrentUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  // Password reset state (using the same forgot-password flow, but simplified since we are logged in)
  // Actually, we can just trigger a forgot-password email to their own email since we know they own it.
  const [sendingReset, setSendingReset] = useState(false);

  // Delete account modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { toasts, dismiss, notify } = useToasts();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    apiRequest<CurrentUser>("/auth/me", { token })
      .then((me) => {
        setUser(me);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await apiRequest<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email: user.email },
      });
      notify.success("Password reset instructions sent to your email!");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(token);
      clearSession();
      window.location.href = "/signup";
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete your account. Please try again."
      );
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-surface text-on-surface">
      <AppSidebar />
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Top App Bar */}
      <header className="fixed z-40 flex justify-between items-center px-4 lg:px-8 h-14 lg:h-16 top-14 lg:top-0 left-0 lg:left-[var(--sidebar-width)] w-full lg:w-[calc(100%-var(--sidebar-width))] bg-surface border-b border-outline-variant">
        <h1 className="text-headline-md font-bold text-primary">Settings</h1>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-28 lg:pt-24 lg:ml-[var(--sidebar-width)] pb-16 px-4 lg:px-8 min-h-screen">
        <div className="max-w-[880px] mx-auto space-y-8">
          <div>
            <h2 className="text-headline-md text-on-surface">Account Settings</h2>
            <p className="text-body-md text-on-surface-variant">
              Manage your preferences and account security.
            </p>
          </div>

          <Reveal>
            <div className="ambient-card bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex items-center gap-3">
                <MaterialIcon name="tune" className="text-primary" />
                <h4 className="text-headline-md text-primary">Preferences</h4>
              </div>
              <div className="p-6 space-y-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
    <h5 className="text-label-md font-semibold text-on-surface">
      Appearance
    </h5>
    <p className="text-label-sm text-on-surface-variant mt-1">
      Choose between light and dark mode.
    </p>
  </div>

  <div className="flex items-center gap-2 bg-surface-container rounded-full p-1 border border-outline-variant">
    <button
      type="button"
      onClick={() => setTheme("light")}
      className={`px-4 py-2 rounded-full text-label-md font-semibold transition ${
        theme === "light"
          ? "bg-primary text-on-primary shadow-sm"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      ☀ Light
    </button>

    <button
      type="button"
      onClick={() => setTheme("dark")}
      className={`px-4 py-2 rounded-full text-label-md font-semibold transition ${
        theme === "dark"
          ? "bg-primary text-on-primary shadow-sm"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      🌙 Dark
    </button>
  </div>
</div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="ambient-card bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex items-center gap-3">
                <MaterialIcon name="lock" className="text-primary" />
                <h4 className="text-headline-md text-primary">Security</h4>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h5 className="text-label-md font-semibold text-on-surface">Change Password</h5>
                    <p className="text-label-sm text-on-surface-variant mt-1 max-w-lg">
                      We'll send a password reset code to your email. (Not applicable if you logged in via Google).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={sendingReset}
                    className="btn-outline px-5 py-2.5 rounded-full text-label-md shrink-0 flex items-center gap-2"
                  >
                    {sendingReset && <MaterialIcon name="sync" className="animate-spin text-[16px]" />}
                    {sendingReset ? "Sending..." : "Reset Password"}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Danger Zone — Delete Account */}
          <Reveal delay={200}>
            <div className="ambient-card bg-surface-container-lowest rounded-2xl border border-error-container overflow-hidden">
              <div className="p-6 border-b border-error-container/40 flex items-center gap-3">
                <MaterialIcon name="delete_forever" className="text-error" />
                <h4 className="text-headline-md text-on-surface">Danger Zone</h4>
              </div>

              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-label-md font-semibold text-on-surface">
                    Delete account
                  </p>
                  <p className="text-label-sm text-on-surface-variant mt-1 max-w-lg">
                    Permanently wipes your identity, master profile, and all
                    resume data. This action cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="btn-outline px-5 py-2.5 rounded-full text-label-md !border-error !text-error hover:!bg-error-container shrink-0"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <ConfirmModal
        open={confirmOpen}
        title="Delete your account?"
        message={
          <>
            This will permanently erase your account, profile, and all resume
            data.{" "}
            <span className="font-semibold text-on-surface">
              This cannot be undone.
            </span>
          </>
        }
        confirmLabel="Delete Account"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
