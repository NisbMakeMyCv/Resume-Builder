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
import { getToken, improveGitHubBullets, resumesApi } from "../../../lib/api";

import { encryptData } from "../../../lib/crypto";
import { useCrypto } from "../../providers/CryptoProvider";
import PassphraseModal from "../PassphraseModal";
import ResumeChatbot from "../ai/ResumeChatbot";
import GitHubAnalyzer from "../ai/GitHubAnalyzer";

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
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string>("Header");
  const [activeTab, setActiveTab] = useState<"editor" | "github">("editor");

  // Apply operations received from NISBot
  const applyResumeOperations = (operations: any[]) => {
    setData((prev) => {
      let next = { ...prev };
      operations.forEach((op) => {
        const sec = op.section === "personal" ? "header" : op.section;
        if (!next[sec as keyof ResumeData]) return;

        if (op.action === "add" && Array.isArray(next[sec as keyof ResumeData])) {
          const newItem = { id: uid(), ...op.data };
          (next[sec as keyof ResumeData] as any[]) = [...(next[sec as keyof ResumeData] as any[]), newItem];
        } else if (op.action === "update" && Array.isArray(next[sec as keyof ResumeData])) {
          if (op.index != null) {
            (next[sec as keyof ResumeData] as any[]) = (next[sec as keyof ResumeData] as any[]).map((item, i) =>
              i === op.index ? { ...item, ...op.data } : item
            );
          }
        } else if (op.action === "delete" && Array.isArray(next[sec as keyof ResumeData])) {
          if (op.index != null) {
            (next[sec as keyof ResumeData] as any[]) = (next[sec as keyof ResumeData] as any[]).filter((_, i) => i !== op.index);
          }
        } else if (sec === "header" && (op.action === "update" || op.action === "replace")) {
          if (op.field === "name") next.header.fullName = op.data;
          else if (op.field === "email") next.header.email = op.data;
          else if (op.field === "phone") next.header.phone = op.data;
          else if (op.field === "linkedin") next.header.links.linkedin = op.data;
          else if (op.field === "github") next.header.links.github = op.data;
          else if (op.data) {
            next.header = {
              ...next.header,
              fullName: op.data.name ?? next.header.fullName,
              email: op.data.email ?? next.header.email,
              phone: op.data.phone ?? next.header.phone,
              links: {
                ...next.header.links,
                linkedin: op.data.linkedin ?? next.header.links.linkedin,
                github: op.data.github ?? next.header.links.github,
              },
            };
          }
        } else if (op.action === "replace") {
          (next[sec as keyof ResumeData] as any) = op.data;
        }
      });
      return next;
    });
  };

  // Persist on every change to local storage
  useEffect(() => {
    saveResume(data);
  }, [data]);

  const handleCloudSave = async () => {
    const token = getToken();
    if (!token) {
      alert("Please log in to save your resume to the cloud.");
      return;
    }
    if (!passphrase) {
      alert("Encryption passphrase is required to save.");
      return;
    }
    
    setSaving(true);
    try {
      const title = data.header.fullName ? `${data.header.fullName}'s Resume` : "My Resume";
      const jsonString = JSON.stringify(data);
      
      // Zero-knowledge encryption: encrypt the JSON string into a binary Blob
      const encryptedBlob = await encryptData(jsonString, passphrase);

      if (resumeId) {
        await resumesApi.update(token, resumeId, title, encryptedBlob);
        alert("Resume updated in cloud!");
      } else {
        const created = await resumesApi.create(token, title, encryptedBlob);
        setResumeId(created.id);
        alert("Resume saved to cloud!");
      }
    } catch (err) {
      alert("Failed to save resume: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportDOCX = async () => {
    const el = document.getElementById("resume-pdf-content");
    if (!el) return;
    
    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: el.outerHTML }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate DOCX");
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "resume.docx";
      link.click();
    } catch (err) {
      alert("Failed to export DOCX: " + (err instanceof Error ? err.message : String(err)));
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
    }));  return (
    <>
      <PassphraseModal />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start relative">
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
                  onChange={(v) => updateHeader({ phone: v })}
                  placeholder="(555) 867-5309"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  value={data.header.email}
                  onChange={(v) => updateHeader({ email: v })}
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
                    updateHeader({ links: { ...data.header.links, linkedin: v } })
                  }
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
                    updateHeader({ links: { ...data.header.links, github: v } })
                  }
                  placeholder="github.com/you"
                />
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
                    updateHeader({ links: { ...data.header.links, portfolio: v } })
                  }
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
            isOpen={openSection === "Education"}
            onToggle={() => setOpenSection(openSection === "Education" ? "" : "Education")}
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
                    <TextInput
                      value={ed.dates}
                      onChange={(v) => updateItem<Education>("education", ed.id, { dates: v })}
                      placeholder="2018 – 2022"
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
                    <TextInput
                      value={ex.dates}
                      onChange={(v) => updateItem<Experience>("experience", ex.id, { dates: v })}
                      placeholder="2022 – Present"
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
                    <TextInput
                      value={proj.dates}
                      onChange={(v) => updateItem<Project>("projects", proj.id, { dates: v })}
                      placeholder="Jan 2024 – Present"
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
            isOpen={openSection === "Custom"}
            onToggle={() => setOpenSection(openSection === "Custom" ? "" : "Custom")}
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

              {/* Reset */}
              <div className="flex justify-start pt-2">
                <button
                  type="button"
                  onClick={() => setData(emptyResume())}
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
        <div className="xl:sticky xl:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pb-8">
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
                className="btn-primary px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
              >
                <MaterialIcon name="description" className="text-[16px]" />
                DOCX
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
              resumeData={data} 
              onResumeUpdate={applyResumeOperations} 
              onClose={() => setIsChatbotOpen(false)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
          className="relative group w-14 h-14 bg-gradient-to-tr from-primary to-primary-container text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-primary/20"
          aria-label="Toggle NISBot AI Assistant"
        >
          <span className="text-2xl leading-none animate-bounce">🤖</span>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-tertiary"></span>
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
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
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