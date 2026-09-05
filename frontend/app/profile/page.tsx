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
import ResumeDataSection from "../components/ResumeDataSection";
import { mapProfileToResume } from "../../utils/resumeMapper"; // B12 FIX: static import
import {
  apiRequest,
  clearSession,
  deleteAccount,
  getProfile,
  getStoredUser,
  getToken,
  storeUser,
  updateProfile,
  uploadProfilePhoto,
  educationApi,
  experienceApi,
  skillsApi,
  projectsApi,
  certificationsApi,
  achievementsApi,
  resumesApi,
  type CurrentUser,
  type Profile,
} from "../../lib/api";

const EDUCATION_FIELDS = [
  { name: "institution", label: "Institution", placeholder: "e.g. UC Berkeley", required: true },
  { name: "degree", label: "Degree", placeholder: "e.g. B.S. Computer Science", required: true },
  { name: "branch", label: "Branch", placeholder: "e.g. Computer Science", required: true },
  { name: "start_date", label: "Start Date", kind: "date" as const, required: true },
  { name: "end_date", label: "End Date", kind: "date" as const },
  { name: "cgpa", label: "CGPA (0-10)", kind: "number" as const, placeholder: "e.g. 9.5" }
] as const;

const EXPERIENCE_FIELDS = [
  { name: "company", label: "Company", placeholder: "e.g. Northwind Systems", required: true },
  { name: "designation", label: "Designation/Role", placeholder: "e.g. Full-Stack Engineer", required: true },
  { name: "description", label: "Description (Actions/Impact)", kind: "textarea" as const, placeholder: "Describe responsibilities..." },
  { name: "start_date", label: "Start Date", kind: "date" as const, required: true },
  { name: "end_date", label: "End Date", kind: "date" as const }
] as const;

const SKILL_FIELDS = [
  { name: "skill_name", label: "Skill Name", placeholder: "e.g. TypeScript", required: true },
  {
    name: "proficiency",
    label: "Proficiency",
    kind: "select" as const,
    options: [
      { value: "Beginner", label: "Beginner" },
      { value: "Intermediate", label: "Intermediate" },
      { value: "Expert", label: "Expert" }
    ],
    required: true
  }
] as const;

const PROJECT_FIELDS = [
  { name: "title", label: "Project Title", placeholder: "e.g. GitRater", required: true },
  { name: "description", label: "Description", kind: "textarea" as const, placeholder: "A brief project overview..." },
  { name: "github_link", label: "GitHub Link", placeholder: "github.com/you/repo" },
  { name: "github_link_text", label: "Link Text", placeholder: "e.g. View Source" }
] as const;

const CERTIFICATION_FIELDS = [
  { name: "name", label: "Certification Name", placeholder: "e.g. AWS Certified", required: true },
  { name: "organization", label: "Organization", placeholder: "e.g. Amazon Web Services" },
  { name: "issue_date", label: "Issue Date", kind: "date" as const },
  { name: "credential_id", label: "Credential ID", placeholder: "e.g. AWS-12345" },
  { name: "credential_url", label: "Credential URL", placeholder: "https://..." }
] as const;

const ACHIEVEMENT_FIELDS = [
  { name: "title", label: "Achievement Title", placeholder: "e.g. 1st Place Hackathon", required: true },
  { name: "organization", label: "Organization", placeholder: "e.g. Google Developer Group" },
  { name: "date", label: "Date Received", kind: "date" as const },
  { name: "description", label: "Description", kind: "textarea" as const, placeholder: "Detail your achievement..." }
] as const;

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
  const [phone, setPhone] = useState("");

  // ---- Social Links States ----
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubText, setGithubText] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioText, setPortfolioText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

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
        setPhone(prof.phone ?? "");

        setLinkedinUrl(prof.linkedin_url ?? "");
        setLinkedinText(prof.linkedin_text ?? "");
        setGithubUrl(prof.github_url ?? "");
        setGithubText(prof.github_text ?? "");
        setPortfolioUrl(prof.portfolio_url ?? "");
        setPortfolioText(prof.portfolio_text ?? "");

        // B4 FIX: Capture initial values so dirty can be computed
        setInitialProfile({
          fullName: me.full_name ?? "",
          dob: prof.dob ?? "",
          location: prof.location ?? "",
          headline: prof.headline ?? "",
          summary: prof.summary ?? "",
          phone: prof.phone ?? "",
          linkedinUrl: prof.linkedin_url ?? "",
          linkedinText: prof.linkedin_text ?? "",
          githubUrl: prof.github_url ?? "",
          githubText: prof.github_text ?? "",
          portfolioUrl: prof.portfolio_url ?? "",
          portfolioText: prof.portfolio_text ?? "",
        });
      })
      .catch(() => {
        /* token may be stale — Protected redirects on next visit */
      })
      .finally(() => setLoading(false));
  }, []);

  // B4 FIX: Track the initial loaded values to compute real dirty state
  const [initialProfile, setInitialProfile] = useState<{
    fullName: string; dob: string; location: string; headline: string;
    summary: string; phone: string;
    linkedinUrl: string; linkedinText: string;
    githubUrl: string; githubText: string;
    portfolioUrl: string; portfolioText: string;
  } | null>(null);

  // B4 FIX: Real dirty detection via useMemo
  const dirty = useMemo(() => {
    if (!initialProfile) return false;
    return (
      fullName !== initialProfile.fullName ||
      dob !== initialProfile.dob ||
      location !== initialProfile.location ||
      headline !== initialProfile.headline ||
      summary !== initialProfile.summary ||
      phone !== initialProfile.phone ||
      linkedinUrl !== initialProfile.linkedinUrl ||
      linkedinText !== initialProfile.linkedinText ||
      githubUrl !== initialProfile.githubUrl ||
      githubText !== initialProfile.githubText ||
      portfolioUrl !== initialProfile.portfolioUrl ||
      portfolioText !== initialProfile.portfolioText
    );
  }, [initialProfile, fullName, dob, location, headline, summary, phone,
      linkedinUrl, linkedinText, githubUrl, githubText, portfolioUrl, portfolioText]);

  const [resumes, setResumes] = useState<Array<{ id: string; title: string }>>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");

  // ---- Field level dynamic error states ----
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validateSingleField = (name: string, value: string): string => {
    if (name === "phone" && value) {
      const cleanPhone = value.replace(/\D/g, "");
      if (cleanPhone.length !== 10) return "Phone number must be exactly 10 digits.";
    }
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if ((name === "linkedinUrl" || name === "githubUrl" || name === "portfolioUrl") && value) {
      if (!urlRegex.test(value)) return "Please enter a valid URL.";
    }
    return "";
  };

  const handleBlurField = (name: string, value: string) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const err = validateSingleField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChangeField = (name: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touchedFields[name] || fieldErrors[name]) {
      const err = validateSingleField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const validateProfileForm = (): string | null => {
    const pErr = validateSingleField("phone", phone);
    const lErr = validateSingleField("linkedinUrl", linkedinUrl);
    const gErr = validateSingleField("githubUrl", githubUrl);
    const portErr = validateSingleField("portfolioUrl", portfolioUrl);
    if (pErr || lErr || gErr || portErr) {
      setFieldErrors({ phone: pErr, linkedinUrl: lErr, githubUrl: gErr, portfolioUrl: portErr });
      return pErr || lErr || gErr || portErr;
    }
    return null;
  };

  const saveProfile = useCallback(async () => {
    const error = validateProfileForm();
    if (error) {
      notify.error(error);
      return;
    }

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
        phone: phone || null,
        linkedin_url: linkedinUrl || null,
        linkedin_text: linkedinText || null,
        github_url: githubUrl || null,
        github_text: githubText || null,
        portfolio_url: portfolioUrl || null,
        portfolio_text: portfolioText || null,
      });

      notify.success("Profile saved successfully");
      // B4 FIX: Reset the baseline so dirty → false after saving
      setInitialProfile({
        fullName, dob, location, headline, summary, phone,
        linkedinUrl, linkedinText, githubUrl, githubText, portfolioUrl, portfolioText,
      });
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Failed to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }, [
    fullName,
    user,
    dob,
    location,
    headline,
    summary,
    phone,
    linkedinUrl,
    linkedinText,
    githubUrl,
    githubText,
    portfolioUrl,
    portfolioText,
    notify,
  ]);

  const handleExportToResume = async () => {
    const token = getToken();
    if (!token) {
      notify.error("Please log in to export your profile.");
      return;
    }

    setExporting(true);
    try {
      // Fetch user's existing resumes to display in the modal selection
      const list = await resumesApi.list(token);
      setResumes(list);
      setShowExportModal(true);
    } catch (err) {
      notify.error("Failed to load existing resumes list.");
    } finally {
      setExporting(false);
    }
  };

  const executeExport = async () => {
    const token = getToken();
    if (!token) return;

    setExporting(true);
    setShowExportModal(false);
    try {
      // Gather all loaded profile data from database endpoints
      const [profileData, eduList, expList, skillList, projectList, certList, achList] = await Promise.all([
        getProfile(token),
        educationApi.list(token),
        experienceApi.list(token),
        skillsApi.list(token),
        projectsApi.list(token),
        certificationsApi.list(token),
        achievementsApi.list(token),
      ]);

      // B12 FIX: Now using static import of mapProfileToResume
      const exportedResume = mapProfileToResume(user, {
        profile: profileData,
        education: eduList,
        experience: expList,
        skills: skillList,
        projects: projectList,
        certifications: certList,
        achievements: achList,
      });

      // Save to localStorage so Resume Builder can detect and load it
      localStorage.setItem("makemycv_resume_jake_exported", JSON.stringify(exportedResume));
      notify.success("Profile exported! Redirecting to Resume Builder...");
      
      // Delay navigation slightly so toast is visible
      setTimeout(() => {
        if (selectedResumeId === "new") {
          router.push("/resumes?import_source=profile_export");
        } else {
          router.push(`/resumes?import_source=profile_export&resume_id=${selectedResumeId}`);
        }
      }, 1000);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to export profile data");
    } finally {
      setExporting(false);
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportToResume}
            disabled={exporting || loading}
            className="btn-outline px-4 lg:px-5 py-2 rounded-full text-label-md flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <MaterialIcon name="sync" className="animate-spin text-[18px]" />
            ) : (
              <MaterialIcon name="send" className="text-[18px]" />
            )}
            {exporting ? "Exporting..." : "Export to Resume"}
          </button>
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
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-28 lg:pt-24 lg:ml-[var(--sidebar-width)] pb-16 px-4 lg:px-8 min-h-screen">
        <div className="max-w-[880px] mx-auto space-y-8">
          {/* Page Title */}
          <div>
            <h2 className="text-headline-md text-on-surface">Master Profile Settings</h2>
            <p className="text-body-md text-on-surface-variant">
              Your identity and the details our AI uses to tailor your resumes.
            </p>
          </div>

          {/* Identity Card — avatar + name + email */}
          <Reveal>
            <div className="ambient-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
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
              <h3 className="text-headline-md font-bold text-on-surface">
                Basic Details
              </h3>
              <span className="text-label-sm text-on-surface-variant">
                Core information for your resumes.
              </span>
            </div>
          </div>

          <Reveal delay={0}>
            <div className="ambient-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 space-y-6">
              <Field label="Full Name" hint="Your display name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jake Ryan"
                  className="input-field w-full"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Field label="Date of Birth" hint="Not included in resumes.">
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
                <Field label="Phone" hint="Contact number">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => handleChangeField("phone", e.target.value, setPhone)}
                    onBlur={(e) => handleBlurField("phone", e.target.value)}
                    placeholder="e.g. 5550192834"
                    className={`input-field w-full ${fieldErrors.phone ? "!border-error focus:!ring-error" : ""}`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-label-sm text-error mt-1">{fieldErrors.phone}</p>
                  )}
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

          {/* Social Links */}
          <div className="pt-4">
            <div className="flex items-center gap-3">
              <h3 className="text-headline-md font-bold text-on-surface">
                Social Links & Portfolio
              </h3>
              <span className="text-label-sm text-on-surface-variant">
                Your professional links for headers.
              </span>
            </div>
          </div>

          <Reveal delay={100}>
            <div className="ambient-card bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="LinkedIn URL" hint="Full profile link">
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => handleChangeField("linkedinUrl", e.target.value, setLinkedinUrl)}
                    onBlur={(e) => handleBlurField("linkedinUrl", e.target.value)}
                    placeholder="e.g. linkedin.com/in/username"
                    className={`input-field w-full ${fieldErrors.linkedinUrl ? "!border-error focus:!ring-error" : ""}`}
                  />
                  {fieldErrors.linkedinUrl && (
                    <p className="text-label-sm text-error mt-1">{fieldErrors.linkedinUrl}</p>
                  )}
                </Field>
                <Field label="LinkedIn Label Text" hint="Display text (optional)">
                  <input
                    type="text"
                    value={linkedinText}
                    onChange={(e) => setLinkedinText(e.target.value)}
                    placeholder="e.g. linkedin/username"
                    className="input-field w-full"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="GitHub URL" hint="Profile link">
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => handleChangeField("githubUrl", e.target.value, setGithubUrl)}
                    onBlur={(e) => handleBlurField("githubUrl", e.target.value)}
                    placeholder="e.g. github.com/username"
                    className={`input-field w-full ${fieldErrors.githubUrl ? "!border-error focus:!ring-error" : ""}`}
                  />
                  {fieldErrors.githubUrl && (
                    <p className="text-label-sm text-error mt-1">{fieldErrors.githubUrl}</p>
                  )}
                </Field>
                <Field label="GitHub Label Text" hint="Display text (optional)">
                  <input
                    type="text"
                    value={githubText}
                    onChange={(e) => setGithubText(e.target.value)}
                    placeholder="e.g. github/username"
                    className="input-field w-full"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Portfolio URL" hint="Personal website link">
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => handleChangeField("portfolioUrl", e.target.value, setPortfolioUrl)}
                    onBlur={(e) => handleBlurField("portfolioUrl", e.target.value)}
                    placeholder="e.g. username.dev"
                    className={`input-field w-full ${fieldErrors.portfolioUrl ? "!border-error focus:!ring-error" : ""}`}
                  />
                  {fieldErrors.portfolioUrl && (
                    <p className="text-label-sm text-error mt-1">{fieldErrors.portfolioUrl}</p>
                  )}
                </Field>
                <Field label="Portfolio Label Text" hint="Display text (optional)">
                  <input
                    type="text"
                    value={portfolioText}
                    onChange={(e) => setPortfolioText(e.target.value)}
                    placeholder="e.g. portfolio"
                    className="input-field w-full"
                  />
                </Field>
              </div>
            </div>
          </Reveal>

          {/* Subsections matching the 6 target categories */}
          <div className="pt-8 space-y-6">
            <h3 className="text-headline-md font-bold text-on-surface">Detailed Experience & Credentials</h3>
            
            <ResumeDataSection
              title="Education"
              icon="school"
              fields={EDUCATION_FIELDS}
              emptyLabel="No education details added yet."
              fetchList={educationApi.list}
              createItem={educationApi.create}
              updateItem={educationApi.update}
              deleteItem={educationApi.remove}
            />

            <ResumeDataSection
              title="Experience & Positions"
              icon="work"
              fields={EXPERIENCE_FIELDS}
              emptyLabel="No experience or leadership roles added yet."
              fetchList={experienceApi.list}
              createItem={experienceApi.create}
              updateItem={experienceApi.update}
              deleteItem={experienceApi.remove}
            />

            <ResumeDataSection
              title="Internships & Projects"
              icon="code"
              fields={PROJECT_FIELDS}
              emptyLabel="No projects or internships added yet."
              fetchList={projectsApi.list}
              createItem={projectsApi.create}
              updateItem={projectsApi.update}
              deleteItem={projectsApi.remove}
            />

            <ResumeDataSection
              title="Skills & Interests"
              icon="bolt"
              fields={SKILL_FIELDS}
              emptyLabel="No skills added yet."
              fetchList={skillsApi.list}
              createItem={skillsApi.create}
              updateItem={skillsApi.update}
              deleteItem={skillsApi.remove}
            />

            <ResumeDataSection
              title="Certifications"
              icon="badge"
              fields={CERTIFICATION_FIELDS}
              emptyLabel="No certifications added yet."
              fetchList={certificationsApi.list}
              createItem={certificationsApi.create}
              updateItem={certificationsApi.update}
              deleteItem={certificationsApi.remove}
            />

            <ResumeDataSection
              title="Awards & Recognitions"
              icon="workspace_premium"
              fields={ACHIEVEMENT_FIELDS}
              emptyLabel="No awards or achievements added yet."
              fetchList={achievementsApi.list}
              createItem={achievementsApi.create}
              updateItem={achievementsApi.update}
              deleteItem={achievementsApi.remove}
            />
          </div>

          {/* Danger Zone */}
          <div className="pt-12">
            <div className="ambient-card bg-error-container/10 border-2 border-error/20 rounded-2xl p-6 sm:p-8 space-y-4">
              <h3 className="text-headline-sm font-bold text-error">Danger Zone</h3>
              <p className="text-body-md text-on-surface-variant">
                Permanently delete your account and all associated resumes. This action cannot be undone.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="btn-outline px-6 py-2.5 rounded-full text-label-md text-error border-error hover:bg-error-container/30 transition-colors flex items-center gap-2"
                >
                  <MaterialIcon name="delete_forever" className="text-[18px]" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
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

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full border border-outline-variant space-y-6">
            <div>
              <h3 className="text-headline-md font-bold text-on-surface">Export to Resume</h3>
              <p className="text-body-md text-on-surface-variant">Which resume would you like to update?</p>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low cursor-pointer">
                <input
                  type="radio"
                  name="resumeSelect"
                  value="new"
                  checked={selectedResumeId === "new" || selectedResumeId === ""}
                  onChange={() => setSelectedResumeId("new")}
                  className="accent-primary"
                />
                <span className="text-label-md font-medium">Create New Resume</span>
              </label>

              {resumes.map((res) => (
                <label key={res.id} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low cursor-pointer">
                  <input
                    type="radio"
                    name="resumeSelect"
                    value={res.id}
                    checked={selectedResumeId === res.id}
                    onChange={() => setSelectedResumeId(res.id)}
                    className="accent-primary"
                  />
                  <span className="text-label-md font-medium">{res.title}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="btn-outline px-4 py-2 rounded-full text-label-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeExport}
                className="btn-primary px-5 py-2 rounded-full text-label-md"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
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

