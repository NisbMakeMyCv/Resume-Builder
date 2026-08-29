"use client";

import { useEffect, useState } from "react";
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
import { getProfile, getStoredUser, getToken, improveGitHubBullets, resumesApi } from "../../../lib/api";

import { encryptData } from "../../../lib/crypto";
import { useCrypto } from "../../providers/CryptoProvider";
import PassphraseModal from "../PassphraseModal";
import ResumeChatbot from "../ai/ResumeChatbot";
import GitHubAnalyzer from "../ai/GitHubAnalyzer";
import ConfirmModal from "../ConfirmModal";
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
export default function JakeResumeBuilder({ initialDataStr }: { initialDataStr?: string | null }) {
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
  const [isExporting, setIsExporting] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string>("Header");
  const [activeTab, setActiveTab] = useState<"editor" | "github">("editor");

  const { toasts, dismiss, notify } = useToasts();

  // Draft state representing current inputs in the builder forms
  const [draftData, setDraftData] = useState<ResumeData>(data);

  // Normalize backend field names to frontend field names
  const normalizeOpData = (section: string, data: any): any => {
    if (!data || typeof data !== "object") return data;
    const d = { ...data };

    if (section === "education") {
      if (d.institution && !d.school) { d.school = d.institution; delete d.institution; }
    }
    if (section === "experience") {
      if (d.role && !d.title) { d.title = d.role; delete d.role; }
      if (d.job_title && !d.title) { d.title = d.job_title; delete d.job_title; }
      if (d.startDate || d.endDate) {
        if (!d.dates) d.dates = [d.startDate, d.endDate].filter(Boolean).join(" - ");
        delete d.startDate; delete d.endDate;
      }
      if (d.description && !d.bullets) { d.bullets = [d.description]; delete d.description; }
    }
    if (section === "projects") {
      if (d.name && !d.title) { d.title = d.name; delete d.name; }
      if (d.projectLink && !d.links) { d.links = d.projectLink; delete d.projectLink; }
      if (d.githubLink && !d.links) { d.links = d.githubLink; delete d.githubLink; }
      if (Array.isArray(d.technologies)) { d.technologies = d.technologies.join(", "); }
    }
    if (section === "skills") {
      // Backend may send {name: "Python", category: "Language"} → convert to {category, items}
      if (d.name && !d.items) {
        d.items = d.name;
        delete d.name;
      }
      if (!d.category) d.category = "Technical";
    }
    return d;
  };

  // Apply operations received from NISBot directly to the active draft
  const applyResumeOperations = (operations: any[]) => {
    setDraftData((prev) => {
      let next = { ...prev };
      operations.forEach((op) => {
        const sec = op.section === "personal" ? "header" : op.section;

        // Handle 'clear' action
        if (op.action === "clear") {
          if (sec === "header" && op.field) {
            if (op.field === "name") next.header = { ...next.header, fullName: "" };
            else if (op.field === "email") next.header = { ...next.header, email: "" };
            else if (op.field === "phone") next.header = { ...next.header, phone: "" };
            else if (op.field === "linkedin") next.header = { ...next.header, links: { ...next.header.links, linkedin: "" } };
            else if (op.field === "github") next.header = { ...next.header, links: { ...next.header.links, github: "" } };
          } else if (Array.isArray(next[sec as keyof ResumeData])) {
            (next[sec as keyof ResumeData] as any[]) = [];
          }
          return;
        }

        // Handle array sections (education, experience, projects, skills, customSections)
        if (Array.isArray(next[sec as keyof ResumeData])) {
          const normalized = normalizeOpData(op.section, op.data);

          if (op.action === "add") {
            const newItem = { id: uid(), ...normalized };
            (next[sec as keyof ResumeData] as any[]) = [...(next[sec as keyof ResumeData] as any[]), newItem];
          } else if (op.action === "update" && op.index != null) {
            (next[sec as keyof ResumeData] as any[]) = (next[sec as keyof ResumeData] as any[]).map((item, i) =>
              i === op.index ? { ...item, ...normalized } : item
            );
          } else if (op.action === "delete" && op.index != null) {
            (next[sec as keyof ResumeData] as any[]) = (next[sec as keyof ResumeData] as any[]).filter((_, i) => i !== op.index);
          } else if (op.action === "replace") {
            if (Array.isArray(normalized)) {
              (next[sec as keyof ResumeData] as any) = normalized.map((item: any) => ({ id: uid(), ...normalizeOpData(op.section, item) }));
            } else {
              (next[sec as keyof ResumeData] as any) = normalized;
            }
          }
        }
        // Handle header/personal section
        else if (sec === "header" && (op.action === "update" || op.action === "replace")) {
          if (op.field === "name") next.header.fullName = op.data;
          else if (op.field === "email") next.header.email = op.data;
          else if (op.field === "phone") next.header.phone = op.data;
          else if (op.field === "location") next.header.location = op.data;
          else if (op.field === "position") next.header.position = op.data;
          else if (op.field === "linkedin") next.header.links = { ...next.header.links, linkedin: op.data };
          else if (op.field === "github") next.header.links = { ...next.header.links, github: op.data };
          else if (op.data && typeof op.data === "object") {
            next.header = {
              ...next.header,
              fullName: op.data.name ?? next.header.fullName,
              email: op.data.email ?? next.header.email,
              phone: op.data.phone ?? next.header.phone,
              location: op.data.location ?? next.header.location,
              position: op.data.position ?? next.header.position,
              links: {
                ...next.header.links,
                linkedin: op.data.linkedin ?? next.header.links.linkedin,
                github: op.data.github ?? next.header.links.github,
              },
            };
          }
        }
      });
      return next;
    });
  };

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

  const [isRecompiling, setIsRecompiling] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  // Snapshot of the committed preview state just BEFORE the last Recompile — used for Rollback
  const [previousData, setPreviousData] = useState<ResumeData | null>(null);

  const handleRecompile = async () => {
    const error = validateForm(draftData);
    if (error) {
      notify.error(error);
      return;
    }
    
    setIsRecompiling(true);
    try {
      // ✅ Save the current committed preview state so Rollback can restore it
      setPreviousData(JSON.parse(JSON.stringify(data)));

      // Commit draftData → data (updates the Live Preview)
      const freshCopy = JSON.parse(JSON.stringify(draftData));
      setData(freshCopy);
      saveDraftLocally(freshCopy);
      
      // Save to Cloud if user has cloud record
      const token = getToken();
      if (token && resumeId) {
        try {
          const title = freshCopy.header.fullName ? `${freshCopy.header.fullName}'s Resume` : "My Resume";
          const encryptedBlob = await encryptData(JSON.stringify(freshCopy), passphrase!);
          await resumesApi.update(token, resumeId, title, encryptedBlob);
        } catch (err) {
          console.error("Auto cloud sync failed during recompile:", err);
        }
      }
      notify.success("Recompiled successfully!");
    } finally {
      setIsRecompiling(false);
    }
  };

  const executeRollback = () => {
    localStorage.removeItem("makemycv_resume_jake_exported");
    // Restore to the snapshot taken just before the last Recompile.
    // Falls back to current `data` if no recompile has happened yet.
    const target = JSON.parse(JSON.stringify(previousData ?? data));
    setData(target);      // ← forces the Live Preview canvas to update
    setDraftData(target); // ← resets all form input fields
    setPreviousData(null);
    setShowRollbackModal(false);
    notify.success("Rolled back to previous version.");
  };

  const handleRollback = () => {
    setShowRollbackModal(true);
  };

  const handleCloudSave = async () => {
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
      const title = draftData.header.fullName ? `${draftData.header.fullName}'s Resume` : "My Resume";
      const jsonString = JSON.stringify(draftData);
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

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
      const filename = draftData.header.fullName
        ? draftData.header.fullName.replace(/\s+/g, "_") + "_Resume"
        : "resume";

      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send structured ResumeData, not raw HTML
        body: JSON.stringify({ resumeData: data }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to generate DOCX");
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);
      notify.success("DOCX exported successfully!");
    } catch (err) {
      notify.error("Failed to export DOCX: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFromProfile = async () => {
    const token = getToken();
    if (!token) {
      notify.error("Please log in to import your profile.");
      return;
    }
    
    try {
      const [profileData, eduList, expList, skillList, projectList, certList, achList] = await Promise.all([
        resumesApi.list(token).then(() => getProfile(token)), // Get profile details
        require("../../../lib/api").educationApi.list(token),
        require("../../../lib/api").experienceApi.list(token),
        require("../../../lib/api").skillsApi.list(token),
        require("../../../lib/api").projectsApi.list(token),
        require("../../../lib/api").certificationsApi.list(token),
        require("../../../lib/api").achievementsApi.list(token),
      ]);

      const storedUser = getStoredUser();
      const { mapProfileToResume } = require("../../../utils/resumeMapper");
      const importedData = mapProfileToResume(storedUser, {
        profile: profileData,
        education: eduList,
        experience: expList,
        skills: skillList,
        projects: projectList,
        certifications: certList,
        achievements: achList,
      });

      setDraftData(importedData);
      notify.success("Successfully imported your latest profile data!");
    } catch (err) {
      notify.error("Failed to import profile data: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const updateHeader = (patch: Partial<ResumeData["header"]>) =>
    setDraftData((d) => ({ ...d, header: { ...d.header, ...patch } }));

  /* ---- Array starters/removers (shared by all sections) ---- */

  function addEducation() {
    setDraftData((d) => ({
      ...d,
      education: [
        ...d.education,
        { id: uid(), school: "", degree: "", location: "", dates: "", coursework: "" },
      ],
    }));
  }
  function addExperience() {
    setDraftData((d) => ({
      ...d,
      experience: [
        ...d.experience,
        { id: uid(), company: "", title: "", location: "", dates: "", bullets: [""] },
      ],
    }));
  }
  function addProject() {
    setDraftData((d) => ({
      ...d,
      projects: [
        ...d.projects,
        { id: uid(), title: "", technologies: "", dates: "", links: "", bullets: [""] },
      ],
    }));
  }
  function addSkillGroup() {
    setDraftData((d) => ({
      ...d,
      skills: [...d.skills, { id: uid(), category: "", items: "" }],
    }));
  }

  function addCustomSection() {
    setDraftData((d) => ({
      ...d,
      customSections: [
        ...(d.customSections || []),
        { id: uid(), title: "Custom Section", fields: [] },
      ],
    }));
  }

  function addCustomField(sectionId: string, type: CustomSectionFieldType) {
    setDraftData((d) => ({
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
    setDraftData((d) => ({
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
    setDraftData((d) => ({
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
    setDraftData((d) => ({
      ...d,
      [key]: (d[key] as unknown as T[]).filter((i) => i.id !== id),
    }));

  const updateItem = <T extends { id: string }>(
    key: "education" | "experience" | "projects" | "skills" | "customSections",
    id: string,
    patch: Partial<T>
  ) =>
    setDraftData((d) => ({
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
    setDraftData((d) => ({
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
    setDraftData((d) => ({
      ...d,
      [key]: (d[key] as unknown as Array<{ id: string; bullets: string[] }>).map(
        (i) => (i.id === id ? { ...i, bullets: [...i.bullets, ""] } : i)
      ),
    }));

  const removeBullet = (key: "experience" | "projects", id: string, index: number) =>
    setDraftData((d) => ({
      ...d,
      [key]: (d[key] as unknown as Array<{ id: string; bullets: string[] }>).map(
        (i) =>
          i.id === id
            ? { ...i, bullets: i.bullets.filter((_, k) => k !== index) }
            : i
      ),
    }));  return (
    <>
      <PassphraseModal />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <ConfirmModal
        open={showRollbackModal}
        title="Discard Draft Changes?"
        message="Are you sure you want to discard your draft changes? Recompile states will be lost."
        confirmLabel="Discard"
        onConfirm={executeRollback}
        onCancel={() => setShowRollbackModal(false)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
        {/* ============ LEFT: EDITOR & TOOLS PANEL ============ */}
        <div className="space-y-6 no-print">
          {/* Tab Navigation */}
          <div className="flex items-center p-1.5 bg-surface-container-low border border-outline-variant rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-label-md transition-all duration-200 ${
                activeTab === "editor"
                  ? "bg-surface text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest"
              }`}
            >
              <MaterialIcon name="edit_note" className="text-[20px]" />
              Resume Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("github")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-label-md transition-all duration-200 ${
                activeTab === "github"
                  ? "bg-surface text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest"
              }`}
            >
              <MaterialIcon name="auto_awesome" className="text-[20px]" />
              GitHub AI Analyzer
            </button>
          </div>

          {activeTab === "editor" && (
            <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header */}
          <Section
            icon="badge"
            title="Header"
            subtitle="Your name, contact details, and profile links."
            isOpen={openSection === "Header"}
            onToggle={() => setOpenSection(openSection === "Header" ? "" : "Header")}
          >
            <Field label="Full Name">
              <TextInput
                value={draftData.header.fullName}
                onChange={(v) => updateHeader({ fullName: v })}
                placeholder="Alex Morgan"
              />
            </Field>
            <Field label="Job Title / Position">
              <TextInput
                value={draftData.header.position}
                onChange={(v) => updateHeader({ position: v })}
                placeholder="Full-Stack Engineer"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone">
                <TextInput
                  value={draftData.header.phone}
                  onChange={(v) => handleChangeField("phone", v, () => updateHeader({ phone: v }))}
                  onBlur={(v) => handleBlurField("phone", v)}
                  error={fieldErrors.phone}
                  placeholder="(555) 867-5309"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  value={draftData.header.email}
                  onChange={(v) => handleChangeField("email", v, () => updateHeader({ email: v }))}
                  onBlur={(v) => handleBlurField("email", v)}
                  error={fieldErrors.email}
                  placeholder="alex@email.com"
                />
              </Field>
            </div>
            <Field label="Location">
              <TextInput
                value={draftData.header.location}
                onChange={(v) => updateHeader({ location: v })}
                placeholder="San Francisco, CA"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="LinkedIn URL">
                <TextInput
                  value={draftData.header.links.linkedin}
                  onChange={(v) =>
                    handleChangeField("linkedin", v, () =>
                      updateHeader({ links: { ...draftData.header.links, linkedin: v } })
                    )
                  }
                  onBlur={(v) => handleBlurField("linkedin", v)}
                  error={fieldErrors.linkedin}
                  placeholder="linkedin.com/in/you"
                />
              </Field>
              <Field label="LinkedIn Text">
                <TextInput
                  value={draftData.header.links.linkedinText}
                  onChange={(v) =>
                    updateHeader({ links: { ...draftData.header.links, linkedinText: v } })
                  }
                  placeholder="e.g. linkedin/you"
                />
              </Field>
              <Field label="GitHub URL (Use GitHub Analyzer below to extract!)">
                <TextInput
                  value={draftData.header.links.github}
                  onChange={(v) =>
                    handleChangeField("github", v, () =>
                      updateHeader({ links: { ...draftData.header.links, github: v } })
                    )
                  }
                  onBlur={(v) => handleBlurField("github", v)}
                  error={fieldErrors.github}
                  placeholder="github.com/you"
                />
              </Field>
              <Field label="GitHub Text">
                <TextInput
                  value={draftData.header.links.githubText}
                  onChange={(v) =>
                    updateHeader({ links: { ...draftData.header.links, githubText: v } })
                  }
                  placeholder="e.g. github/you"
                />
              </Field>
              <Field label="Portfolio URL">
                <TextInput
                  value={draftData.header.links.portfolio}
                  onChange={(v) =>
                    handleChangeField("portfolio", v, () =>
                      updateHeader({ links: { ...draftData.header.links, portfolio: v } })
                    )
                  }
                  onBlur={(v) => handleBlurField("portfolio", v)}
                  error={fieldErrors.portfolio}
                  placeholder="yourdomain.dev"
                />
              </Field>
              <Field label="Portfolio Text">
                <TextInput
                  value={draftData.header.links.portfolioText}
                  onChange={(v) =>
                    updateHeader({ links: { ...draftData.header.links, portfolioText: v } })
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
            isOpen={openSection === "Education"}
            onToggle={() => setOpenSection(openSection === "Education" ? "" : "Education")}
          >
            {draftData.education.length === 0 && <EmptyRow onAdd={addEducation} />}
            {draftData.education.map((ed) => (
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
            isOpen={openSection === "Experience"}
            onToggle={() => setOpenSection(openSection === "Experience" ? "" : "Experience")}
          >
            {draftData.experience.length === 0 && <EmptyRow onAdd={addExperience} />}
            {draftData.experience.map((ex) => (
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
            isOpen={openSection === "Projects"}
            onToggle={() => setOpenSection(openSection === "Projects" ? "" : "Projects")}
          >
            {draftData.projects.length === 0 && <EmptyRow onAdd={addProject} />}
            {draftData.projects.map((proj) => (
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
            isOpen={openSection === "Skills"}
            onToggle={() => setOpenSection(openSection === "Skills" ? "" : "Skills")}
          >
            {draftData.skills.length === 0 && <EmptyRow onAdd={addSkillGroup} />}
            {draftData.skills.map((s) => (
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
            isOpen={openSection === "Custom"}
            onToggle={() => setOpenSection(openSection === "Custom" ? "" : "Custom")}
          >
            {(!draftData.customSections || draftData.customSections.length === 0) && (
              <EmptyRow onAdd={addCustomSection} />
            )}
            {(draftData.customSections || []).map((s) => (
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

              {/* Reset */}
              <div className="flex justify-start pt-2">
                <button
                  type="button"
                  onClick={() => setDraftData(emptyResume())}
                  className="btn-outline px-4 py-2.5 rounded-full text-label-md flex items-center gap-2"
                >
                  <MaterialIcon name="refresh" className="text-[18px]" />
                  Reset Resume
                </button>
              </div>
            </div>
          )}

          {activeTab === "github" && (
            <div className="animate-in fade-in duration-300">
              <Section
                icon="auto_awesome"
                title="GitHub Repository Analyzer"
                subtitle="Provide a public GitHub repository link to extract technologies, purpose, and draft bullet points."
              >
                <GitHubAnalyzer />
              </Section>
            </div>
          )}
        </div>

        {/* ============ RIGHT: LIVE PREVIEW ============ */}
        <div className="lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pb-8 print:!static print:!max-h-none print:!overflow-visible print:!pb-0 print:!w-full print:!h-auto">
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
                onClick={handleImportFromProfile}
                className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5 border-primary text-primary hover:bg-primary/5"
              >
                <MaterialIcon name="download" className="text-[16px]" />
                Import from Profile
              </button>
              <button
                onClick={handleRecompile}
                disabled={isRecompiling}
                className="btn-primary px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:opacity-50"
              >
                <MaterialIcon name={isRecompiling ? "sync" : "autorenew"} className={`text-[16px] ${isRecompiling ? "animate-spin" : ""}`} />
                {isRecompiling ? "Compiling..." : "Recompile"}
              </button>
              <button
                onClick={handleRollback}
                className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5 border-red-600 text-red-600 hover:bg-red-50"
              >
                <MaterialIcon name="undo" className="text-[16px]" />
                Rollback
              </button>
              <button
                onClick={handleCloudSave}
                disabled={saving}
                className="btn-outline px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
              >
                <MaterialIcon name="cloud_upload" className="text-[16px]" />
                {saving ? "Saving..." : "Save to Cloud"}
              </button>
              <button
                onClick={handleExportPDF}
                className="btn-primary px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
              >
                <MaterialIcon name="picture_as_pdf" className="text-[16px]" />
                PDF
              </button>
              <button
                onClick={handleExportDOCX}
                disabled={isExporting}
                className="btn-primary px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <MaterialIcon name="sync" className="text-[16px] animate-spin" />
                ) : (
                  <MaterialIcon name="description" className="text-[16px]" />
                )}
                {isExporting ? "Exporting…" : "DOCX"}
              </button>
            </div>
          </div>
          <div className="relative">
            <JakeResumePreview data={data} />
          </div>
        </div>
      </div>

      {/* ============ VIEWPORT-FIXED NISBOT FLOATING WIDGET ============ */}
      <div className="fixed bottom-6 right-6 z-50 no-print flex flex-col items-end gap-3 pointer-events-auto">
        {isChatbotOpen && (
          <div className="w-[380px] h-[520px] max-w-[calc(100vw-2rem)] bg-surface rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-outline-variant overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            <ResumeChatbot 
              resumeData={draftData} 
              onResumeUpdate={applyResumeOperations} 
              onClose={() => setIsChatbotOpen(false)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
          className="relative group w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(56,189,248,0.2)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 ring-2 ring-primary/30 dark:ring-primary/50 p-[2px]"
          aria-label="Toggle NISBot AI Assistant"
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-white shadow-inner">
            <img src="/nisbot.jpeg" alt="NISBot" className="w-full h-full object-cover" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white dark:border-slate-800"></span>
          </span>
        </button>
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

  // Keep internal state synced if external value completely changes (e.g. reset)
  useEffect(() => {
    if (!value) {
      setStart("");
      setEnd("");
      setIsPresent(false);
    }
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
    <textarea
      className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all resize-y"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
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
      // Replace the list in-place, keep ordering.
      bullets.forEach((_, k) => onChange(k, better[k] ?? ""));
      if (better.length > bullets.length) {
        better.slice(bullets.length).forEach((b) => {
          // add a new row for any extra bullets the AI returns
          onAdd();
          // push value on the NEXT tick after the row mounts
          requestAnimationFrame(() => onChange(bullets.length, b));
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
        className="text-label-sm text-secondary hover:text-primary transition-colors flex items-center gap-1"
      >
        <MaterialIcon name="add" className="text-[15px]" />
        Add bullet
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