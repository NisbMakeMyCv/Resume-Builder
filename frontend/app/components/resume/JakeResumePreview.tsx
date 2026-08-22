"use client";

import type {
  ResumeData,
  SkillGroup,
  CustomSection,
  CustomSectionField,
} from "../../../lib/resume";

/**
 * Live preview — Jake Resume Template.
 *
 * Supported sections:
 * - Header / Personal information
 * - Professional Summary
 * - Education
 * - Experience
 * - Projects
 * - Certifications
 * - Achievements
 * - Technical Skills
 * - Custom Sections
 */
export default function JakeResumePreview({
  data,
  className = "",
}: {
  data: ResumeData;
  className?: string;
}) {
  const { header, education, experience, projects, skills } = data;

  // Safely read optional AI-added sections.
  const certifications = Array.isArray(
    (data as ResumeData & { certifications?: unknown }).certifications
  )
    ? ((data as ResumeData & {
        certifications?: Certification[];
      }).certifications ?? [])
    : [];

  const achievements = Array.isArray(
    (data as ResumeData & { achievements?: unknown }).achievements
  )
    ? ((data as ResumeData & {
        achievements?: Achievement[];
      }).achievements ?? [])
    : [];

  const professionalSummary =
    typeof (data as ResumeData & { summary?: unknown }).summary === "string"
      ? ((data as ResumeData & { summary?: string }).summary ?? "").trim()
      : typeof (data as ResumeData & {
            professional_summary?: unknown;
          }).professional_summary === "string"
        ? (
            (data as ResumeData & {
              professional_summary?: string;
            }).professional_summary ?? ""
          ).trim()
        : "";

  // Build single unified contact + links line.
  const contactParts = [
    header?.phone,
    header?.email,
    header?.location,
    header?.links?.linkedin,
    header?.links?.github,
    header?.links?.portfolio,
  ].filter(Boolean) as string[];

  // Determine which parts are links vs plain text.
  const linkFields = new Set(
    [
      header?.links?.linkedin,
      header?.links?.github,
      header?.links?.portfolio,
    ].filter(Boolean)
  );

  return (
    <div
      id="resume-preview-container"
      className={`bg-surface-container flex justify-center items-start text-gray-900 w-full overflow-auto ${className}`}
      style={{
        fontFamily:
          "'Baskerville', 'Palatino Linotype', Georgia, serif",
        padding: "1rem",
      }}
    >
      <div
        id="resume-pdf-content"
        className="px-8 py-8 bg-white shadow-xl shrink-0 transition-all print:shadow-none mx-auto"
        style={{ width: "210mm", minHeight: "297mm", overflow: "hidden", boxSizing: "border-box" }}
      >
        {/* =========================================================
            NAME / HEADER
        ========================================================= */}
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h1
            style={{
              fontFamily:
                "'Baskerville', 'Palatino Linotype', Georgia, serif",
              fontSize: "28px",
              fontWeight: "700",
              lineHeight: "1.2",
              color: "#111827",
              margin: 0,
            }}
          >
            {header?.fullName || "Your Name"}
          </h1>

          {contactParts.length > 0 && (
            <div
              style={{
                fontSize: "11px",
                marginTop: "6px",
                color: "#1f2937",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                columnGap: "8px",
                rowGap: "2px"
              }}
            >
              {contactParts.map((part, i) => (
                <span key={`contact-${i}-${part}`} style={{ display: "flex", alignItems: "center" }}>
                  {i > 0 && (
                    <span
                      style={{
                        marginRight: "8px",
                        color: "#6b7280",
                      }}
                    >
                      |
                    </span>
                  )}

                  {linkFields.has(part) ? (
                    <a
                      href={normalizeHref(part)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#1c3fa8",
                        textDecoration: "underline",
                      }}
                    >
                      {part}
                    </a>
                  ) : (
                    <span>{part}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================
            PROFESSIONAL SUMMARY
        ========================================================= */}
        {professionalSummary && (
          <>
            <SectionHeading title="Professional Summary" />
            <p
              style={{
                fontSize: "11px",
                color: "#1f2937",
                lineHeight: "1.5",
                margin: "4px 0 0 0",
                textAlign: "justify",
              }}
            >
              {professionalSummary}
            </p>
          </>
        )}

        {/* =========================================================
            EDUCATION
        ========================================================= */}
        {Array.isArray(education) && education.length > 0 && (
          <>
            <SectionHeading title="Education" />

            <div style={{ marginTop: "4px" }}>
              {education.map((ed, index) => (
                <div
                  key={`education-${index}-${ed.id || "item"}`}
                  style={{ marginBottom: "6px" }}
                >
                  {/* Row 1: School + Location */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#111827",
                        margin: 0,
                      }}
                    >
                      {ed.school || "Institution"}
                    </p>

                    <p
                      style={{
                        fontSize: "11px",
                        color: "#374151",
                        margin: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ed.location}
                    </p>
                  </div>

                  {/* Row 2: Degree + Dates */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "11px",
                        fontStyle: "italic",
                        color: "#374151",
                        margin: 0,
                      }}
                    >
                      {ed.degree}
                    </p>

                    <p
                      style={{
                        fontSize: "11px",
                        color: "#374151",
                        margin: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ed.dates}
                    </p>
                  </div>

                  {/* Coursework */}
                  {ed.coursework && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#374151",
                        margin: "2px 0 0 0",
                      }}
                    >
                      <em>Coursework: </em>
                      {ed.coursework}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* =========================================================
            EXPERIENCE
        ========================================================= */}
        {Array.isArray(experience) && experience.length > 0 && (
          <>
            <SectionHeading title="Experience" />

            <div style={{ marginTop: "4px" }}>
              {experience.map((ex, index) => {
                const nonEmptyBullets = Array.isArray(ex.bullets)
                  ? ex.bullets.filter(
                      (bullet) => typeof bullet === "string" && bullet.trim()
                    )
                  : [];

                return (
                  <div
                    key={`experience-${index}-${ex.id || "item"}`}
                    style={{ marginBottom: "8px" }}
                  >
                    {/* Row 1 */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#111827",
                          margin: 0,
                        }}
                      >
                        {ex.title || "Job Title"}
                      </p>

                      <p
                        style={{
                          fontSize: "11px",
                          color: "#374151",
                          margin: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ex.dates}
                      </p>
                    </div>

                    {/* Row 2 */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          fontStyle: "italic",
                          color: "#374151",
                          margin: 0,
                        }}
                      >
                        {ex.company}
                      </p>

                      <p
                        style={{
                          fontSize: "11px",
                          color: "#374151",
                          margin: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ex.location}
                      </p>
                    </div>

                    {/* Bullets */}
                    {nonEmptyBullets.length > 0 && (
                      <ul
                        style={{
                          margin: "3px 0 0 0",
                          paddingLeft: "18px",
                        }}
                      >
                        {nonEmptyBullets.map((bullet, bulletIndex) => (
                          <li
                            key={`experience-${index}-bullet-${bulletIndex}`}
                            style={{
                              fontSize: "11px",
                              color: "#1f2937",
                              lineHeight: "1.5",
                              marginBottom: "1px",
                            }}
                          >
                            {bullet}
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

        {/* =========================================================
            PROJECTS
        ========================================================= */}
        {Array.isArray(projects) && projects.length > 0 && (
          <>
            <SectionHeading title="Projects" />

            <div style={{ marginTop: "4px" }}>
              {projects.map((proj, index) => {
                const nonEmptyBullets = Array.isArray(proj.bullets)
                  ? proj.bullets.filter(
                      (bullet) => typeof bullet === "string" && bullet.trim()
                    )
                  : [];

                return (
                  <div
                    key={`project-${index}-${proj.id || "item"}`}
                    style={{ marginBottom: "8px" }}
                  >
                    {/* Project title + technologies + dates */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          margin: 0,
                          color: "#111827",
                        }}
                      >
                        <strong>{proj.title || "Project"}</strong>

                        {proj.technologies && (
                          <span
                            style={{
                              fontWeight: "400",
                              fontStyle: "italic",
                              color: "#374151",
                            }}
                          >
                            {" "}
                            | {proj.technologies}
                          </span>
                        )}

                        {proj.links && (
                          <>
                            {" "}
                            <a
                              href={normalizeHref(proj.links)}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "11px",
                                color: "#1c3fa8",
                                textDecoration: "underline",
                                fontWeight: "400",
                                fontStyle: "normal",
                              }}
                            >
                              {proj.links}
                            </a>
                          </>
                        )}
                      </p>

                      <p
                        style={{
                          fontSize: "11px",
                          color: "#374151",
                          margin: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {proj.dates}
                      </p>
                    </div>

                    {/* Project bullets */}
                    {nonEmptyBullets.length > 0 && (
                      <ul
                        style={{
                          margin: "3px 0 0 0",
                          paddingLeft: "18px",
                        }}
                      >
                        {nonEmptyBullets.map((bullet, bulletIndex) => (
                          <li
                            key={`project-${index}-bullet-${bulletIndex}`}
                            style={{
                              fontSize: "11px",
                              color: "#1f2937",
                              lineHeight: "1.5",
                              marginBottom: "1px",
                            }}
                          >
                            {bullet}
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

        {/* =========================================================
            TECHNICAL SKILLS
        ========================================================= */}
        {Array.isArray(skills) &&
          skills.length > 0 &&
          skills.some((s) => s.category || s.items) && (
            <>
              <SectionHeading title="Technical Skills" />

              <div style={{ marginTop: "4px" }}>
                {skills
                  .filter((s) => s.category || s.items)
                  .map((s: SkillGroup, index) => (
                    <p
                      key={`skill-${index}-${s.id || "item"}`}
                      style={{
                        fontSize: "11px",
                        color: "#1f2937",
                        margin: "1px 0",
                        lineHeight: "1.5",
                      }}
                    >
                      {s.category && (
                        <strong style={{ color: "#111827" }}>
                          {s.category}:{" "}
                        </strong>
                      )}

                      {s.items}
                    </p>
                  ))}
              </div>
            </>
          )}

        {/* =========================================================
            CERTIFICATIONS
        ========================================================= */}
        {certifications.length > 0 && (
          <>
            <SectionHeading title="Certifications" />

            <div style={{ marginTop: "4px" }}>
              {certifications.map((cert, index) => (
                <div
                  key={`certification-${index}-${cert.id || "item"}`}
                  style={{
                    fontSize: "11px",
                    color: "#1f2937",
                    margin: "2px 0",
                    lineHeight: "1.5",
                  }}
                >
                  <strong style={{ color: "#111827" }}>
                    {cert.name}
                  </strong>

                  {cert.organization && (
                    <span> — {cert.organization}</span>
                  )}

                  {cert.issue_date && (
                    <span> ({cert.issue_date})</span>
                  )}

                  {cert.credential_id && (
                    <span> | Credential ID: {cert.credential_id}</span>
                  )}

                  {cert.credential_url && (
                    <>
                      {" "}
                      |{" "}
                      <a
                        href={normalizeHref(cert.credential_url)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#1c3fa8",
                          textDecoration: "underline",
                        }}
                      >
                        Credential
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* =========================================================
            ACHIEVEMENTS
        ========================================================= */}
        {achievements.length > 0 && (
          <>
            <SectionHeading title="Achievements" />

            <ul
              style={{
                margin: "3px 0 0 0",
                paddingLeft: "18px",
              }}
            >
              {achievements.map((achievement, index) => (
                <li
                  key={`achievement-${index}-${achievement.id || "item"}`}
                  style={{
                    fontSize: "11px",
                    color: "#1f2937",
                    lineHeight: "1.5",
                    marginBottom: "1px",
                  }}
                >
                  <strong style={{ color: "#111827" }}>
                    {achievement.title}
                  </strong>

                  {achievement.organization && (
                    <span> — {achievement.organization}</span>
                  )}

                  {achievement.description && (
                    <span>: {achievement.description}</span>
                  )}

                  {achievement.date && (
                    <span> ({achievement.date})</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* =========================================================
            CUSTOM SECTIONS
        ========================================================= */}
        {data.customSections && data.customSections.length > 0 && (
          <>
            {data.customSections.map(
              (section: CustomSection, sectionIndex) => (
                <div
                  key={`custom-section-${sectionIndex}-${section.id || "section"}`}
                >
                  {section.title && (
                    <SectionHeading title={section.title} />
                  )}

                  <div style={{ marginTop: "4px" }}>
                    {section.fields.map(
                      (
                        field: CustomSectionField,
                        fieldIndex
                      ) => (
                        <div
                          key={`custom-field-${sectionIndex}-${fieldIndex}-${field.id || "field"}`}
                          style={{
                            fontSize: "11px",
                            color: "#1f2937",
                            margin: "2px 0",
                            lineHeight: "1.5",
                          }}
                        >
                          {/* Text */}
                          {field.type === "text" && (
                            <p style={{ margin: 0 }}>
                              <strong
                                style={{ color: "#111827" }}
                              >
                                {field.label}:{" "}
                              </strong>
                              {field.value}
                            </p>
                          )}

                          {/* Textarea */}
                          {field.type === "textarea" && (
                            <div style={{ margin: "2px 0" }}>
                              <strong
                                style={{ color: "#111827" }}
                              >
                                {field.label}
                              </strong>

                              <p
                                style={{
                                  margin: "2px 0 0 0",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {field.value}
                              </p>
                            </div>
                          )}

                          {/* Link */}
                          {field.type === "link" && (
                            <p style={{ margin: 0 }}>
                              <strong
                                style={{ color: "#111827" }}
                              >
                                {field.label}:{" "}
                              </strong>

                              <a
                                href={normalizeHref(
                                  field.href || field.value
                                )}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#1c3fa8",
                                  textDecoration: "underline",
                                }}
                              >
                                {field.value}
                              </a>
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TYPES FOR OPTIONAL AI SECTIONS
========================================================= */

type Certification = {
  id?: string;
  name: string;
  organization?: string;
  issue_date?: string;
  credential_id?: string;
  credential_url?: string;
};

type Achievement = {
  id?: string;
  title: string;
  organization?: string;
  description?: string;
  date?: string;
};

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{ marginTop: "12px" }}>
      <h2
        style={{
          fontFamily:
            "'Baskerville', 'Palatino Linotype', Georgia, serif",
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

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #9ca3af",
          margin: "0 0 4px 0",
        }}
      />
    </div>
  );
}

/* =========================================================
   URL HELPER
========================================================= */

function normalizeHref(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "#";
  }

  return /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}