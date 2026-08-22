"use client";


import {
  ResumeData,
  SkillGroup,
  CustomSection,
  CustomSectionField,
} from "../../../../lib/resume";
import JakeResumePreview from "../../../components/resume/JakeResumePreview";
/* =========================================================
   AI DATA TYPE
========================================================= */

type AIResumeData = {
  personal?: {
    name?: string;
    phone?: string;
    email?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    location?: string;
    position?: string;
  };

  summary?: string;
  professional_summary?: string;

  education?: Array<{
    institution?: string;
    school?: string;
    location?: string;
    degree?: string;
    dates?: string;
    startDate?: string;
    endDate?: string;
    coursework?: string;
  }>;

  experience?: Array<{
    company?: string;
    role?: string;
    title?: string;
    job_title?: string;
    location?: string;
    dates?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    bullets?: string[];
  }>;

  projects?: Array<{
    name?: string;
    title?: string;
    description?: string;
    technologies?: string | string[];
    dates?: string;
    projectLink?: string;
    githubLink?: string;
    links?: string;
    bullets?: string[];
  }>;

  skills?: Array<{
    name?: string;
    category?: string;
  }>;

  technical_skills?: {
    languages?: string[];
    frameworks?: string[];
    developer_tools?: string[];
    libraries?: string[];
  };

  certifications?: Array<{
    name?: string;
    organization?: string;
    issueDate?: string;
    issue_date?: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;

  achievements?: Array<{
    title?: string;
    organization?: string;
    date?: string;
    description?: string;
  }>;

  customSections?: CustomSection[];
};

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeBullets(
  bullets: unknown,
  description?: unknown
): string[] {
  if (Array.isArray(bullets)) {
    return bullets
      .map((item) => clean(item))
      .filter(Boolean);
  }

  const text = clean(description);

  if (!text) {
    return [];
  }

  return text
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeTechnologies(
  technologies: unknown
): string {
  if (Array.isArray(technologies)) {
    return technologies
      .map((item) => clean(item))
      .filter(Boolean)
      .join(", ");
  }

  return clean(technologies);
}

function normalizeDates(
  dates?: unknown,
  startDate?: unknown,
  endDate?: unknown
): string {
  const direct = clean(dates);

  if (direct) {
    return direct;
  }

  const start = clean(startDate);
  const end = clean(endDate);

  if (start && end) {
    return `${start} - ${end}`;
  }

  return start || end;
}

/* =========================================================
   EDUCATION
========================================================= */

function convertEducation(
  data: AIResumeData
): ResumeData["education"] {
  if (!Array.isArray(data.education)) {
    return [];
  }

  return data.education
    .filter(Boolean)
    .map((education, index) => ({
      id: makeId("education", index),

      school:
        clean(education.school) ||
        clean(education.institution),

      degree: clean(
        education.degree
      ),

      location: clean(
        education.location
      ),

      dates: normalizeDates(
        education.dates,
        education.startDate,
        education.endDate
      ),

      coursework: clean(
        education.coursework
      ),
    }));
}

/* =========================================================
   EXPERIENCE
========================================================= */

function convertExperience(
  data: AIResumeData
): ResumeData["experience"] {
  if (!Array.isArray(data.experience)) {
    return [];
  }

  return data.experience
    .filter(Boolean)
    .map((experience, index) => ({
      id: makeId("experience", index),

      company: clean(
        experience.company
      ),

      title:
        clean(experience.title) ||
        clean(experience.role) ||
        clean(experience.job_title),

      location: clean(
        experience.location
      ),

      dates: normalizeDates(
        experience.dates,
        experience.startDate,
        experience.endDate
      ),

      bullets: normalizeBullets(
        experience.bullets,
        experience.description
      ),
    }));
}

/* =========================================================
   PROJECTS
========================================================= */

function convertProjects(
  data: AIResumeData
): ResumeData["projects"] {
  if (!Array.isArray(data.projects)) {
    return [];
  }

  return data.projects
    .filter(Boolean)
    .map((project, index) => ({
      id: makeId("project", index),

      title:
        clean(project.title) ||
        clean(project.name),

      technologies:
        normalizeTechnologies(
          project.technologies
        ),

      dates: clean(
        project.dates
      ),

      links:
        clean(project.links) ||
        clean(project.githubLink) ||
        clean(project.projectLink),

      bullets: normalizeBullets(
        project.bullets,
        project.description
      ),
    }));
}

/* =========================================================
   SKILLS
========================================================= */

function convertSkills(
  data: AIResumeData
): ResumeData["skills"] {
  const result: ResumeData["skills"] = [];

  const addGroup = (
    values: unknown,
    category: string
  ) => {
    if (!Array.isArray(values)) {
      return;
    }

    const items = values
      .map((item) => clean(item))
      .filter(Boolean);

    if (items.length === 0) {
      return;
    }

    result.push({
      id: makeId("skill", result.length),
      category,
      items: items.join(", "),
    });
  };

  /* AI technical skills */

  if (data.technical_skills) {
    addGroup(
      data.technical_skills.languages,
      "Languages"
    );

    addGroup(
      data.technical_skills.frameworks,
      "Frameworks"
    );

    addGroup(
      data.technical_skills.developer_tools,
      "Developer Tools"
    );

    addGroup(
      data.technical_skills.libraries,
      "Libraries"
    );
  }

  /* Generic skills */

  if (Array.isArray(data.skills)) {
    const grouped =
      new Map<string, string[]>();

    data.skills.forEach((skill) => {
      const name = clean(skill?.name);

      if (!name) {
        return;
      }

      const category =
        clean(skill?.category) ||
        "Skills";

      const existing =
        grouped.get(category) ?? [];

      if (
        !existing.some(
          (item) =>
            item.toLowerCase() ===
            name.toLowerCase()
        )
      ) {
        existing.push(name);
      }

      grouped.set(category, existing);
    });

    grouped.forEach(
      (items, category) => {
        if (items.length === 0) {
          return;
        }

        const alreadyExists =
          result.some(
            (group) =>
              group.category.toLowerCase() ===
              category.toLowerCase()
          );

        if (!alreadyExists) {
          result.push({
            id: makeId(
              "skill",
              result.length
            ),
            category,
            items: items.join(", "),
          });
        }
      }
    );
  }

  return result;
}

/* =========================================================
   CERTIFICATIONS
========================================================= */

function convertCertifications(
  data: AIResumeData
): CustomSection | null {
  if (
    !Array.isArray(data.certifications) ||
    data.certifications.length === 0
  ) {
    return null;
  }

  const fields: CustomSectionField[] =
    data.certifications
      .filter(Boolean)
      .map((certification, index) => ({
        id: makeId(
          "certification",
          index
        ),

        type: "text",

        label: clean(
          certification.name
        ),

        value: [
          clean(
            certification.organization
          ),
          clean(
            certification.issueDate
          ) ||
            clean(
              certification.issue_date
            ),
          clean(
            certification.credentialId
          ),
        ]
          .filter(Boolean)
          .join(" — "),

        href: clean(
          certification.credentialUrl
        ) || undefined,
      }));

  if (fields.length === 0) {
    return null;
  }

  return {
    id: makeId("section", 0),
    title: "Certifications",
    fields,
  };
}

/* =========================================================
   ACHIEVEMENTS
========================================================= */

function convertAchievements(
  data: AIResumeData
): CustomSection | null {
  if (
    !Array.isArray(data.achievements) ||
    data.achievements.length === 0
  ) {
    return null;
  }

  const fields: CustomSectionField[] =
    data.achievements
      .filter(Boolean)
      .map((achievement, index) => ({
        id: makeId(
          "achievement",
          index
        ),

        type: "text",

        label: clean(
          achievement.title
        ),

        value: [
          clean(
            achievement.organization
          ),
          clean(
            achievement.date
          ),
          clean(
            achievement.description
          ),
        ]
          .filter(Boolean)
          .join(" — "),
      }));

  if (fields.length === 0) {
    return null;
  }

  return {
    id: makeId("section", 1),
    title: "Achievements",
    fields,
  };
}

/* =========================================================
   CUSTOM SECTIONS
========================================================= */

function convertCustomSections(
  data: AIResumeData
): CustomSection[] {
  const sections: CustomSection[] = [];

  if (Array.isArray(data.customSections)) {
    sections.push(
      ...data.customSections
    );
  }

  const certifications =
    convertCertifications(data);

  if (certifications) {
    sections.push(certifications);
  }

  const achievements =
    convertAchievements(data);

  if (achievements) {
    sections.push(achievements);
  }

  return sections;
}

/* =========================================================
   MAIN CONVERSION
========================================================= */

function convertToJakeData(
  data: AIResumeData
): ResumeData {
  const personal =
    data.personal ?? {};

  return {
    header: {
      fullName: clean(
        personal.name
      ),

      position: clean(
        personal.position
      ),

      phone: clean(
        personal.phone
      ),

      email: clean(
        personal.email
      ),

      location: clean(
        personal.location
      ),

      links: {
        linkedin: clean(
          personal.linkedin
        ),

        github: clean(
          personal.github
        ),

        portfolio: clean(
          personal.portfolio
        ),
      },
    },

    education:
      convertEducation(data),

    experience:
      convertExperience(data),

    projects:
      convertProjects(data),

    skills:
      convertSkills(data),

    customSections:
      convertCustomSections(data),
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AIJakePreview({
  data,
}: {
  data: AIResumeData;
}) {
  const resumeData =
    convertToJakeData(data);

  return (
    <JakeResumePreview
      data={resumeData}
    />
  );
}