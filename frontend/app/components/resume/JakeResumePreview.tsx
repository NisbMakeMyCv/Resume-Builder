"use client";

import type { ResumeData, SkillGroup } from "../../../lib/resume";

/**
 * Live preview — renders the current resume data styled strictly after
 * Jake's Resume Template:
 *
 *  - Serif headline (Baskerville, Georgia fallback), centered name + position
 *  - Uppercase, letter-spaced, navy-blue section headings
 *  - Full-width horizontal rules between the header and each section
 *  - Compact margins, two-column skills layout
 *  - Distinguishable clickable links (underline + inline accent color)
 *
 * This is intentionally independent of the app design system so the PDF-like
 * print style stays true to the template. Out of print scope on purpose.
 */
export default function JakeResumePreview({
  data,
  className = "",
}: {
  data: ResumeData;
  className?: string;
}) {
  const { header, education, experience, projects, skills } = data;

  return (
    <div
      className={`bg-white text-gray-900 w-full ${className}`}
      style={{ fontFamily: "'Baskerville', 'Palatino Linotype', Georgia, serif" }}
    >
      <div className="px-10 py-9" style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* ===== Header ===== */}
        <header className="text-center">
          <h1
            className="text-[22px] leading-tight font-semibold text-gray-900"
            style={{ fontFamily: "'Baskerville', 'Palatino Linotype', Georgia, serif" }}
          >
            {header.fullName || "Your Name"}
          </h1>
          <p className="text-[13px] text-gray-800 mt-0.5">{header.position || "Job Title"}</p>

          {/* Contact line — phone / email / location */}
          <p className="text-[11px] text-gray-900 mt-1.5">
            {[header.phone, header.email, header.location]
              .filter(Boolean)
              .join("  •  ")}
          </p>

          {/* Links — distinguishable clickable links */}
          {(header.links.linkedin ||
            header.links.github ||
            header.links.portfolio) && (
            <p className="text-[11px] mt-1 flex flex-wrap justify-center gap-x-3 gap-y-0.5">
              {header.links.linkedin && (
                <a
                  href={normalizeHref(header.links.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-[#1c3fa8] hover:text-[#16409a]"
                >
                  {header.links.linkedin}
                </a>
              )}
              {header.links.github && (
                <a
                  href={normalizeHref(header.links.github)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-[#1c3fa8] hover:text-[#16409a]"
                >
                  {header.links.github}
                </a>
              )}
              {header.links.portfolio && (
                <a
                  href={normalizeHref(header.links.portfolio)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-[#1c3fa8] hover:text-[#16409a]"
                >
                  {header.links.portfolio}
                </a>
              )}
            </p>
          )}
        </header>

        {/* ===== Education ===== */}
        {renderSection<typeof education[number]>(
          "EDUCATION",
          education,
          (ed) => (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[12px] font-semibold text-gray-900">
                  {ed.school || "Institution"}
                  <span className="font-medium text-gray-700">
                    {ed.degree && ` — ${ed.degree}`}
                  </span>
                </p>
                <p className="text-[11px] text-gray-700">
                  {[ed.dates, ed.location].filter(Boolean).join("  |  ")}
                </p>
              </div>
              {ed.coursework && (
                <p className="text-[11px] text-gray-700 mt-0.5">
                  <span className="italic">Coursework:</span> {ed.coursework}
                </p>
              )}
            </div>
          )
        )}

        {/* ===== Experience ===== */}
        {renderSection<typeof experience[number]>(
          "EXPERIENCE",
          experience,
          (ex) => (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[12px] font-semibold text-gray-900">
                  {ex.company || "Company"}
                  <span className="font-medium text-gray-700">
                    {ex.title && ` — ${ex.title}`}
                  </span>
                </p>
                <p className="text-[11px] text-gray-700">
                  {[ex.dates, ex.location].filter(Boolean).join("  |  ")}
                </p>
              </div>
              {ex.bullets.length > 0 && (
                <ul className="mt-1 list-disc pl-5 space-y-0.5">
                  {ex.bullets.map((b, i) => (
                    <li key={i} className="text-[11px] text-gray-800 leading-snug">
                      {b || "•"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        )}

        {/* ===== Projects ===== */}
        {renderSection<typeof projects[number]>(
          "PROJECTS",
          projects,
          (proj) => (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[12px] font-semibold text-gray-900">
                  {proj.title || "Project"}
                  {proj.technologies && (
                    <span className="font-medium text-gray-700">
                      {" "}
                      — {proj.technologies}
                    </span>
                  )}
                </p>
                {proj.links && (
                  <a
                    href={normalizeHref(proj.links)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] underline text-[#1c3fa8] hover:text-[#16409a]"
                  >
                    {proj.links}
                  </a>
                )}
              </div>
              {proj.bullets.length > 0 && (
                <ul className="mt-1 list-disc pl-5 space-y-0.5">
                  {proj.bullets.map((b, i) => (
                    <li key={i} className="text-[11px] text-gray-800 leading-snug">
                      {b || "•"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        )}

        {/* ===== Technical Skills ===== */}
        {skills.length > 0 && (
          <>
            <SectionDivider />
            <h2
              className="text-[12px] font-bold text-[#1c3fa8] tracking-wide uppercase"
              style={{ fontFamily: "'Baskerville', 'Palatino Linotype', Georgia, serif" }}
            >
              Technical Skills
            </h2>
            <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1">
              {skills
                .filter((s) => s.category || s.items)
                .map((s: SkillGroup) => (
                  <p key={s.id} className="text-[11px] text-gray-800 leading-snug">
                    {s.category && (
                      <span className="font-semibold text-gray-900">{s.category}: </span>
                    )}
                    {s.items}
                  </p>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   LOCAL HELPERS
   ========================================================= */

/** Uppercase, navy-blue, rule-divided section heading used by every section. */
function SectionDivider() {
  return (
    <div className="mt-4 mb-2 border-b border-gray-300" aria-hidden="true" />
  );
}

/** Convenience: render a heading + its items (with divider before each except the first rendered section). */
function renderSection<T>(
  title: string,
  items: T[],
  renderItem: (item: T) => React.ReactNode
) {
  if (!items.length) return null;

  return (
    <>
      <SectionDivider />
      <h2
        className="text-[12px] font-bold text-[#1c3fa8] tracking-wide uppercase"
        style={{ fontFamily: "'Baskerville', 'Palatino Linotype', Georgia, serif" }}
      >
        {title}
      </h2>
      <div className="mt-1.5 space-y-3">
        {items.map((item, i) => (
          <div key={(item as { id?: string }).id ?? i}>{renderItem(item)}</div>
        ))}
      </div>
    </>
  );
}

/** Allow bare domains ("github.com/u/repo") or full URLs. */
function normalizeHref(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}