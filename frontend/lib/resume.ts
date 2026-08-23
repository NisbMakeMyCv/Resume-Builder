/**
 * Jake's Resume Template — data model.
 *
 * Frontend-only, persisted to localStorage (the backend has no resume
 * endpoints yet, so nothing is uploaded). Each resume is one plain object
 * that mirrors the Jake template's four sections + rich header, making both
 * the builder forms and the live preview trivially derivable from it.
 */

/* =========================================================
   TYPES (per Jake's Resume Template)
   ========================================================= */

export type ContactLink = {
  label: string;
  value: string;
};

export type ResumeHeader = {
  fullName: string;
  position: string;
  phone: string;
  email: string;
  location: string;
  links: {
    linkedin: string;
    linkedinText?: string;
    github: string;
    githubText?: string;
    portfolio: string;
    portfolioText?: string;
  };
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  location: string;
  dates: string;
  coursework: string;
};

export type Experience = {
  id: string;
  company: string;
  title: string;
  location: string;
  dates: string;
  bullets: string[];
};

export type Project = {
  id: string;
  title: string;
  technologies: string;
  dates: string;
  links: string;
  linkText?: string;
  bullets: string[];
};

export type SkillGroup = {
  id: string;
  category: string;
  items: string;
};

/** A single field inside a custom section. */
export type CustomSectionFieldType = "text" | "textarea" | "link";

export type CustomSectionField = {
  id: string;
  type: CustomSectionFieldType;
  label: string;
  value: string;
  /** Only used when type === "link" */
  href?: string;
};

/** A fully user-defined resume section (Certifications, Awards, Publications, etc.) */
export type CustomSection = {
  id: string;
  title: string;
  fields: CustomSectionField[];
};

/** The full Jake's Resume document. */
export type ResumeData = {
  header: ResumeHeader;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: SkillGroup[];
  customSections: CustomSection[];
};

/* =========================================================
   FACTORY + PERSISTENCE
   ========================================================= */

const STORAGE_KEY = "makemycv_resume_jake";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** A fresh, empty Jake resume. */
export function emptyResume(): ResumeData {
  return {
    header: {
      fullName: "",
      position: "",
      phone: "",
      email: "",
      location: "",
      links: { linkedin: "", github: "", portfolio: "", linkedinText: "", githubText: "", portfolioText: "" },
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    customSections: [],
  };
}

/** A resume pre-filled with placeholder content so the preview never looks bare. */
export function sampleResume(): ResumeData {
  return {
    header: {
      fullName: "Alex Morgan",
      position: "Full-Stack Engineer",
      phone: "(555) 867-5309",
      email: "alex.morgan@email.com",
      location: "San Francisco, CA",
      links: {
        linkedin: "linkedin.com/in/alexmorgan",
        github: "github.com/alexmorgan",
        portfolio: "alexmorgan.dev",
      },
    },
    education: [
      {
        id: uid(),
        school: "University of California, Berkeley",
        degree: "B.S. Computer Science",
        location: "Berkeley, CA",
        dates: "2018 – 2022",
        coursework:
          "Data Structures, Algorithms, Operating Systems, Web Development",
      },
    ],
    experience: [
      {
        id: uid(),
        company: "Northwind Systems",
        title: "Full-Stack Engineer",
        location: "Remote",
        dates: "2022 – Present",
        bullets: [
          "Built a React + Node.js platform serving 10k+ monthly users.",
          "Cut API response times 40% by adding a caching layer.",
          "Led a 3-engineer squad shipping quarterly feature releases.",
        ],
      },
    ],
    projects: [
      {
        id: uid(),
        title: "GitRater",
        technologies: "React, TypeScript, FastAPI, PostgreSQL",
        dates: "Jan 2024 – Present",
        links: "github.com/alexmorgan/gitrater",
        bullets: [
          "Analyzes public GitHub repos and generates resume-ready bullets.",
          "Consumes a REST API returning structured project insights.",
        ],
      },
    ],
    skills: [
      {
        id: uid(),
        category: "Languages",
        items: "TypeScript, Python, Go, SQL",
      },
      {
        id: uid(),
        category: "Frameworks",
        items: "React, Next.js, Node.js, FastAPI, Django",
      },
      {
        id: uid(),
        category: "Developer Tools",
        items: "Git, Docker, AWS, PostgreSQL",
      },
    ],
    customSections: [],
  };
}

export function loadResume(): ResumeData {
  if (typeof window === "undefined") return emptyResume();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResumeData) : sampleResume();
  } catch {
    return sampleResume();
  }
}

export function saveResume(data: ResumeData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage may be full or blocked — resume still works in memory */
  }
}

/** Split comma-separated text into trimmed, non-empty parts for the preview. */
export function toList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}