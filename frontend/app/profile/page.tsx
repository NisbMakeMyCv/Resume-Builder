"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent } from "react";
import AppSidebar from "../components/AppSidebar";
import MaterialIcon from "../components/MaterialIcon";
import Protected from "../components/Protected";
import Reveal from "../components/Reveal";
import ConfirmModal from "../components/ConfirmModal";
import ResumeDataSection from "../components/ResumeDataSection";
import { ToastStack, useToasts } from "../components/Toast";
import {
  apiRequest,
  clearSession,
  deleteAccount,
  educationApi,
  experienceApi,
  getProfile,
  getStoredUser,
  getToken,
  projectsApi,
  skillsApi,
  storeUser,
  updateProfile,
  uploadProfilePhoto,
  type CurrentUser,
  type EducationCreateInput,
  type ExperienceCreateInput,
  type Profile,
  type ProjectCreateInput,
  type SkillCreateInput,
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
  // ---- Profile text (GET /profile/) ----
  const [profile, setProfile] = useState<Profile>({
    headline: null,
    summary: null,
    location: null,
  });

  // ---- Form fields ----
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [location, setLocation] = useState("");

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
      getProfile(token),
    ])
      .then(([me, p]) => {
        setUser(me);
        storeUser(me);
        setProfile(p);
        setFullName(me.full_name ?? "");
        setHeadline(p.headline ?? "");
        setSummary(p.summary ?? "");
        setLocation(p.location ?? "");
      })
      .catch(() => {
        /* token may be stale — Protected redirects on next visit */
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty =
    fullName !== (user?.full_name ?? "") ||
    headline !== (profile.headline ?? "") ||
    summary !== (profile.summary ?? "") ||
    location !== (profile.location ?? "");

  const saveProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
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

      // If full_name changed, persist the new name for the sidebar/avatar too.
      if (fullName.trim() && user && fullName.trim() !== user.full_name) {
        const updatedUser = { ...user, full_name: fullName.trim() };
        setUser(updatedUser);
        storeUser(updatedUser);
      }
      notify.success("Profile saved successfully");
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Failed to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }, [fullName, headline, summary, location, user, notify]);

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
                  {showAvatar ? (
                    <img
                      src={avatarUrl}
                      alt={user?.full_name ?? "Profile"}
                      className="object-cover w-full h-full"
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
                {/* Full name — editable, saved to auth/me on the backend */}
                <Field
                  label="Full Name"
                  hint="Shown on your resumes and account."
                >
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60"
                    placeholder="e.g. Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading || saving}
                  />
                </Field>

                {/* Email — read-only (managed by auth) */}
                <Field label="Email" hint="Read-only — managed by your account.">
                  <div className="relative">
                    <MaterialIcon
                      name="mail"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]"
                    />
                    <input
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant text-body-md cursor-not-allowed"
                      value={user?.email ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                </Field>

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
                    placeholder="e.g. Engineer with 5 years of experience shipping…"
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

                <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-2">
                  {dirty && (
                    <span className="text-label-sm text-on-surface-variant sm:mr-auto">
                      Unsaved changes
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={!dirty || saving || loading}
                    className="btn-primary btn-shine px-6 py-2.5 rounded-full text-label-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <MaterialIcon
                        name="sync"
                        className="animate-spin text-[18px]"
                      />
                    ) : (
                      <MaterialIcon name="save" className="text-[18px]" />
                    )}
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Resume Data — the four building blocks behind every resume */}
          <div className="pt-4">
            <div className="flex items-center gap-3">
              <h4 className="text-headline-md font-bold text-on-surface">
                Resume Data
              </h4>
              <span className="text-label-sm text-on-surface-variant">
                The building blocks used in every resume you create.
              </span>
            </div>
          </div>

          <Reveal delay={0}>
            <ResumeDataSection
              title="Education"
              icon="school"
              emptyLabel="No education yet — add your first institution."
              fields={[
                { name: "institution", label: "Institution", placeholder: "e.g. BMS College of Engineering", required: true },
                { name: "degree", label: "Degree", placeholder: "e.g. B.E. in Computer Science", required: true },
                { name: "branch", label: "Branch", placeholder: "e.g. Computer Science", required: true },
                { name: "start_date", label: "Start Date", kind: "date", required: true },
                { name: "end_date", label: "End Date", kind: "date" },
                { name: "cgpa", label: "CGPA", kind: "number", placeholder: "e.g. 8.5" },
              ]}
              fetchList={(token: string) => educationApi.list(token)}
              createItem={(token: string, payload: EducationCreateInput) =>
                educationApi.create(token, payload)
              }
              updateItem={(token: string, id: string, payload: Partial<EducationCreateInput>) =>
                educationApi.update(token, id, payload)
              }
              deleteItem={(token: string, id: string) => educationApi.remove(token, id)}
            />
          </Reveal>

          <Reveal delay={40}>
            <ResumeDataSection
              title="Experience"
              icon="work"
              emptyLabel="No work experience yet — add your first role."
              fields={[
                { name: "company", label: "Company", placeholder: "e.g. Google", required: true },
                { name: "designation", label: "Designation", placeholder: "e.g. Software Engineer", required: true },
                { name: "start_date", label: "Start Date", kind: "date", required: true },
                { name: "end_date", label: "End Date", kind: "date" },
                { name: "description", label: "Description", kind: "textarea", placeholder: "What did you build, own, or improve?" },
              ]}
              fetchList={(token: string) => experienceApi.list(token)}
              createItem={(token: string, payload: ExperienceCreateInput) =>
                experienceApi.create(token, payload)
              }
              updateItem={(token: string, id: string, payload: Partial<ExperienceCreateInput>) =>
                experienceApi.update(token, id, payload)
              }
              deleteItem={(token: string, id: string) => experienceApi.remove(token, id)}
            />
          </Reveal>

          <Reveal delay={80}>
            <ResumeDataSection
              title="Skills"
              icon="bolt"
              emptyLabel="No skills yet — add a skill and its proficiency."
              fields={[
                { name: "skill_name", label: "Skill", placeholder: "e.g. React", required: true },
                {
                  name: "proficiency",
                  label: "Proficiency",
                  kind: "select",
                  required: true,
                  options: [
                    { value: "Beginner", label: "Beginner" },
                    { value: "Intermediate", label: "Intermediate" },
                    { value: "Expert", label: "Expert" },
                  ],
                },
              ]}
              fetchList={(token: string) => skillsApi.list(token)}
              createItem={(token: string, payload: SkillCreateInput) =>
                skillsApi.create(token, payload)
              }
              updateItem={(token: string, id: string, payload: Partial<SkillCreateInput>) =>
                skillsApi.update(token, id, payload)
              }
              deleteItem={(token: string, id: string) => skillsApi.remove(token, id)}
            />
          </Reveal>

          <Reveal delay={120}>
            <ResumeDataSection
              title="Projects"
              icon="code"
              emptyLabel="No projects yet — add your first project."
              fields={[
                { name: "title", label: "Title", placeholder: "e.g. MakeMyCV Resume Builder", required: true },
                { name: "github_link", label: "GitHub Link", placeholder: "e.g. https://github.com/you/repo" },
                { name: "description", label: "Description", kind: "textarea", placeholder: "What problem does it solve?" },
              ]}
              fetchList={(token: string) => projectsApi.list(token)}
              createItem={(token: string, payload: ProjectCreateInput) =>
                projectsApi.create(token, payload)
              }
              updateItem={(token: string, id: string, payload: Partial<ProjectCreateInput>) =>
                projectsApi.update(token, id, payload)
              }
              deleteItem={(token: string, id: string) => projectsApi.remove(token, id)}
            />
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
