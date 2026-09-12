"use client";

import { useEffect, useState, useRef } from "react";

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
  const contactItems = [
    { type: "text", value: header?.phone },
    { type: "text", value: header?.email },
    { type: "text", value: header?.location },
    { type: "link", url: header?.links?.linkedin, text: header?.links?.linkedinText || header?.links?.linkedin },
    { type: "link", url: header?.links?.github, text: header?.links?.githubText || header?.links?.github },
    { type: "link", url: header?.links?.portfolio, text: header?.links?.portfolioText || header?.links?.portfolio },
  ].filter(item => item.value || item.url);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(1123);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const cWidth = containerRef.current.clientWidth;
        const cHeight = containerRef.current.clientHeight;
        const a4Width = 794; // 210mm at 96 DPI
        const a4Height = contentRef.current?.offsetHeight || 1123;
        
        if (cWidth > 0) {
          const scaleX = (cWidth - 16) / a4Width;
          // If container has height (non-zero fixed flex item), also fit height
          const scaleY = cHeight > 100 ? (cHeight - 16) / a4Height : scaleX;
          const fitScale = Math.min(scaleX, scaleY, 1);
          setScale(Math.max(fitScale, 0.25));
        }
      }
      if (contentRef.current) {
        const h = contentRef.current.offsetHeight;
        if (h > 0) setContentHeight(h);
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [data]);

  return (
    <>
      <style type="text/css">
        {`
          @media print {
            @page { margin: 0; size: A4; }
            body { 
              margin: 0; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
          }
        `}
      </style>

      <div
        ref={containerRef}
        id="resume-preview-container"
        className={`print-area w-full h-full flex justify-center items-center print:!block print:!h-auto print:!bg-transparent ${className}`}
      >
        {/* Exact bounding box wrapper so parent flex container fits the scaled A4 document perfectly */}
        <div
          className="relative print:!static print:!w-full print:!h-auto flex items-center justify-center shrink-0"
          style={{
            width: `${scale * 794}px`,
            height: `${scale * contentHeight}px`,
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left print:!relative print:!transform-none print:!w-full"
            style={{ 
              transform: `scale(${scale})`, 
              width: '210mm' 
            }}
          >
            <div
              ref={contentRef}
              id="resume-pdf-content"
              className="bg-white shrink-0 print:shadow-none print:m-0 print:p-0 print:rounded-none"
              style={{ 
                width: "210mm", 
                minHeight: "297mm",
                overflow: "visible", 
                boxSizing: "border-box",
                padding: "12mm 15mm",
                boxShadow: "0 4px 32px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
        {/* =========================================================
            NAME / HEADER
        ========================================================= */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h1
            style={{
              fontFamily: "'Times New Roman', Times, 'Georgia', serif",
              fontSize: "26px",
              fontWeight: "700",
              lineHeight: "1.1",
              color: "#000000",
              margin: "0 0 2px 0",
              letterSpacing: "0.02em",
            }}
          >
            {header?.fullName || "Your Name"}
          </h1>
          {header?.position && (
            <p
              style={{
                fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                fontSize: "12px",
                fontStyle: "italic",
                color: "#000000",
                margin: "0 0 4px 0",
              }}
            >
              {header.position}
            </p>
          )}

          {contactItems.length > 0 && (
            <div
              className="resume-contact-row"
              style={{
                fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                fontSize: "11px",
                marginTop: "4px",
                color: "#000000",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {contactItems.map((item, i) => (
                <span key={`contact-${i}`} style={{ display: "inline-flex", alignItems: "center" }}>
                  {i > 0 && (
                    <span style={{ margin: "0 6px", color: "#000000" }}>|</span>
                  )}

                  {item.type === "link" && item.url ? (
                    <a
                      href={normalizeHref(item.url)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#000000",
                        textDecoration: "underline",
                      }}
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span style={{ color: "#000000" }}>{item.value}</span>
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
                fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                fontSize: "11px",
                color: "#000000",
                lineHeight: "1.4",
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
                  {/* Row 1: Institution (Bold) + Location (Right) */}
                  <div
                    className="resume-flex-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        color: "#000000",
                      }}
                    >
                      {ed.school || "Institution"}
                    </span>

                    <span
                      style={{
                        fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                        fontSize: "11.5px",
                        color: "#000000",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ed.location}
                    </span>
                  </div>

                  {/* Row 2: Degree (Italic) + Dates (Italic, Right) */}
                  <div
                    className="resume-flex-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                        fontSize: "11px",
                        fontStyle: "italic",
                        color: "#000000",
                      }}
                    >
                      {ed.degree}
                    </span>

                    <span
                      style={{
                        fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                        fontSize: "11px",
                        fontStyle: "italic",
                        color: "#000000",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ed.dates}
                    </span>
                  </div>

                  {/* Coursework */}
                  {ed.coursework && (
                    <p
                      style={{
                        fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                        fontSize: "10.5px",
                        color: "#000000",
                        margin: "2px 0 0 0",
                      }}
                    >
                      <em>Relevant Coursework: </em>
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
                    {/* Row 1: Job Title (Bold) + Dates (Right) */}
                    <div
                      className="resume-flex-row"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          color: "#000000",
                        }}
                      >
                        {ex.title || "Job Title"}
                      </span>

                      <span
                        style={{
                          fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                          fontSize: "11.5px",
                          color: "#000000",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ex.dates}
                      </span>
                    </div>

                    {/* Row 2: Company (Italic) + Location (Italic, Right) */}
                    <div
                      className="resume-flex-row"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                          fontSize: "11px",
                          fontStyle: "italic",
                          color: "#000000",
                        }}
                      >
                        {ex.company}
                      </span>

                      <span
                        style={{
                          fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                          fontSize: "11px",
                          fontStyle: "italic",
                          color: "#000000",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ex.location}
                      </span>
                    </div>

                    {/* Bullets */}
                    {nonEmptyBullets.length > 0 && (
                      <ul
                        style={{
                          margin: "2px 0 0 0",
                          paddingLeft: "18px",
                          listStyleType: "disc",
                        }}
                      >
                        {nonEmptyBullets.map((bullet, bulletIndex) => (
                          <li
                            key={`experience-${index}-bullet-${bulletIndex}`}
                            style={{
                              fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                              fontSize: "10.5px",
                              color: "#000000",
                              lineHeight: "1.35",
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
                    {/* Row 1: Title (Bold) | Tech (Italic) + Dates (Right) */}
                    <div
                      className="resume-flex-row"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                          fontSize: "11.5px",
                          color: "#000000",
                        }}
                      >
                        <strong style={{ fontWeight: "700" }}>{proj.title || "Project"}</strong>

                        {proj.technologies && (
                          <span
                            style={{
                              fontWeight: "400",
                              fontStyle: "italic",
                              color: "#000000",
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
                                fontSize: "10.5px",
                                color: "#000000",
                                textDecoration: "underline",
                                fontWeight: "400",
                                fontStyle: "normal",
                              }}
                            >
                              {proj.linkText || proj.links}
                            </a>
                          </>
                        )}
                      </div>

                      <span
                        style={{
                          fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                          fontSize: "11px",
                          color: "#000000",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {proj.dates}
                      </span>
                    </div>

                    {/* Project bullets */}
                    {nonEmptyBullets.length > 0 && (
                      <ul
                        style={{
                          margin: "2px 0 0 0",
                          paddingLeft: "18px",
                          listStyleType: "disc",
                        }}
                      >
                        {nonEmptyBullets.map((bullet, bulletIndex) => (
                          <li
                            key={`project-${index}-bullet-${bulletIndex}`}
                            style={{
                              fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                              fontSize: "10.5px",
                              color: "#000000",
                              lineHeight: "1.35",
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
                        fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                        fontSize: "10.5px",
                        color: "#000000",
                        margin: "2px 0",
                        lineHeight: "1.4",
                      }}
                    >
                      {s.category && (
                        <strong style={{ fontWeight: "700", color: "#000000" }}>
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
                    fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                    fontSize: "10.5px",
                    color: "#000000",
                    margin: "2px 0",
                    lineHeight: "1.4",
                  }}
                >
                  <strong style={{ fontWeight: "700", color: "#000000" }}>
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
                          color: "#000000",
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
                margin: "2px 0 0 0",
                paddingLeft: "18px",
                listStyleType: "disc",
              }}
            >
              {achievements.map((achievement, index) => (
                <li
                  key={`achievement-${index}-${achievement.id || "item"}`}
                  style={{
                    fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                    fontSize: "10.5px",
                    color: "#000000",
                    lineHeight: "1.35",
                    marginBottom: "1px",
                  }}
                >
                  <strong style={{ fontWeight: "700", color: "#000000" }}>
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
                            fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                            fontSize: "10.5px",
                            color: "#000000",
                            margin: "2px 0",
                            lineHeight: "1.4",
                          }}
                        >
                          {/* Text */}
                          {field.type === "text" && (
                            <p style={{ margin: 0 }}>
                              <strong style={{ fontWeight: "700", color: "#000000" }}>
                                {field.label}:{" "}
                              </strong>
                              {field.value}
                            </p>
                          )}

                          {/* Textarea */}
                          {field.type === "textarea" && (
                            <div style={{ margin: "2px 0" }}>
                              <strong style={{ fontWeight: "700", color: "#000000" }}>
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
                              <strong style={{ fontWeight: "700", color: "#000000" }}>
                                {field.label}:{" "}
                              </strong>

                              <a
                                href={normalizeHref(
                                  field.href || field.value
                                )}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#000000",
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
      </div>
    </div>
    </>
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
   SECTION HEADING (Jake Ryan Overleaf style: UPPERCASE + full width line rule)
========================================================= */

function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{ marginTop: "10px", marginBottom: "4px" }}>
      <h2
        style={{
          fontFamily: "'Times New Roman', Times, 'Georgia', serif",
          fontSize: "11.5px",
          fontWeight: "700",
          textTransform: "uppercase",
          color: "#000000",
          letterSpacing: "0.05em",
          margin: "0 0 2px 0",
          padding: 0,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "#000000",
          margin: "0 0 4px 0",
          padding: 0,
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