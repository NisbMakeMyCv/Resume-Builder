"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AppSidebar from "../components/AppSidebar";
import MaterialIcon from "../components/MaterialIcon";
import Protected from "../components/Protected";
import Reveal from "../components/Reveal";
import {
  apiRequest,
  clearSession,
  deleteAccount,
  getProfile,
  getStoredUser,
  getToken,
  storeUser,
  updateProfile,
  type CurrentUser,
  type Profile,
} from "../../lib/api";

/**
 * Master Profile — one place to maintain the details that power every
 * resume (headline, summary, location), plus account management.
 *
 * Profile text is stored via GET/PATCH /api/v1/profile/ (the backend
 * auto-creates a blank profile so the GET never 404s). The avatar shown
 * is `profile_picture` from GET /api/v1/auth/me — a Google login picture
 * for Google accounts or a generated UI-Avatar for email accounts.
 *
 * Deleting the account calls DELETE /api/v1/auth/me (GDPR wipe) and then
 * clears the local session.
 */
export default function ProfilePage() {
  return (
    <Protected>
      <ProfileInner />
    </Protected>
  );
}

function ProfileInner() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(getStoredUser());

  // Profile text (headline / summary / location)
  const [profile, setProfile] = useState<Profile>({
    headline: null,
    summary: null,
    location: null,
  });
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  // Delete account flow
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    Promise.all([apiRequest<CurrentUser>("/auth/me", { token }), getProfile(token)])
      .then(([me, p]) => {
        setUser(me);
        storeUser(me);
        setProfile(p);
        setHeadline(p.headline ?? "");
        setSummary(p.summary ?? "");
        setLocation(p.location ?? "");
      })
      .catch(() => {
        /* token may have expired — Protected redirects on next visit */
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty =
    headline !== (profile.headline ?? "") ||
    summary !== (profile.summary ?? "") ||
    location !== (profile.location ?? "");

  const saveProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile(token, {
        headline: headline.trim() || null,
        summary: summary.trim() || null,
        location: location.trim() || null,
      });
      setProfile(updated);
      setHeadline(updated.headline ?? "");
      setSummary(updated.summary ?? "");
      setLocation(updated.location ?? "");
      setSavedAt(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }, [headline, summary, location]);

  const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(token);
      clearSession();
      router.replace("/signup");
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete your account. Please try again."
      );
      setDeleting(false);
    }
  };

  const initials = (user?.full_name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="page-enter min-h-screen bg-surface text-on-surface">
      <AppSidebar />

      {/* Top App Bar */}
      <header className="fixed z-40 flex justify-between items-center px-4 lg:px-8 h-14 lg:h-16 top-14 lg:top-0 left-0 lg:left-[var(--sidebar-width)] w-full lg:w-[calc(100%-var(--sidebar-width))] bg-surface border-b border-outline-variant">
        <h1 className="text-headline-md font-bold text-primary">
          Master Profile
        </h1>
        <button
          type="button"
          onClick={saveProfile}
          disabled={!dirty || saving}
          className="btn-primary btn-shine px-4 lg:px-6 py-2 rounded-full text-label-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <MaterialIcon name="sync" className="animate-spin text-[18px]" />
          ) : (
            <MaterialIcon name="save" className="text-[18px]" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-28 lg:pt-24 lg:ml-[var(--sidebar-width)] pb-16 px-4 lg:px-8 min-h-screen">
        <div className="max-w-[960px] mx-auto space-y-8">
          {/* Page Title */}
          <div>
            <h2 className="text-headline-md text-on-surface">
              Master Profile
            </h2>
            <p className="text-body-md text-on-surface-variant">
              One source of truth for every resume you build. Our AI uses
              these details to tailor your achievements.
            </p>
          </div>

          {/* Identity Card — avatar + name + email */}
          <Reveal>
            <div className="ambient-card bg-white rounded-2xl border border-outline-variant p-8 flex flex-col sm:flex-row items-center sm:items-center gap-6">
              <div className="relative shrink-0">
                {user?.profile_picture ? (
                  <Image
                    src={user.profile_picture}
                    alt={user?.full_name ?? "Profile"}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-fixed"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-headline-lg font-bold ring-4 ring-primary-fixed">
                    {initials}
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 rounded-full bg-surface-container/60 animate-pulse" />
                )}
              </div>

              <div className="text-center sm:text-left flex-1 min-w-0">
                <h3 className="text-headline-md text-on-surface truncate">
                  {user?.full_name ?? "Loading..."}
                </h3>
                <p className="text-label-md text-on-surface-variant truncate">
                  {user?.email ?? ""}
                </p>
                <p className="text-label-sm text-secondary mt-1">
                  {user?.profile_picture
                    ? "Profile picture synced from your account"
                    : "No profile picture set yet"}
                </p>
              </div>

              {savedAt && (
                <div className="flex items-center gap-1.5 text-label-sm text-secondary shrink-0">
                  <MaterialIcon name="check_circle" className="text-[16px]" />
                  Saved{" "}
                  {savedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </Reveal>

          {/* Profile Details */}
          <Reveal delay={100}>
            <div className="ambient-card bg-white rounded-2xl border border-outline-variant overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex items-center gap-3">
                <MaterialIcon name="badge" className="text-primary" />
                <h4 className="text-headline-md text-primary">
                  Profile Details
                </h4>
              </div>

              <div className="p-6 space-y-6">
                <Field
                  label="Headline"
                  hint="A one-line summary of who you are professionally."
                >
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60"
                    placeholder="e.g. Senior Full-Stack Engineer"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    disabled={loading || saving}
                  />
                </Field>

                <Field
                  label="Summary"
                  hint="A short paragraph our AI uses when tailoring your resumes."
                >
                  <textarea
                    className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60 resize-y"
                    placeholder="e.g. Engineer with 5 years of experience shipping..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    disabled={loading || saving}
                  />
                </Field>

                <Field
                  label="Location"
                  hint="Where you're based — shown on your resume."
                >
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60"
                    placeholder="e.g. Bengaluru, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={loading || saving}
                  />
                </Field>

                {error && (
                  <div className="rounded-lg border border-error-container bg-error-container/40 px-4 py-3 text-label-md text-on-error-container">
                    {error}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={!dirty || saving || loading}
                    className="btn-primary btn-shine px-6 py-2.5 rounded-full text-label-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <MaterialIcon
                        name="sync"
                        className="animate-spin text-[18px]"
                      />
                    ) : (
                      <MaterialIcon name="save" className="text-[18px]" />
                    )}
                    {saving ? "Saving..." : dirty ? "Save Profile" : "Saved"}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Danger Zone — Delete Account */}
          <Reveal delay={200}>
            <div className="ambient-card bg-white rounded-2xl border border-error-container overflow-hidden">
              <div className="p-6 border-b border-error-container/40 flex items-center gap-3">
                <MaterialIcon name="delete_forever" className="text-error" />
                <h4 className="text-headline-md text-on-surface">
                  Danger Zone
                </h4>
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
                  {deleteError && (
                    <p className="text-label-sm text-error mt-2">{deleteError}</p>
                  )}
                </div>

                {confirmingDelete ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="btn-primary px-5 py-2.5 rounded-full text-label-md !bg-error !bg-gradient-none text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <MaterialIcon
                          name="sync"
                          className="animate-spin text-[18px]"
                        />
                      ) : (
                        <MaterialIcon name="check" className="text-[18px]" />
                      )}
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={deleting}
                      className="btn-outline px-5 py-2.5 rounded-full text-label-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="btn-outline px-5 py-2.5 rounded-full text-label-md !border-error !text-error hover:!bg-error-container shrink-0"
                  >
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      {/* Footer */}
      <footer className="lg:ml-[var(--sidebar-width)] lg:w-[calc(100%-var(--sidebar-width))] w-full flex flex-col lg:flex-row gap-4 justify-between items-center px-4 lg:px-8 py-8 bg-surface-container-lowest border-t border-outline-variant">
        <div className="flex items-center gap-8">
          <span className="text-label-md font-bold text-on-surface">
            NISB-MakeMyCV
          </span>
          <div className="flex gap-4">
            <a
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Terms
            </a>
          </div>
        </div>
        <p className="text-label-sm text-on-surface-variant">
          © 2026 NISB-MakeMyCV. Made by NISB.
        </p>
      </footer>
    </div>
  );
}

/* =========================================================
   LOCAL COMPONENTS
   ========================================================= */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-label-md font-semibold text-on-surface">
          {label}
        </label>
        <span className="text-label-sm text-on-surface-variant">{hint}</span>
      </div>
      {children}
    </div>
  );
}
