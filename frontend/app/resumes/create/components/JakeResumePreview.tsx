"use client";

import type { AIResumeData } from "../../../../lib/aiResumeUtils";

type Props = {
  data: AIResumeData;
};

const clean = (value: string) => value.trim();

export default function JakeResumePreview({ data }: Props) {
  const hasSkills =
    data.technical_skills.languages.length ||
    data.technical_skills.frameworks.length ||
    data.technical_skills.developer_tools.length ||
    data.technical_skills.libraries.length;

  return (
    <div className="w-full bg-white text-black font-serif">
      <div className="mx-auto w-full max-w-[850px] px-7 py-8 sm:px-10 sm:py-9 md:px-12">
        {/* Jake-style header */}
        <header className="text-center">
          <h1 className="text-[28px] sm:text-[32px] leading-none font-bold">
            {data.personal.name || "Your Name"}
          </h1>
          <div className="mt-1.5 text-[11px] sm:text-xs leading-5">
            {[
              data.personal.phone,
              data.personal.email,
              data.personal.linkedin,
              data.personal.github,
            ]
              .filter(Boolean)
              .map((item, index, items) => (
                <span key={`${item}-${index}`}>
                  {index > 0 && " | "}
                  {item}
                </span>
              ))}
          </div>
        </header>

        <Section title="Education">
          {data.education.map((edu, index) => (
            <Subheading
              key={`edu-${index}`}
              left={edu.institution}
              right={edu.dates}
              subLeft={edu.degree}
              subRight={edu.location}
            />
          ))}
        </Section>

        <Section title="Experience">
          {data.experience.map((exp, index) => (
            <div key={`exp-${index}`} className="mb-2.5 last:mb-0">
              <Subheading
                left={exp.job_title || exp.company}
                right={exp.dates}
                subLeft={exp.company}
                subRight={exp.location}
              />
              {exp.bullets.length > 0 && (
                <ul className="mt-0.5 ml-5 list-disc text-[10.5px] sm:text-[11px] leading-[1.35]">
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <li key={`exp-${index}-bullet-${bulletIndex}`}>
                      {clean(bullet)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>

        <Section title="Projects">
          {data.projects.map((project, index) => (
            <div key={`project-${index}`} className="mb-2.5 last:mb-0">
              <div className="flex items-baseline justify-between gap-3 text-[11px] sm:text-xs leading-4">
                <div className="min-w-0">
                  <span className="font-bold">{project.name}</span>
                  {project.technologies.length > 0 && (
                    <>
                      <span className="mx-1">|</span>
                      <span className="italic">
                        {project.technologies.join(", ")}
                      </span>
                    </>
                  )}
                </div>
                <span className="shrink-0">{project.dates}</span>
              </div>
              {project.bullets.length > 0 && (
                <ul className="mt-0.5 ml-5 list-disc text-[10.5px] sm:text-[11px] leading-[1.35]">
                  {project.bullets.map((bullet, bulletIndex) => (
                    <li key={`project-${index}-bullet-${bulletIndex}`}>
                      {clean(bullet)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>

        {(data.certifications.length > 0 || data.achievements.length > 0) && (
          <Section title="Additional Information">
            {data.certifications.length > 0 && (
              <div className="text-[10.5px] sm:text-[11px] leading-[1.4]">
                <span className="font-bold">Certifications:</span>{" "}
                {data.certifications
                  .map((item) =>
                    [item.name, item.organization, item.issue_date]
                      .filter(Boolean)
                      .join(" — ")
                  )
                  .join("; ")}
              </div>
            )}
            {data.achievements.length > 0 && (
              <ul className="mt-1 ml-5 list-disc text-[10.5px] sm:text-[11px] leading-[1.4]">
                {data.achievements.map((item, index) => (
                  <li key={`achievement-${index}`}>
                    <span className="font-bold">{item.title}</span>
                    {item.organization ? ` — ${item.organization}` : ""}
                    {item.description ? `: ${item.description}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {hasSkills ? (
          <Section title="Technical Skills">
            <div className="text-[10.5px] sm:text-[11px] leading-[1.45]">
              {data.technical_skills.languages.length > 0 && (
                <p>
                  <span className="font-bold">Languages:</span>{" "}
                  {data.technical_skills.languages.join(", ")}
                </p>
              )}
              {data.technical_skills.frameworks.length > 0 && (
                <p>
                  <span className="font-bold">Frameworks:</span>{" "}
                  {data.technical_skills.frameworks.join(", ")}
                </p>
              )}
              {data.technical_skills.developer_tools.length > 0 && (
                <p>
                  <span className="font-bold">Developer Tools:</span>{" "}
                  {data.technical_skills.developer_tools.join(", ")}
                </p>
              )}
              {data.technical_skills.libraries.length > 0 && (
                <p>
                  <span className="font-bold">Libraries:</span>{" "}
                  {data.technical_skills.libraries.join(", ")}
                </p>
              )}
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 sm:mt-5">
      <h2 className="border-b border-black pb-0.5 text-[14px] sm:text-[15px] uppercase tracking-wide">
        {title}
      </h2>
      <div className="pt-1.5">{children}</div>
    </section>
  );
}

function Subheading({
  left,
  right,
  subLeft,
  subRight,
}: {
  left: string;
  right: string;
  subLeft: string;
  subRight: string;
}) {
  return (
    <div className="mb-1.5 text-[11px] sm:text-xs leading-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold">{left}</span>
        <span className="shrink-0">{right}</span>
      </div>
      <div className="flex items-baseline justify-between gap-3 italic">
        <span>{subLeft}</span>
        <span className="shrink-0">{subRight}</span>
      </div>
    </div>
  );
}