"use client";

import type { ResumeData, SkillGroup, CustomSection, CustomSectionField } from "../../../lib/resume";

/**
 * Live preview — pixel-perfect replica of Jake's Resume Template.
 *
 * Layout rules (matching the original PDF exactly):
 *  - Large centered serif name (~28px bold)
 *  - Single contact line: phone | email | location | linkedin | github | portfolio
 *  - Section headings: small-caps, navy blue, with a horizontal rule BELOW the heading
 *  - Education:  Row1 = School (bold, left) + Location (right)
 *               Row2 = Degree (italic, left) + Dates (right)
 *  - Experience: Row1 = Job Title (bold, left) + Dates (right)
 *               Row2 = Company (italic, left) + Location (right)
 *               Then bullet points (non-empty only)
 *  - Projects:   Row1 = Project Name (bold) | Technologies (italic, left) + Dates (right)
 *               Then bullet points (non-empty only)
 *  - Skills:    Category: items  (one per line, bold category label)
 */
export default function JakeResumePreview({
  data,
  className = "",
}: {
  data: ResumeData;
  className?: string;
}) {
  const { header, education, experience, projects, skills } = data;

  // Build single unified contact + links line
  const contactParts = [
    header.phone,
    header.email,
    header.location,
    header.links.linkedin,
    header.links.github,
    header.links.portfolio,
  ].filter(Boolean);

  // Determine which parts are links vs plain text
  const linkFields = new Set([
    header.links.linkedin,
    header.links.github,
    header.links.portfolio,
  ].filter(Boolean));

  return (
    <div
      id="resume-preview-container"
      className={`bg-surface-container flex justify-center text-gray-900 w-full overflow-auto ${className}`}
      style={{ fontFamily: "'Baskerville', 'Palatino Linotype', Georgia, serif", padding: "1rem" }}
    >
      <div
        id="resume-pdf-content"
        className="px-10 py-8 bg-white shadow-xl shrink-0 w-full max-w-[800px] transition-all print:shadow-none"
        style={{ minHeight: "297mm" }}
      >

        {/* ===== NAME / HEADER ===== */}
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h1
            style={{
              fontFamily: "'Baskerville', 'Palatino Linotype', Georgia, serif",
              fontSize: "28px",
              fontWeight: "700",
              lineHeight: "1.2",
              color: "#111827",
              margin: 0,
            }}
          >
            {header.fullName || "Your Name"}
          </h1>

          {/* Single unified contact + links line */}
          {contactParts.length > 0 && (
            <p style={{ fontSize: "11px", marginTop: "6px", color: "#1f2937" }}>
              {contactParts.map((part, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ margin: "0 4px", color: "#6b7280" }}>|</span>}
                  {linkFields.has(part) ? (
                    <a
                      href={normalizeHref(part)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#1c3fa8", textDecoration: "underline" }}
                    >
                      {part}
                    </a>
                  ) : (
                    <span>{part}</span>
                  )}
                </span>
              ))}
            </p>
          )}
        </div>

        {/* ===== EDUCATION ===== */}
        {education.length > 0 && (
          <>
            <SectionHeading title="Education" />
            <div style={{ marginTop: "4px" }}>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: "6px" }}>
                  {/* Row 1: School (bold left) + Location (right) */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#111827", margin: 0 }}>
                      {ed.school || "Institution"}
                    </p>
                    <p style={{ fontSize: "11px", color: "#374151", margin: 0, whiteSpace: "nowrap", marginLeft: "8px" }}>
                      {ed.location}
                    </p>
                  </div>
                  {/* Row 2: Degree (italic left) + Dates (right) */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: "11px", fontStyle: "italic", color: "#374151", margin: 0 }}>
                      {ed.degree}
                    </p>
                    <p style={{ fontSize: "11px", color: "#374151", margin: 0, whiteSpace: "nowrap", marginLeft: "8px" }}>
                      {ed.dates}
                    </p>
                  </div>
                  {/* Coursework */}
                  {ed.coursework && (
                    <p style={{ fontSize: "11px", color: "#374151", margin: "2px 0 0 0" }}>
                      <em>Coursework: </em>{ed.coursework}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== EXPERIENCE ===== */}
        {experience.length > 0 && (
          <>
            <SectionHeading title="Experience" />
            <div style={{ marginTop: "4px" }}>
              {experience.map((ex) => {
                const nonEmptyBullets = ex.bullets.filter(Boolean);
                return (
                  <div key={ex.id} style={{ marginBottom: "8px" }}>
                    {/* Row 1: Job Title (bold left) + Dates (right) */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#111827", margin: 0 }}>
                        {ex.title || "Job Title"}
                      </p>
                      <p style={{ fontSize: "11px", color: "#374151", margin: 0, whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {ex.dates}
                      </p>
                    </div>
                    {/* Row 2: Company (italic left) + Location (right) */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "11px", fontStyle: "italic", color: "#374151", margin: 0 }}>
                        {ex.company}
                      </p>
                      <p style={{ fontSize: "11px", color: "#374151", margin: 0, whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {ex.location}
                      </p>
                    </div>
                    {/* Bullets (non-empty only) */}
                    {nonEmptyBullets.length > 0 && (
                      <ul style={{ margin: "3px 0 0 0", paddingLeft: "18px" }}>
                        {nonEmptyBullets.map((b, i) => (
                          <li key={i} style={{ fontSize: "11px", color: "#1f2937", lineHeight: "1.5", marginBottom: "1px" }}>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ===== PROJECTS ===== */}
        {projects.length > 0 && (
          <>
            <SectionHeading title="Projects" />
            <div style={{ marginTop: "4px" }}>
              {projects.map((proj) => {
                const nonEmptyBullets = proj.bullets.filter(Boolean);
                return (
                  <div key={proj.id} style={{ marginBottom: "8px" }}>
                    {/* Row 1: ProjectName | Technologies (left) + Dates (right) */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "12px", margin: 0, color: "#111827" }}>
                        <strong>{proj.title || "Project"}</strong>
                        {proj.technologies && (
                          <span style={{ fontWeight: "400", fontStyle: "italic", color: "#374151" }}>
                            {" "}| {proj.technologies}
                          </span>
                        )}
                        {proj.links && (
                          <>
                            {" "}
                            <a
                              href={normalizeHref(proj.links)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "11px", color: "#1c3fa8", textDecoration: "underline", fontWeight: "400", fontStyle: "normal" }}
                            >
                              {proj.links}
                            </a>
                          </>
                        )}
                      </p>
                      <p style={{ fontSize: "11px", color: "#374151", margin: 0, whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {proj.dates}
                      </p>
                    </div>
                    {/* Bullets (non-empty only) */}
                    {nonEmptyBullets.length > 0 && (
                      <ul style={{ margin: "3px 0 0 0", paddingLeft: "18px" }}>
                        {nonEmptyBullets.map((b, i) => (
                          <li key={i} style={{ fontSize: "11px", color: "#1f2937", lineHeight: "1.5", marginBottom: "1px" }}>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ===== TECHNICAL SKILLS ===== */}
        {skills.length > 0 && skills.some((s) => s.category || s.items) && (
          <>
            <SectionHeading title="Technical Skills" />
            <div style={{ marginTop: "4px" }}>
              {skills
                .filter((s) => s.category || s.items)
                .map((s: SkillGroup) => (
                  <p key={s.id} style={{ fontSize: "11px", color: "#1f2937", margin: "1px 0", lineHeight: "1.5" }}>
                    {s.category && (
                      <strong style={{ color: "#111827" }}>{s.category}: </strong>
                    )}
                    {s.items}
                  </p>
                ))}
            </div>
          </>
        )}

        {/* ===== CUSTOM SECTIONS ===== */}
        {data.customSections && data.customSections.length > 0 && (
          <>
            {data.customSections.map((section) => (
              <div key={section.id}>
                {section.title && <SectionHeading title={section.title} />}
                <div style={{ marginTop: "4px" }}>
                  {section.fields.map((field) => (
                    <div key={field.id} style={{ fontSize: "11px", color: "#1f2937", margin: "2px 0", lineHeight: "1.5" }}>
                      {field.type === "text" && (
                        <p style={{ margin: 0 }}>
                          <strong style={{ color: "#111827" }}>{field.label}: </strong>
                          {field.value}
                        </p>
                      )}
                      {field.type === "textarea" && (
                        <div style={{ margin: "2px 0" }}>
                          <strong style={{ color: "#111827" }}>{field.label}</strong>
                          <p style={{ margin: "2px 0 0 0", whiteSpace: "pre-wrap" }}>{field.value}</p>
                        </div>
                      )}
                      {field.type === "link" && (
                        <p style={{ margin: 0 }}>
                          <strong style={{ color: "#111827" }}>{field.label}: </strong>
                          <a
                            href={normalizeHref(field.href || field.value)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#1c3fa8", textDecoration: "underline" }}
                          >
                            {field.value}
                          </a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}

/* =========================================================
   LOCAL HELPERS
   ========================================================= */

/**
 * Section heading with small-caps styling and a horizontal rule BELOW the text,
 * matching Jake's template exactly. Top margin creates spacing from previous section.
 */
function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{ marginTop: "12px" }}>
      <h2
        style={{
          fontFamily: "'Baskerville', 'Palatino Linotype', Georgia, serif",
          fontSize: "13px",
          fontVariant: "small-caps",
          fontWeight: "700",
          color: "#1c3fa8",
          letterSpacing: "0.04em",
          margin: "0 0 2px 0",
        }}
      >
        {title}
      </h2>
      <hr style={{ border: "none", borderTop: "1px solid #9ca3af", margin: "0 0 4px 0" }} />
    </div>
  );
}

/** Allow bare domains ("github.com/u/repo") or full URLs. */
function normalizeHref(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}