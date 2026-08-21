"use client";

import type { ResumeData } from "../page";

type ResumePreviewProps = {
  data: ResumeData;
};

/* =========================================================
   SAFE TEXT
========================================================= */

function safeText(value: any): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(safeText)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return safeText(
      value.name ??
        value.value ??
        value.text ??
        value.title ??
        value.label ??
        value.content ??
        ""
    );
  }

  return "";
}

/* =========================================================
   SKILL GROUPING
========================================================= */

function groupSkills(skills: any[]) {
  const groups: Record<string, string[]> = {};

  for (const skill of skills) {
    const name = safeText(
      typeof skill === "string"
        ? skill
        : skill?.name
    ).trim();

    if (!name) {
      continue;
    }

    const category =
      safeText(
        typeof skill === "string"
          ? "Technical"
          : skill?.category
      ).trim() || "Technical";

    if (!groups[category]) {
      groups[category] = [];
    }

    /*
     * Prevent duplicate skills
     */
    const alreadyExists =
      groups[category].some(
        (existingSkill) =>
          existingSkill.toLowerCase() ===
          name.toLowerCase()
      );

    if (!alreadyExists) {
      groups[category].push(name);
    }
  }

  return groups;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ResumePreview({
  data,
}: ResumePreviewProps) {
  const personal =
    data?.personal || {};

  const education =
    data?.education || {};

  const experience =
    data?.experience || {};

  const projects =
    Array.isArray(data?.projects)
      ? data.projects
      : [];

  const skills =
    Array.isArray(data?.skills)
      ? data.skills
      : [];

  const certifications =
    Array.isArray(
      data?.certifications
    )
      ? data.certifications
      : [];

  const achievements =
    Array.isArray(
      data?.achievements
    )
      ? data.achievements
      : [];

  /* =========================================================
     GROUP SKILLS
  ========================================================= */

  const groupedSkills =
    groupSkills(skills);

  const skillCategories =
    Object.keys(groupedSkills);

  /* =========================================================
     VALID PROJECTS
  ========================================================= */

  const validProjects =
    projects.filter(
      (project: any) =>
        safeText(
          project?.name
        ) ||
        safeText(
          project?.description
        ) ||
        safeText(
          project?.technologies
        ) ||
        (Array.isArray(
          project?.bullets
        ) &&
          project.bullets.length >
            0) ||
        safeText(
          project?.projectLink
        ) ||
        safeText(
          project?.githubLink
        )
    );

  /* =========================================================
     VALID CERTIFICATIONS
  ========================================================= */

  const validCertifications =
    certifications.filter(
      (certification: any) =>
        safeText(
          certification?.name
        ) ||
        safeText(
          certification?.organization
        ) ||
        safeText(
          certification?.issueDate
        ) ||
        safeText(
          certification?.credentialId
        ) ||
        safeText(
          certification?.credentialUrl
        )
    );

  /* =========================================================
     VALID ACHIEVEMENTS
  ========================================================= */

  const validAchievements =
    achievements.filter(
      (achievement: any) =>
        safeText(
          achievement?.title
        ) ||
        safeText(
          achievement?.organization
        ) ||
        safeText(
          achievement?.date
        ) ||
        safeText(
          achievement?.description
        )
    );

  /* =========================================================
     EDUCATION CHECK
  ========================================================= */

  const hasEducation =
    safeText(
      education.institution
    ) ||
    safeText(
      education.location
    ) ||
    safeText(
      education.degree
    ) ||
    safeText(
      education.dates
    );

  /* =========================================================
     EXPERIENCE CHECK
  ========================================================= */

  const hasExperience =
    safeText(
      experience.company
    ) ||
    safeText(
      experience.role
    ) ||
    safeText(
      experience.location
    ) ||
    safeText(
      experience.startDate
    ) ||
    safeText(
      experience.endDate
    ) ||
    safeText(
      experience.description
    );

  /* =========================================================
     NAME
  ========================================================= */

  const name =
    safeText(
      personal.name
    ) || "Your Name";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section className="bg-white text-black">
      <div className="bg-white text-black overflow-hidden">

        <div className="p-8 sm:p-10 md:p-12 max-w-[850px] mx-auto">

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <header className="text-center border-b border-gray-300 pb-5">

            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide">
              {name}
            </h1>

            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-gray-600">

              {safeText(
                personal.phone
              ) && (
                <span>
                  {safeText(
                    personal.phone
                  )}
                </span>
              )}

              {safeText(
                personal.email
              ) && (
                <a
                  href={`mailto:${safeText(
                    personal.email
                  )}`}
                  className="hover:underline"
                >
                  {safeText(
                    personal.email
                  )}
                </a>
              )}

              {safeText(
                personal.linkedin
              ) && (
                <a
                  href={
                    safeText(
                      personal.linkedin
                    ).startsWith(
                      "http"
                    )
                      ? safeText(
                          personal.linkedin
                        )
                      : `https://linkedin.com/in/${safeText(
                          personal.linkedin
                        )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  LinkedIn
                </a>
              )}

              {safeText(
                personal.github
              ) && (
                <a
                  href={
                    safeText(
                      personal.github
                    ).startsWith(
                      "http"
                    )
                      ? safeText(
                          personal.github
                        )
                      : `https://github.com/${safeText(
                          personal.github
                        )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  GitHub
                </a>
              )}

            </div>
          </header>

          {/* =================================================
              EDUCATION
          ================================================= */}

          {hasEducation && (
            <section className="mt-6">

              <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
                Education
              </h2>

              <div className="mt-3">

                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">

                  <div>

                    {safeText(
                      education.institution
                    ) && (
                      <h3 className="font-bold">
                        {safeText(
                          education.institution
                        )}
                      </h3>
                    )}

                    {safeText(
                      education.degree
                    ) && (
                      <p className="italic text-sm">
                        {safeText(
                          education.degree
                        )}
                      </p>
                    )}

                  </div>

                  <div className="text-sm text-gray-600 sm:text-right">

                    {safeText(
                      education.location
                    ) && (
                      <div>
                        {safeText(
                          education.location
                        )}
                      </div>
                    )}

                    {safeText(
                      education.dates
                    ) && (
                      <div>
                        {safeText(
                          education.dates
                        )}
                      </div>
                    )}

                  </div>

                </div>

              </div>
            </section>
          )}

          {/* =================================================
              EXPERIENCE
          ================================================= */}

          {hasExperience && (
            <section className="mt-6">

              <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
                Experience
              </h2>

              <div className="mt-3">

                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">

                  <div>

                    {safeText(
                      experience.role
                    ) && (
                      <h3 className="font-bold">
                        {safeText(
                          experience.role
                        )}
                      </h3>
                    )}

                    {safeText(
                      experience.company
                    ) && (
                      <p className="italic text-sm">
                        {safeText(
                          experience.company
                        )}
                      </p>
                    )}

                  </div>

                  <div className="text-sm text-gray-600 sm:text-right">

                    {safeText(
                      experience.location
                    ) && (
                      <div>
                        {safeText(
                          experience.location
                        )}
                      </div>
                    )}

                    {(safeText(
                      experience.startDate
                    ) ||
                      safeText(
                        experience.endDate
                      )) && (
                      <div>

                        {safeText(
                          experience.startDate
                        )}

                        {safeText(
                          experience.startDate
                        ) &&
                        safeText(
                          experience.endDate
                        )
                          ? " - "
                          : ""}

                        {safeText(
                          experience.endDate
                        )}

                      </div>
                    )}

                  </div>

                </div>

                {safeText(
                  experience.description
                ) && (
                  <ul className="mt-2 list-disc ml-5 text-sm leading-6">

                    <li>
                      {safeText(
                        experience.description
                      )}
                    </li>

                  </ul>
                )}

              </div>
            </section>
          )}

          {/* =================================================
              PROJECTS
          ================================================= */}

          {validProjects.length >
            0 && (
            <section className="mt-6">

              <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
                Projects
              </h2>

              <div className="mt-3 space-y-4">

                {validProjects.map(
                  (
                    project: any,
                    index
                  ) => (
                    <div
                      key={index}
                    >

                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">

                        <div>

                          {safeText(
                            project.name
                          ) && (
                            <h3 className="font-bold">
                              {safeText(
                                project.name
                              )}
                            </h3>
                          )}

                          {safeText(
                            project.technologies
                          ) && (
                            <p className="text-sm italic text-gray-600">
                              {safeText(
                                project.technologies
                              )}
                            </p>
                          )}

                        </div>

                        <div className="flex gap-3 text-sm">

                          {safeText(
                            project.projectLink
                          ) && (
                            <a
                              href={
                                safeText(
                                  project.projectLink
                                ).startsWith(
                                  "http"
                                )
                                  ? safeText(
                                      project.projectLink
                                    )
                                  : `https://${safeText(
                                      project.projectLink
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Project
                            </a>
                          )}

                          {safeText(
                            project.githubLink
                          ) && (
                            <a
                              href={
                                safeText(
                                  project.githubLink
                                ).startsWith(
                                  "http"
                                )
                                  ? safeText(
                                      project.githubLink
                                    )
                                  : `https://github.com/${safeText(
                                      project.githubLink
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              GitHub
                            </a>
                          )}

                        </div>

                      </div>

                      {safeText(
                        project.description
                      ) && (
                        <p className="mt-1 text-sm leading-6">
                          {safeText(
                            project.description
                          )}
                        </p>
                      )}

                      {Array.isArray(
                        project.bullets
                      ) &&
                        project.bullets
                          .map(
                            safeText
                          )
                          .filter(
                            Boolean
                          ).length >
                          0 && (
                          <ul className="mt-1 list-disc ml-5 text-sm leading-6">

                            {project.bullets
                              .map(
                                (
                                  bullet: any,
                                  bulletIndex: number
                                ) => (
                                  <li
                                    key={
                                      bulletIndex
                                    }
                                  >
                                    {safeText(
                                      bullet
                                    )}
                                  </li>
                                )
                              )}

                          </ul>
                        )}

                    </div>
                  )
                )}

              </div>
            </section>
          )}

          {/* =================================================
              SKILLS
              
              IMPORTANT:
              Skills are now GROUPED by category.
              
              OLD:
              Technical: Java
              Technical: Python
              
              NEW:
              Technical: Java, Python
          ================================================= */}

          {skillCategories.length >
            0 && (
            <section className="mt-6">

              <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
                Skills
              </h2>

              <div className="mt-3 space-y-1.5 text-sm">

                {skillCategories.map(
                  (
                    category
                  ) => (
                    <div
                      key={
                        category
                      }
                      className="leading-6"
                    >

                      <span className="font-bold">
                        {category}:
                      </span>{" "}

                      <span>
                        {groupedSkills[
                          category
                        ].join(", ")}
                      </span>

                    </div>
                  )
                )}

              </div>

            </section>
          )}

          {/* =================================================
              CERTIFICATIONS
          ================================================= */}

          {validCertifications.length >
            0 && (
            <section className="mt-6">

              <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
                Certifications
              </h2>

              <div className="mt-3 space-y-3">

                {validCertifications.map(
                  (
                    certification: any,
                    index
                  ) => (
                    <div
                      key={index}
                    >

                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">

                        <div>

                          {safeText(
                            certification.name
                          ) && (
                            <h3 className="font-bold">
                              {safeText(
                                certification.name
                              )}
                            </h3>
                          )}

                          {safeText(
                            certification.organization
                          ) && (
                            <p className="text-sm">
                              {safeText(
                                certification.organization
                              )}
                            </p>
                          )}

                        </div>

                        {safeText(
                          certification.issueDate
                        ) && (
                          <span className="text-sm text-gray-600">
                            {safeText(
                              certification.issueDate
                            )}
                          </span>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>

            </section>
          )}

          {/* =================================================
              ACHIEVEMENTS
          ================================================= */}

          {validAchievements.length >
            0 && (
            <section className="mt-6">

              <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1">
                Achievements
              </h2>

              <div className="mt-3 space-y-3">

                {validAchievements.map(
                  (
                    achievement: any,
                    index
                  ) => (
                    <div
                      key={index}
                    >

                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">

                        <div>

                          {safeText(
                            achievement.title
                          ) && (
                            <h3 className="font-bold">
                              {safeText(
                                achievement.title
                              )}
                            </h3>
                          )}

                          {safeText(
                            achievement.organization
                          ) && (
                            <p className="text-sm">
                              {safeText(
                                achievement.organization
                              )}
                            </p>
                          )}

                        </div>

                        {safeText(
                          achievement.date
                        ) && (
                          <span className="text-sm text-gray-600">
                            {safeText(
                              achievement.date
                            )}
                          </span>
                        )}

                      </div>

                      {safeText(
                        achievement.description
                      ) && (
                        <p className="mt-1 text-sm leading-6">
                          {safeText(
                            achievement.description
                          )}
                        </p>
                      )}

                    </div>
                  )
                )}

              </div>

            </section>
          )}

        </div>
      </div>
    </section>
  );
}