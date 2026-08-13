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
} from "../../../lib/resume";
import { getToken, improveGitHubBullets, resumesApi } from "../../../lib/api";
import html2canvas from "html2canvas";

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
export default function JakeResumeBuilder() {
  const [data, setData] = useState<ResumeData>(() => loadResume());
  const [saving, setSaving] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

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
    setSaving(true);
    try {
      const payload = {
        title: data.header.fullName ? `${data.header.fullName}'s Resume` : "My Resume",
        content: JSON.stringify(data),
      };
      if (resumeId) {
        await resumesApi.update(token, resumeId, payload);
        alert("Resume updated in cloud!");
      } else {
        const created = await resumesApi.create(token, payload);
        setResumeId(created.id);
        alert("Resume saved to cloud!");
      }
    } catch (err) {
      alert("Failed to save resume: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPNG = async () => {
    const el = document.getElementById("resume-pdf-content");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const link = document.createElement("a");
    link.download = "resume.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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
        { id: uid(), title: "", technologies: "", links: "", bullets: [""] },
      ],
    }));
  }
  function addSkillGroup() {
    setData((d) => ({
      ...d,
      skills: [...d.skills, { id: uid(), category: "", items: "" }],
    }));
  }

  const removeItem = <T extends { id: string }>(
    key: "education" | "experience" | "projects" | "skills",
    id: string
  ) =>
    setData((d) => ({
      ...d,
      [key]: (d[key] as unknown as T[]).filter((i) => i.id !== id),
    }));

  const updateItem = <T extends { id: string }>(
    key: "education" | "experience" | "projects" | "skills",
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
      {/* ============ LEFT: EDITOR ============ */}
      <div className="space-y-8">
        {/* Header */}
        <Section
          icon="badge"
          title="Header"
          subtitle="Your name, contact details, and profile links."
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="LinkedIn">
              <TextInput
                value={data.header.links.linkedin}
                onChange={(v) =>
                  updateHeader({ links: { ...data.header.links, linkedin: v } })
                }
                placeholder="linkedin.com/in/you"
              />
            </Field>
            <Field label="GitHub">
              <TextInput
                value={data.header.links.github}
                onChange={(v) =>
                  updateHeader({ links: { ...data.header.links, github: v } })
                }
                placeholder="github.com/you"
              />
            </Field>
            <Field label="Portfolio">
              <TextInput
                value={data.header.links.portfolio}
                onChange={(v) =>
                  updateHeader({ links: { ...data.header.links, portfolio: v } })
                }
                placeholder="yourdomain.dev"
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
                <Field label="Links">
                  <TextInput
                    value={proj.links}
                    onChange={(v) => updateItem<Project>("projects", proj.id, { links: v })}
                    placeholder="github.com/you/project"
                  />
                </Field>
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

      {/* ============ RIGHT: LIVE PREVIEW ============ */}
      <div className="xl:sticky xl:top-24">
        <div className="mb-3 flex flex-wrap gap-3 items-center justify-between">
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
              onClick={handleExportPNG}
              className="btn-primary px-3 py-1.5 rounded-full text-label-sm flex items-center gap-1.5"
            >
              <MaterialIcon name="image" className="text-[16px]" />
              PNG
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
        <div className="ambient-card rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-6">
          <JakeResumePreview data={data} />
        </div>
      </div>
    </div>
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
}: {
  icon: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
      <div className="p-5 flex flex-wrap items-center gap-3 border-b border-outline-variant">
        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center">
          <MaterialIcon name={icon} className="text-primary text-[20px]" filled />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-headline-md text-on-surface">{title}</h3>
          <p className="text-label-sm text-on-surface-variant">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="p-5 space-y-5">{children}</div>
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