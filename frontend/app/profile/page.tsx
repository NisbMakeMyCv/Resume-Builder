"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent } from "react";
import AppSidebar from "../components/AppSidebar";
import MaterialIcon from "../components/MaterialIcon";
import Protected from "../components/Protected";
import Reveal from "../components/Reveal";
import ConfirmModal from "../components/ConfirmModal";
import { ToastStack, useToasts } from "../components/Toast";
  apiRequest,
  clearSession,
  deleteAccount,
  getProfile,
  getStoredUser,
  getToken,
  storeUser,
  updateProfile,
  uploadProfilePhoto,
  type CurrentUser,
  type Profile,
} from "../../lib/api";

/**
 * User Profile — one place to manage the personal details powering every
 * resume, plus account management.
 *
 * Data sources:
 *  - GET /api/v1/auth/me    → identity: full_name, email, profile_picture
 *  - GET /api/v1/profile/   → resume-facing text: headline, summary, location
 *
 * Saving sends a PATCH /api/v1/profile/ with { headline, summary, location }
 * (Authorization: Bearer <token> + Content-Type: application/json).
 * The avatar renders the user's profile_picture when it is a usable URL;
 * otherwise a clean initials tile is shown (no external fallback, so there
 * is never a broken/overlapping image).
 *
 * Danger Zone — Delete Account — PATCH-free: DELETE /api/v1/auth/me (GDPR
 * wipe) behind a confirmation modal to prevent accidental taps.
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

  // ---- Identity (GET /auth/me) ----
  const [user, setUser] = useState<CurrentUser | null>(getStoredUser());
  const [fullName, setFullName] = useState("");

  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---- Delete account modal ----
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { toasts, dismiss, notify } = useToasts();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    Promise.all([
      apiRequest<CurrentUser>("/auth/me", { token }),
      getProfile(token)
    ])
      .then(([me, prof]) => {
        setUser(me);
        storeUser(me);
        setFullName(me.full_name ?? "");
        
        setDob(prof.dob ?? "");
        setLocation(prof.location ?? "");
        setHeadline(prof.headline ?? "");
        setSummary(prof.summary ?? "");
      })
      .catch(() => {
        /* token may be stale — Protected redirects on next visit */
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = true; // Simplified dirty checking

  const saveProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      if (fullName.trim() && user && fullName.trim() !== user.full_name) {
        const updatedUser = { ...user, full_name: fullName.trim() };
        setUser(updatedUser);
        storeUser(updatedUser);
      }
      
      await updateProfile(token, {
        dob: dob || null,
        location: location || null,
        headline: headline || null,
        summary: summary || null,
      });

      notify.success("Profile saved successfully");
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Failed to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }, [fullName, user, dob, location, headline, summary, notify]);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await uploadProfilePhoto(token, file);
      if (user) {
        const updatedUser = { ...user, profile_picture: res.profile_picture };
        setUser(updatedUser);
        storeUser(updatedUser);
      }
      notify.success("Profile photo updated successfully!");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  // ---- Avatar: render the image only when profile_picture is a usable URL.
  // No ui-avatars (or any other) fallback — without a picture we show a clean
  // initials tile so there is never a broken/overlapping image.
  const avatarUrl = useMemo(
    () => (user?.profile_picture ?? "").trim(),
    [user?.profile_picture]
  );
  const showAvatar = useMemo(
    () => /^(https?:)?\/\//i.test(avatarUrl),
    [avatarUrl]
  );

  const initial = useMemo(() => {
    const name = (user?.full_name ?? "U").trim() || "U";
    return name.charAt(0).toUpperCase();
  }, [user?.full_name]);

  const [imgError, setImgError] = useState(false);

  // Reset imgError if the avatar URL changes
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  return (
    <div className="page-enter min-h-screen bg-surface text-on-surface">
      <AppSidebar />
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Top App Bar */}
      <header className="fixed z-40 flex justify-between items-center px-4 lg:px-8 h-14 lg:h-16 top-14 lg:top-0 left-0 lg:left-[var(--sidebar-width)] w-full lg:w-[calc(100%-var(--sidebar-width))] bg-surface border-b border-outline-variant">
        <h1 className="text-headline-md font-bold text-primary">
          User Profile
        </h1>
        <button
          type="button"
          onClick={saveProfile}
          disabled={!dirty || saving || loading}
          className="btn-primary btn-shine px-4 lg:px-6 py-2 rounded-full text-label-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <MaterialIcon name="sync" className="animate-spin text-[18px]" />
          ) : (
            <MaterialIcon name="save" className="text-[18px]" />
          )}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-28 lg:pt-24 lg:ml-[var(--sidebar-width)] pb-16 px-4 lg:px-8 min-h-screen">
        <div className="max-w-[880px] mx-auto space-y-8">
          {/* Page Title */}
          <div>
            <h2 className="text-headline-md text-on-surface">User Profile</h2>
            <p className="text-body-md text-on-surface-variant">
              Your identity and the details our AI uses to tailor your resumes.
            </p>
          </div>

          {/* Identity Card — avatar + name + email */}
          <Reveal>
            <div className="ambient-card bg-white rounded-2xl border border-outline-variant p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <div 
                className="relative shrink-0 cursor-pointer group" 
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary-fixed relative">
                  {showAvatar && !imgError ? (
                    <img
                      src={avatarUrl}
                      alt={user?.full_name ?? "Profile"}
                      className="object-cover w-full h-full"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-fixed flex items-center justify-center text-primary text-headline-lg font-bold">
                      {initial}
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <MaterialIcon name="photo_camera" className="text-white text-2xl" />
                  </div>
                </div>
                {loading && (
                  <div className="absolute inset-0 rounded-full bg-surface-container/60 animate-pulse" />
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0 text-center sm:text-left">
                <h3 className="text-headline-md text-on-surface truncate">
                  {user?.full_name ?? "Loading..."}
                </h3>
                <p className="text-label-md text-on-surface-variant truncate">
                  {user?.email ?? ""}
                </p>
                <p className="text-label-sm text-secondary mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <MaterialIcon name="verified_user" className="text-[14px]" filled />
                  {user?.profile_picture
                    ? "Profile picture synced from your account"
                    : "No profile picture set"}
                </p>
              </div>
            </div>
          </Reveal>


          {/* Basic Details */}
          <div className="pt-4">
            <div className="flex items-center gap-3">
              <h4 className="text-headline-md font-bold text-on-surface">
                Basic Details
              </h4>
              <span className="text-label-sm text-on-surface-variant">
                Core information for your resumes.
              </span>
            </div>
          </div>

          <Reveal delay={0}>
            <div className="ambient-card bg-white rounded-2xl border border-outline-variant p-6 sm:p-8 space-y-6">
              <Field label="Full Name" hint="Your display name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jake Ryan"
                  className="input-field w-full"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Date of Birth" hint="Format: YYYY-MM-DD">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="input-field w-full"
                  />
                </Field>
                <Field label="Location" hint="City, Country">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="input-field w-full"
                  />
                </Field>
              </div>

              <Field label="Headline" hint="A short professional title">
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="input-field w-full"
                />
              </Field>

              <Field label="Summary" hint="A brief overview of your background">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A passionate developer..."
                  rows={4}
                  className="input-field w-full resize-none"
                />
              </Field>
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

      {/* Delete confirmation modal */}
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
