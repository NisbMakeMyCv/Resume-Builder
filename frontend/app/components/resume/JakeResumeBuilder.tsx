"use client";

import { useEffect, useMemo, useState } from "react";
import MaterialIcon from "../MaterialIcon";
import JakeResumePreview from "./JakeResumePreview";
import {
  emptyResume,
  loadResume,
  saveResume,
  uid,
  type Education,
  type Experience,
  type Project,
  type ResumeData,
  type SkillGroup,
  type CustomSection,
  type CustomSectionField,
  type CustomSectionFieldType,
} from "../../../lib/resume";
import {
  getProfile,
  getStoredUser,
  getToken,
  improveGitHubBullets,
  resumesApi,
  educationApi,
  experienceApi,
  skillsApi,
  projectsApi,
  certificationsApi,
  achievementsApi,
} from "../../../lib/api"; // B3 FIX: All static imports, no more require()
import { mapProfileToResume } from "../../../utils/resumeMapper"; // B3 FIX
import { encryptData } from "../../../lib/crypto";
import { useCrypto } from "../../providers/CryptoProvider";
import PassphraseModal from "../PassphraseModal";
import GitHubAnalyzer from "../ai/GitHubAnalyzer";
import { ToastStack, useToasts } from "../Toast";

/**
 * Jake's Resume Builder — the resume editor for the `editor` stitch frame.
 *
 * Left: the four form sections + header, laid out strictly per Jake's
 * Resume Template. Right: a live preview that re-renders on every keystroke.
 *
 * "AI Enhance" next to each experience/project bullet group sends the text
 * to POST /api/v1/ai/github/improve-bullets (requires the token; a static
 * "sign in to use AI" fallback is shown otherwise). The document persists
 * to localStorage — no resume endpoints exist on the backend yet.
 */
export default function JakeResumeBuilder({ initialDataStr, onClose }: { initialDataStr?: string | null, onClose?: () => void }) {
  const { passphrase, isUnlocked } = useCrypto();
  
  const [data, setData] = useState<ResumeData>(() => {
    if (initialDataStr) {
      try {
        return JSON.parse(initialDataStr) as ResumeData;
      } catch (err) {
        console.error("Failed to parse initial resume data", err);
      }
    }
    return loadResume();
  });
  const [saving, setSaving] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["Header"]));
  const [showGitHubAnalyzer, setShowGitHubAnalyzer] = useState(false);
  /** U7: Mobile tab switcher state — "editor" | "preview" */
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const { toasts, dismiss, notify } = useToasts();

  // Only save draft changes to localStorage upon Recompile
  const saveDraftLocally = (nextDraft: ResumeData) => {
    saveResume(nextDraft);
  };

  // ---- Field level dynamic error states for builder header ----
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validateSingleField = (name: string, value: string): string => {
    if (name === "phone" && value) {
      const cleanPhone = value.replace(/\D/g, "");
      if (cleanPhone.length !== 10) return "Phone number must be exactly 10 digits.";
    }
    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Please enter a valid email address.";
    }
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if ((name === "linkedin" || name === "github" || name === "portfolio") && value) {
      if (!urlRegex.test(value)) return "Please enter a valid URL.";
    }
    return "";
  };

  const handleBlurField = (name: string, value: string) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const err = validateSingleField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChangeField = (name: string, value: string, updateFn: () => void) => {
    updateFn();
    if (touchedFields[name] || fieldErrors[name]) {
      const err = validateSingleField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  // Validations helper
  const validateForm = (d: ResumeData): string | null => {
    const pErr = validateSingleField("phone", d.header.phone);
    const eErr = validateSingleField("email", d.header.email);
    const lErr = validateSingleField("linkedin", d.header.links.linkedin);
    const gErr = validateSingleField("github", d.header.links.github);
    const portErr = validateSingleField("portfolio", d.header.links.portfolio);

    if (pErr || eErr || lErr || gErr || portErr) {
      setFieldErrors({ phone: pErr, email: eErr, linkedin: lErr, github: gErr, portfolio: portErr });
      return pErr || eErr || lErr || gErr || portErr;
    }
    return null;
  };

  const handleCloudSave = async () => {
    // B15 FIX: Validate before saving to cloud
    const validationError = validateForm(data);
    if (validationError) {
      notify.error(validationError);
      return;
    }
    const token = getToken();
    if (!token) {
      notify.error("Please log in to save your resume to the cloud.");
      return;
    }
    if (!passphrase) {
      notify.error("Encryption passphrase is required to save.");
      return;
    }
    
    setSaving(true);
    try {
      const title = data.header.fullName ? `${data.header.fullName}'s Resume` : "My Resume";
      const jsonString = JSON.stringify(data);
      const encryptedBlob = await encryptData(jsonString, passphrase);

      if (resumeId) {
        await resumesApi.update(token, resumeId, title, encryptedBlob);
        notify.success("Resume updated in cloud!");
      } else {
        const created = await resumesApi.create(token, title, encryptedBlob);
        setResumeId(created.id);
        notify.success("Resume saved to cloud!");
      }
    } catch (err) {
      notify.error("Failed to save resume: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    // If not signed in, just close
    const token = getToken();
    if (token && passphrase) {
      await handleCloudSave();
    }
    if (onClose) onClose();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleImportFromProfile = async () => {
    const token = getToken();
    if (!token) {
      notify.error("Please log in to import your profile.");
      return;
    }
    
    try {
      // B3 FIX: Static imports replace require() calls
      const [profileData, eduList, expList, skillList, projectList, certList, achList] = await Promise.all([
        getProfile(token),
        educationApi.list(token),
        experienceApi.list(token),
        skillsApi.list(token),
        projectsApi.list(token),
        certificationsApi.list(token),
        achievementsApi.list(token),
      ]);

      const storedUser = getStoredUser();
      // B3 FIX: Static import of mapProfileToResume instead of require()
      const importedData = mapProfileToResume(storedUser, {
        profile: profileData,
        education: eduList,
        experience: expList,
        skills: skillList,
        projects: projectList,
        certifications: certList,
        achievements: achList,
      });

      setData(importedData);
      notify.success("Successfully imported your latest profile data!");
    } catch (err) {
      notify.error("Failed to import profile data: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const updateHeader = (patch: Partial<ResumeData["header"]>) =>
    setData((d) => ({ ...d, header: { ...d.header, ...patch } }));

  /* ---- Array starters/removers (shared by all sections) ---- */

  function addEducation() {
    setData((d) => ({
      ...d,
      education: [
        ...d.education,
        { id: uid(), school: "", degree: "", location: "", dates: "", coursework: "" },
      ],
    }));
  }
  function addExperience() {
    setData((d) => ({
      ...d,
      experience: [
        ...d.experience,
        { id: uid(), company: "", title: "", location: "", dates: "", bullets: [""] },
      ],
    }));
  }
  function addProject() {
    setData((d) => ({
      ...d,
      projects: [
        ...d.projects,
        { id: uid(), title: "", technologies: "", dates: "", links: "", bullets: [""] },
      ],
    }));
  }
  function addSkillGroup() {
    setData((d) => ({
      ...d,
      skills: [...d.skills, { id: uid(), category: "", items: "" }],
    }));
  }

  function addCustomSection() {
    setData((d) => ({
      ...d,
      customSections: [
        ...(d.customSections || []),
        { id: uid(), title: "Custom Section", fields: [] },
      ],
    }));
  }

  function addCustomField(sectionId: string, type: CustomSectionFieldType) {
    setData((d) => ({
      ...d,
      customSections: (d.customSections || []).map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                { id: uid(), type, label: "", value: "", href: "" },
              ],
            }
          : s
      ),
    }));
  }

  function removeCustomField(sectionId: string, fieldId: string) {
    setData((d) => ({
      ...d,
      customSections: (d.customSections || []).map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s
      ),
    }));
  }

  function updateCustomField(
    sectionId: string,
    fieldId: string,
    patch: Partial<CustomSectionField>
  ) {
    setData((d) => ({
      ...d,
      customSections: (d.customSections || []).map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, ...patch } : f
              ),
            }
          : s
      ),
    }));
  }

  const removeItem = <T extends { id: string }>(
    key: "education" | "experience" | "projects" | "skills" | "customSections",
    id: string
  ) =>
    setData((d) => ({
      ...d,
      [key]: (d[key] as unknown as T[]).filter((i) => i.id !== id),
    }));

  const updateItem = <T extends { id: string }>(
    key: "education" | "experience" | "projects" | "skills" | "customSections",
    id: string,
    patch: Partial<T>
  ) =>
    setData((d) => ({
      ...d,
      [key]: (d[key] as unknown as T[]).map((i) =>
        i.id === id ? { ...i, ...patch } : i
      ),
    }));

  const setBullet = <T extends { id: string; bullets: string[] }>(
    key: "experience" | "projects",
    id: string,
    index: number,
    value: string
  ) =>
    setData((d) => ({
      ...d,
      [key]: (d[key] as unknown as T[]).map((i) =>
        i.id === id
          ? {
              ...i,
              bullets: i.bullets.map((b, k) => (k === index ? value : b)),
            }
          : i
      ),
    }));

  const addBullet = (key: "experience" | "projects", id: string) =>
    setData((d) => ({
      ...d,
      [key]: (d[key] as unknown as Array<{ id: string; bullets: string[] }>).map(
        (i) => (i.id === id ? { ...i, bullets: [...i.bullets, ""] } : i)
      ),
    }));

  const removeBullet = (key: "experience" | "projects", id: string, index: number) =>
    setData((d) => ({
      ...d,
      [key]: (d[key] as unknown as Array<{ id: string; bullets: string[] }>).map(
        (i) =>
          i.id === id
            ? { ...i, bullets: i.bullets.filter((_, k) => k !== index) }
            : i
      ),
    }));

  const handleToggleSection = (sec: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec);
      else next.add(sec);
      return next;
    });
  };

  const confirmReset = () => {
    if (confirm("Are you sure you want to reset your entire resume? This will clear all data and cannot be undone.")) {
      setData(emptyResume());
    }
  };

  // U23 FIX: Keyboard shortcut Ctrl+S / Cmd+S for cloud save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleCloudSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloudSave]);

  // U4 FIX: Calculate completion score
  const completionScore = useMemo(() => {
    let score = 0;
    if (data.header.fullName?.trim()) score += 20;
    if (data.header.email?.trim()) score += 20;
    if (data.education.some((e) => e.school?.trim())) score += 20;
    if (data.experience.some((e) => e.company?.trim())) score += 20;
    if (data.skills.some((s) => s.category?.trim() || s.items?.trim())) score += 20;
    return score;
  }, [data]);

  return (
    <>
      <PassphraseModal />
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* U1/U10 FIX: Sticky editor header — back link is now subtle; Save + Export are the primary CTAs */}
      <div className="h-16 border-b border-outline-variant bg-surface-container-lowest shadow-sm sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 xl:px-16 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAndClose}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-label-sm font-medium"
          >
            <MaterialIcon name="arrow_back" className="text-[18px]" />
            <span className="hidden sm:inline">Back to Vault</span>
          </button>
          <div className="hidden sm:block font-bold text-on-surface tracking-tight border-l border-outline-variant pl-3">MakeMyCV Builder</div>
          
          {/* U4 FIX: Completion progress bar in header */}
          <div className="hidden xl:flex items-center gap-2 border-l border-outline-variant pl-3">
            <div className="w-20 bg-surface-container-high rounded-full h-2 overflow-hidden border border-outline-variant/30">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-on-surface-variant">{completionScore}%</span>
          </div>
        </div>
        
        {/* U7 FIX: Mobile tab switcher */}
        <div className="flex lg:hidden items-center bg-surface-container rounded-full p-1 border border-outline-variant">
          <button
            onClick={() => setMobileTab("editor")}
            className={`px-3 py-1.5 rounded-full text-label-sm font-semibold transition-all ${
              mobileTab === "editor"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <MaterialIcon name="edit_note" className="text-[16px]" />
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`px-3 py-1.5 rounded-full text-label-sm font-semibold transition-all ${
              mobileTab === "preview"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <MaterialIcon name="preview" className="text-[16px]" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImportFromProfile}
            className="hidden sm:flex btn-outline px-3 py-1.5 rounded-full text-label-sm items-center gap-1.5 border-primary text-primary hover:bg-primary/5"
            title="Import data from your master profile"
          >
            <MaterialIcon name="download_for_offline" className="text-[18px]" />
            <span className="hidden md:inline">Import Profile</span>
          </button>
          {/* U1 FIX: Save to Cloud + Export PDF in the sticky header */}
          <button
            onClick={handleCloudSave}
            disabled={saving}
            className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
          >
            <MaterialIcon name="cloud_upload" className="text-[18px]" />
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="btn-primary px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
          >
            <MaterialIcon name="picture_as_pdf" className="text-[18px]" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* U7 FIX: grid hidden behind mobile tab switcher */}
      <div className="p-4 sm:p-8 xl:px-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
        {/* ============ LEFT: EDITOR & TOOLS PANEL ============ */}
        <div className={`space-y-6 no-print animate-in fade-in duration-300 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          {/* Header */}
          <Section
            icon="badge"
            title="Header"
            subtitle="Your name, contact details, and profile links."
            isOpen={openSections.has("Header")}
            onToggle={() => handleToggleSection("Header")}
          >
            <Field label="Full Name">
              <TextInput
                value={data.header.fullName}
                onChange={(v) => updateHeader({ fullName: v })}
                placeholder="Alex Morgan"
              />
            </Field>
            <Field label="Job Title / Position">
              <TextInput
                value={data.header.position}
                onChange={(v) => updateHeader({ position: v })}
                placeholder="Full-Stack Engineer"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone">
                <TextInput
                  value={data.header.phone}
                  onChange={(v) => handleChangeField("phone", v, () => updateHeader({ phone: v }))}
                  onBlur={(v) => handleBlurField("phone", v)}
                  error={fieldErrors.phone}
                  placeholder="(555) 867-5309"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  value={data.header.email}
                  onChange={(v) => handleChangeField("email", v, () => updateHeader({ email: v }))}
                  onBlur={(v) => handleBlurField("email", v)}
                  error={fieldErrors.email}
                  placeholder="alex@email.com"
                />
              </Field>
            </div>
            <Field label="Location">
              <TextInput
                value={data.header.location}
                onChange={(v) => updateHeader({ location: v })}
                placeholder="San Francisco, CA"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="LinkedIn URL">
                <TextInput
                  value={data.header.links.linkedin}
                  onChange={(v) =>
                    handleChangeField("linkedin", v, () =>
                      updateHeader({ links: { ...data.header.links, linkedin: v } })
                    )
                  }
                  onBlur={(v) => handleBlurField("linkedin", v)}
                  error={fieldErrors.linkedin}
                  placeholder="linkedin.com/in/you"
                />
              </Field>
              <Field label="LinkedIn Text">
                <TextInput
                  value={data.header.links.linkedinText}
                  onChange={(v) =>
                    updateHeader({ links: { ...data.header.links, linkedinText: v } })
                  }
                  placeholder="e.g. linkedin/you"
                />
              </Field>
              <Field label="GitHub URL">
                <TextInput
                  value={data.header.links.github}
                  onChange={(v) =>
                    handleChangeField("github", v, () =>
                      updateHeader({ links: { ...data.header.links, github: v } })
                    )
                  }
                  onBlur={(v) => handleBlurField("github", v)}
                  error={fieldErrors.github}
                  placeholder="github.com/you"
                />
                <p className="text-label-sm text-on-surface-variant mt-1.5 leading-snug">
                  Tip: Use the AI GitHub Analyzer in the Projects section below to automatically extract your repo details.
                </p>
              </Field>
              <Field label="GitHub Text">
                <TextInput
                  value={data.header.links.githubText}
                  onChange={(v) =>
                    updateHeader({ links: { ...data.header.links, githubText: v } })
                  }
                  placeholder="e.g. github/you"
                />
              </Field>
              <Field label="Portfolio URL">
                <TextInput
                  value={data.header.links.portfolio}
                  onChange={(v) =>
                    handleChangeField("portfolio", v, () =>
                      updateHeader({ links: { ...data.header.links, portfolio: v } })
                    )
                  }
                  onBlur={(v) => handleBlurField("portfolio", v)}
                  error={fieldErrors.portfolio}
                  placeholder="yourdomain.dev"
                />
              </Field>
              <Field label="Portfolio Text">
                <TextInput
                  value={data.header.links.portfolioText}
                  onChange={(v) =>
                    updateHeader({ links: { ...data.header.links, portfolioText: v } })
                  }
                  placeholder="e.g. Portfolio"
                />
              </Field>
            </div>
          </Section>

          {/* Education */}
          <Section
            icon="school"
            title="Education"
            subtitle="Institutions, degrees, dates, and relevant coursework."
            action={
              <AddButton onClick={addEducation} label="Add Education" />
            }
            isOpen={openSections.has("Education")}
            onToggle={() => handleToggleSection("Education")}
          >
            {data.education.length === 0 && <EmptyRow onAdd={addEducation} />}
            {data.education.map((ed) => (
              <EditableCard
                key={ed.id}
                title={ed.school || "Education Entry"}
                onRemove={() => removeItem<Education>("education", ed.id)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Institution">
                    <TextInput
                      value={ed.school}
                      onChange={(v) => updateItem<Education>("education", ed.id, { school: v })}
                      placeholder="University of California"
                    />
                  </Field>
                  <Field label="Degree">
                    <TextInput
                      value={ed.degree}
                      onChange={(v) => updateItem<Education>("education", ed.id, { degree: v })}
                      placeholder="B.S. Computer Science"
                    />
                  </Field>
                  <Field label="Dates">
                    <DateRangeInput
                      value={ed.dates}
                      onChange={(v) => updateItem<Education>("education", ed.id, { dates: v })}
                    />
                  </Field>
                  <Field label="Location">
                    <TextInput
                      value={ed.location}
                      onChange={(v) => updateItem<Education>("education", ed.id, { location: v })}
                      placeholder="Berkeley, CA"
                    />
                  </Field>
                </div>
                <Field label="Coursework">
                  <TextInput
                    value={ed.coursework}
                    onChange={(v) => updateItem<Education>("education", ed.id, { coursework: v })}
                    placeholder="Data Structures, Algorithms, …"
                  />
                </Field>
              </EditableCard>
            ))}
          </Section>

          {/* Experience */}
          <Section
            icon="work"
            title="Experience"
            subtitle="Roles with strong action-verb bullet points."
            action={<AddButton onClick={addExperience} label="Add Experience" />}
            isOpen={openSections.has("Experience")}
            onToggle={() => handleToggleSection("Experience")}
          >
            {data.experience.length === 0 && <EmptyRow onAdd={addExperience} />}
            {data.experience.map((ex) => (
              <EditableCard
                key={ex.id}
                title={ex.company || "Experience Entry"}
                onRemove={() => removeItem<Experience>("experience", ex.id)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company">
                    <TextInput
                      value={ex.company}
                      onChange={(v) => updateItem<Experience>("experience", ex.id, { company: v })}
                      placeholder="Northwind Systems"
                    />
                  </Field>
                  <Field label="Job Title">
                    <TextInput
                      value={ex.title}
                      onChange={(v) => updateItem<Experience>("experience", ex.id, { title: v })}
                      placeholder="Full-Stack Engineer"
                    />
                  </Field>
                  <Field label="Dates">
                    <DateRangeInput
                      value={ex.dates}
                      onChange={(v) => updateItem<Experience>("experience", ex.id, { dates: v })}
                    />
                  </Field>
                  <Field label="Location">
                    <TextInput
                      value={ex.location}
                      onChange={(v) => updateItem<Experience>("experience", ex.id, { location: v })}
                      placeholder="San Francisco, CA"
                    />
                  </Field>
                </div>
                <BulletList
                  label="Action Bullet Points"
                  bullets={ex.bullets}
                  onChange={(idx, v) => setBullet<Experience>("experience", ex.id, idx, v)}
                  onAdd={() => addBullet("experience", ex.id)}
                  onRemove={(idx) => removeBullet("experience", ex.id, idx)}
                  value={{
                    project_name: ex.company || ex.title || "Work Experience",
                    description: `${ex.title || "Role"} at ${ex.company || "Company"}`,
                    technologies: [],
                  }}
                />
              </EditableCard>
            ))}
          </Section>

          {/* Projects */}
          <Section
            icon="code"
            title="Projects"
            subtitle="Personal or professional work worth highlighting."
            action={<AddButton onClick={addProject} label="Add Project" />}
            isOpen={openSections.has("Projects")}
            onToggle={() => handleToggleSection("Projects")}
          >
            <div className="mb-6">
              {!showGitHubAnalyzer ? (
                <button
                  type="button"
                  onClick={() => setShowGitHubAnalyzer(true)}
                  className="btn-outline w-full py-4 rounded-xl border-dashed flex items-center justify-center gap-2 text-primary hover:bg-primary-fixed/40 transition-colors"
                >
                  <MaterialIcon name="smart_toy" className="text-[20px]" />
                  <span className="font-semibold text-label-md">✨ Analyze GitHub Repo with AI</span>
                </button>
              ) : (
                <div className="relative border border-primary/20 rounded-2xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowGitHubAnalyzer(false)}
                    className="absolute top-4 right-4 z-10 text-on-surface-variant hover:text-error bg-surface-container-lowest hover:bg-error-container/20 rounded-full p-1.5 transition-colors"
                    title="Close Analyzer"
                  >
                    <MaterialIcon name="close" className="text-[20px]" />
                  </button>
                  <GitHubAnalyzer 
                    onAddProject={(projectData: any) => {
                      setData((prev) => ({
                        ...prev,
                        projects: [
                          ...prev.projects,
                          { id: uid(), ...projectData, dates: "" }
                        ]
                      }));
                      setShowGitHubAnalyzer(false);
                      notify.success("Project added from GitHub!");
                    }} 
                  />
                </div>
              )}
            </div>
            {data.projects.length === 0 && <EmptyRow onAdd={addProject} />}
            {data.projects.map((proj) => (
              <EditableCard
                key={proj.id}
                title={proj.title || "Project Entry"}
                onRemove={() => removeItem<Project>("projects", proj.id)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Project Title">
                    <TextInput
                      value={proj.title}
                      onChange={(v) => updateItem<Project>("projects", proj.id, { title: v })}
                      placeholder="GitRater"
                    />
                  </Field>
                  <Field label="Technologies">
                    <TextInput
                      value={proj.technologies}
                      onChange={(v) => updateItem<Project>("projects", proj.id, { technologies: v })}
                      placeholder="React, TypeScript, FastAPI"
                    />
                  </Field>
                  <Field label="Dates">
                    <DateRangeInput
                      value={proj.dates}
                      onChange={(v) => updateItem<Project>("projects", proj.id, { dates: v })}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Links">
                      <TextInput
                        value={proj.links}
                        onChange={(v) => updateItem<Project>("projects", proj.id, { links: v })}
                        placeholder="github.com/you/project"
                      />
                    </Field>
                    <Field label="Link Text">
                      <TextInput
                        value={proj.linkText || ""}
                        onChange={(v) => updateItem<Project>("projects", proj.id, { linkText: v })}
                        placeholder="e.g. view repo"
                      />
                    </Field>
                  </div>
                </div>
                <BulletList
                  label="Bullet Points"
                  bullets={proj.bullets}
                  onChange={(idx, v) => setBullet<Project>("projects", proj.id, idx, v)}
                  onAdd={() => addBullet("projects", proj.id)}
                  onRemove={(idx) => removeBullet("projects", proj.id, idx)}
                  value={{
                    project_name: proj.title || "Project",
                    description: "A personal or professional project.",
                    technologies: (proj.technologies || "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }}
                />
              </EditableCard>
            ))}
          </Section>

          {/* Technical Skills */}
          <Section
            icon="bolt"
            title="Technical Skills"
            subtitle="Languages, frameworks, developer tools, and libraries."
            action={<AddButton onClick={addSkillGroup} label="Add Skill Group" />}
            isOpen={openSections.has("Skills")}
            onToggle={() => handleToggleSection("Skills")}
          >
            {data.skills.length === 0 && <EmptyRow onAdd={addSkillGroup} />}
            {data.skills.map((s) => (
              <EditableCard
                key={s.id}
                title={s.category || "Skill Group"}
                onRemove={() => removeItem<SkillGroup>("skills", s.id)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Category">
                    <TextInput
                      value={s.category}
                      onChange={(v) => updateItem<SkillGroup>("skills", s.id, { category: v })}
                      placeholder="Languages"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Skills">
                      <TextInput
                        value={s.items}
                        onChange={(v) => updateItem<SkillGroup>("skills", s.id, { items: v })}
                        placeholder="TypeScript, Python, SQL"
                      />
                    </Field>
                  </div>
                </div>
              </EditableCard>
            ))}
          </Section>

          {/* Custom Sections */}
          <Section
            icon="add_circle"
            title="Custom Sections"
            subtitle="Add any other details (Certifications, Awards, Languages)."
            action={<AddButton onClick={addCustomSection} label="Add Section" />}
            isOpen={openSections.has("Custom")}
            onToggle={() => handleToggleSection("Custom")}
          >
            {(!data.customSections || data.customSections.length === 0) && (
              <EmptyRow onAdd={addCustomSection} />
            )}
            {(data.customSections || []).map((s) => (
              <EditableCard
                key={s.id}
                title={s.title || "Custom Section"}
                onRemove={() => removeItem<CustomSection>("customSections", s.id)}
              >
                <div className="space-y-4">
                  <Field label="Section Title">
                    <TextInput
                      value={s.title}
                      onChange={(v) =>
                        updateItem<CustomSection>("customSections", s.id, { title: v })
                      }
                      placeholder="E.g., Certifications"
                    />
                  </Field>
                  
                  {s.fields.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {s.fields.map((f) => (
                        <div key={f.id} className="relative bg-surface-container-low border border-outline-variant rounded-xl p-4">
                          <button
                            onClick={() => removeCustomField(s.id, f.id)}
                            className="absolute top-3 right-3 text-on-surface-variant hover:text-error"
                            title="Remove Field"
                          >
                            <MaterialIcon name="close" className="text-[18px]" />
                          </button>
                          
                          <div className="pr-6 space-y-3">
                            <div className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                              {f.type} Field
                            </div>
                            
                            <Field label="Label">
                              <TextInput
                                value={f.label}
                                onChange={(v) => updateCustomField(s.id, f.id, { label: v })}
                                placeholder="E.g., AWS Certified"
                              />
                            </Field>
                            
                            {f.type === "text" && (
                              <Field label="Value">
                                <TextInput
                                  value={f.value}
                                  onChange={(v) => updateCustomField(s.id, f.id, { value: v })}
                                  placeholder="E.g., Solutions Architect"
                                />
                              </Field>
                            )}
                            
                            {f.type === "textarea" && (
                              <Field label="Value">
                                <TextAreaInput
                                  value={f.value}
                                  onChange={(v) => updateCustomField(s.id, f.id, { value: v })}
                                  placeholder="E.g., Description of the award..."
                                  rows={3}
                                />
                              </Field>
                            )}
                            
                            {f.type === "link" && (
                              <>
                                <Field label="Display Text">
                                  <TextInput
                                    value={f.value}
                                    onChange={(v) => updateCustomField(s.id, f.id, { value: v })}
                                    placeholder="E.g., view credential"
                                  />
                                </Field>
                                <Field label="URL">
                                  <TextInput
                                    value={f.href || ""}
                                    onChange={(v) => updateCustomField(s.id, f.id, { href: v })}
                                    placeholder="https://..."
                                  />
                                </Field>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => addCustomField(s.id, "text")}
                      className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
                    >
                      <MaterialIcon name="short_text" className="text-[16px]" />
                      Add Text
                    </button>
                    <button
                      onClick={() => addCustomField(s.id, "textarea")}
                      className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
                    >
                      <MaterialIcon name="notes" className="text-[16px]" />
                      Add Paragraph
                    </button>
                    <button
                      onClick={() => addCustomField(s.id, "link")}
                      className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
                    >
                      <MaterialIcon name="link" className="text-[16px]" />
                      Add Link
                    </button>
                  </div>
                </div>
              </EditableCard>
            ))}
          </Section>

              {/* Reset is now moved to the top header area of ResumesPage or top toolbar, 
                  but we'll keep a Danger Zone styled version here at the bottom of the editor for now */}
          {/* U3 FIX: Reset button clearly separated as danger zone */}
              <div className="flex justify-start pt-6 mt-8 border-t-2 border-dashed border-error/20">
                <div className="flex flex-col gap-2">
                  <p className="text-label-sm text-on-surface-variant font-semibold">⚠ Danger Zone</p>
                  <button
                    type="button"
                    onClick={confirmReset}
                    className="btn-outline px-4 py-2.5 rounded-full text-label-md flex items-center gap-2 text-error border-error hover:bg-error-container/20"
                  >
                    <MaterialIcon name="delete_forever" className="text-[18px]" />
                    Reset Entire Resume
                  </button>
                </div>
              </div>
        </div>

        {/* ============ RIGHT: LIVE PREVIEW ============ */}
        <div className={`lg:sticky lg:top-6 lg:h-max pb-8 print:!static print:!w-full print:!h-auto print:!pb-0 ${mobileTab === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <div className="mb-3 flex flex-wrap gap-3 items-center justify-between no-print">
            <div>
              <p className="text-label-md font-semibold text-on-surface">
                Live Preview
              </p>
              <span className="text-label-sm text-on-surface-variant">
                Jake&apos;s Resume Template
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCloudSave}
                disabled={saving}
                className="btn-outline px-4 py-2 rounded-full text-label-sm flex items-center gap-1.5"
              >
                <MaterialIcon name="cloud_upload" className="text-[18px]" />
                {saving ? "Saving..." : "Save to Cloud"}
              </button>
              <button
                onClick={handleExportPDF}
                className="btn-primary px-4 py-2 rounded-full text-label-sm flex items-center gap-1.5"
              >
                <MaterialIcon name="picture_as_pdf" className="text-[18px]" />
                Export PDF
              </button>
            </div>
          </div>
          <div className="relative">
            <JakeResumePreview data={data} />
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SMALL BUILDING BLOCKS
   ========================================================= */

function Section({
  icon,
  title,
  subtitle,
  action,
  children,
  isOpen = true,
  onToggle,
}: {
  icon: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section className="bg-white rounded-2xl border border-outline-variant overflow-hidden transition-all duration-200">
      <div 
        className={`p-5 flex flex-wrap items-center gap-3 ${isOpen ? 'border-b border-outline-variant' : ''} ${onToggle ? 'cursor-pointer hover:bg-surface-container-lowest transition-colors' : ''}`}
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
          <MaterialIcon name={icon} className="text-primary text-[20px]" filled />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-headline-md text-on-surface">{title}</h3>
          <p className="text-label-sm text-on-surface-variant truncate">{subtitle}</p>
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
        {onToggle && (
          <div className="ml-2 shrink-0">
            <MaterialIcon name={isOpen ? "expand_less" : "expand_more"} className="text-on-surface-variant text-[24px]" />
          </div>
        )}
      </div>
      {isOpen && (
        <div className="p-5 space-y-5 animate-in slide-in-from-top-2 fade-in duration-300">
          {children}
        </div>
      )}
    </section>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
    >
      <MaterialIcon name="add" className="text-[16px]" />
      {label}
    </button>
  );
}

function EmptyRow({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full border border-dashed border-outline-variant rounded-xl py-6 text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
    >
      <MaterialIcon name="add" className="text-[18px]" />
      Add your first entry
    </button>
  );
}

function EditableCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-outline-variant rounded-xl p-4 space-y-4 relative">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label-md font-semibold text-on-surface truncate" title={title}>
          {title}
        </p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          className="text-on-surface-variant hover:text-error transition-colors shrink-0"
        >
          <MaterialIcon name="delete" className="text-[18px]" />
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-label-sm font-semibold text-on-surface block">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
}: {
  value?: string;
  onChange: (v: string) => void;
  onBlur?: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <input
        type={type}
        className={`w-full px-3.5 py-2.5 rounded-lg border bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all ${
          error ? "border-error focus:ring-error" : "border-outline-variant"
        }`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur && onBlur(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="text-label-sm text-error mt-1">{error}</p>}
    </div>
  );
}

function DateRangeInput({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  // Parse the current value if it looks like "Start - End"
  const parts = (value || "").split("–").map(s => s.trim());
  let initStart = parts[0] || "";
  let initEnd = parts.length > 1 ? parts[1] : "";
  if (!value?.includes("–") && !value?.includes("-")) {
    initStart = value || "";
    initEnd = "";
  } else if (value.includes("-") && !value.includes("–")) {
    const dashParts = value.split("-").map(s => s.trim());
    initStart = dashParts[0] || "";
    initEnd = dashParts.length > 1 ? dashParts[1] : "";
  }

  const [start, setStart] = useState(initStart);
  const [end, setEnd] = useState(initEnd);
  const [isPresent, setIsPresent] = useState(initEnd.toLowerCase() === "present");

  // B6 FIX: Fully re-sync internal state whenever external `value` prop changes,
  // not just when it resets to empty. This handles "Import from Profile" correctly.
  useEffect(() => {
    const parts2 = (value || "").split("\u2013").map(s => s.trim());
    let newStart = parts2[0] || "";
    let newEnd = parts2.length > 1 ? parts2[1] : "";
    if (!value?.includes("\u2013") && !value?.includes("-")) {
      newStart = value || "";
      newEnd = "";
    } else if (value && value.includes("-") && !value.includes("\u2013")) {
      const dp = value.split("-").map(s => s.trim());
      newStart = dp[0] || "";
      newEnd = dp.length > 1 ? dp[1] : "";
    }
    setStart(newStart);
    setEnd(newEnd === "Present" ? "" : newEnd);
    setIsPresent(newEnd.toLowerCase() === "present");
  }, [value]);

  const updateValue = (s: string, e: string, p: boolean) => {
    if (!s && !e && !p) {
      onChange("");
      return;
    }
    const endStr = p ? "Present" : e;
    if (s && endStr) {
      onChange(`${s} – ${endStr}`);
    } else if (s) {
      onChange(s);
    } else if (endStr) {
      onChange(endStr);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="w-1/2 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all"
          placeholder="Start (e.g. Jan 2024)"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
            updateValue(e.target.value, end, isPresent);
          }}
        />
        <input
          type="text"
          disabled={isPresent}
          className="w-1/2 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-50 disabled:bg-surface-container-low"
          placeholder="End (e.g. Mar 2024)"
          value={isPresent ? "Present" : end}
          onChange={(e) => {
            setEnd(e.target.value);
            updateValue(start, e.target.value, isPresent);
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`present-${start}-${end}`}
          checked={isPresent}
          onChange={(e) => {
            setIsPresent(e.target.checked);
            updateValue(start, end, e.target.checked);
          }}
          className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
        />
        <label htmlFor={`present-${start}-${end}`} className="text-label-sm text-on-surface-variant cursor-pointer">
          Currently working here (Present)
        </label>
      </div>
    </div>
  );
}

function TextAreaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="relative">
      <textarea
        className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      <div className="text-right text-[11px] text-on-surface-variant/70 mt-0.5">
        {(value || "").length} characters
      </div>
    </div>
  );
}

/* =========================================================
   BULLET LIST + AI ENHANCE
   ========================================================= */

type EnhancePayload = {
  project_name: string;
  description: string;
  technologies: string[];
};

/**
 * Editable bullet group with a per-group "AI Enhance" button. Sends the
 * existing bullets + minimal context to POST /api/v1/ai/github/improve-bullets
 * and replaces the list with the refined output.
 */
function BulletList({
  label,
  bullets,
  onChange,
  onAdd,
  onRemove,
  value,
}: {
  label: string;
  bullets: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  value: EnhancePayload;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function handleEnhance() {
    const idsi = bullets.join(" ").trim();
    if (!idsi) return;

    const token = getToken();
    if (!token) {
      setResult("err");
      setMessage("Please sign in to use AI Enhance.");
      return;
    }

    setBusy(true);
    setResult("idle");
    setMessage("");
    try {
      const res = await improveGitHubBullets(token, {
        project_name: value.project_name,
        description: value.description,
        technologies: value.technologies,
        current_bullets: bullets.filter(Boolean),
      });
      const better = res.resume_bullets;
      // B5 FIX: Capture bullets.length snapshot BEFORE onAdd() calls change the array length
      const originalCount = bullets.length;
      // Replace the list in-place, keep ordering.
      bullets.forEach((_, k) => onChange(k, better[k] ?? ""));
      if (better.length > originalCount) {
        better.slice(originalCount).forEach((b, extraIdx) => {
          // add a new row for any extra bullets the AI returns
          onAdd();
          // push value on the NEXT tick after the row mounts, using the correct index
          const targetIndex = originalCount + extraIdx;
          requestAnimationFrame(() => onChange(targetIndex, b));
        });
      }
      setResult("ok");
      setMessage("Bullets improved.");
    } catch (err) {
      setResult("err");
      setMessage(
        err instanceof Error ? err.message : "Could not improve bullets."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-label-sm font-semibold text-on-surface">{label}</label>
        <button
          type="button"
          onClick={handleEnhance}
          disabled={busy || !bullets.join("").trim()}
          className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <MaterialIcon name="sync" className="animate-spin text-[15px]" />
          ) : (
            <MaterialIcon name="auto_awesome" className="text-[15px]" filled />
          )}
          {busy ? "Enhancing..." : "AI Enhance"}
        </button>
      </div>

      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-3 text-label-sm text-on-surface-variant">•</span>
          <textarea
            className="flex-1 min-h-[64px] px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all resize-y"
            value={b}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder="Achieved strong action-verb statement…"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label="Remove bullet"
            className="mt-2 text-on-surface-variant hover:text-error transition-colors"
          >
            <MaterialIcon name="close" className="text-[16px]" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="text-label-sm text-secondary hover:text-primary transition-colors flex items-center gap-1 mt-1"
      >
        <MaterialIcon name="add" className="text-[16px]" />
        Add Bullet Point
      </button>

      {result === "ok" && (
        <p className="text-label-sm text-secondary flex items-center gap-1">
          <MaterialIcon name="check_circle" className="text-[14px]" />
          {message}
        </p>
      )}
      {result === "err" && (
        <p className="text-label-sm text-error">{message}</p>
      )}
    </div>
  );
}