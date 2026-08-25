import type { ResumeData } from "../lib/resume";

export interface ProfileExportPayload {
  profile: {
    headline: string | null;
    summary: string | null;
    location: string | null;
    dob: string | null;
    phone: string | null;
    linkedin_url: string | null;
    linkedin_text: string | null;
    github_url: string | null;
    github_text: string | null;
    portfolio_url: string | null;
    portfolio_text: string | null;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    branch: string;
    start_date: string;
    end_date: string | null;
    cgpa: number | null;
  }>;
  experience: Array<{
    id: string;
    company: string;
    designation: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
  }>;
  skills: Array<{
    id: string;
    skill_name: string;
    proficiency: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string | null;
    github_link: string | null;
    github_link_text: string | null;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    organization: string | null;
    issue_date: string | null;
    credential_id: string | null;
    credential_url: string | null;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    organization: string | null;
    date: string | null;
    description: string | null;
  }>;
}

/**
 * Strict mapping utility to translate Profile data to ResumeData format safely,
 * extracting only the shared fields and guaranteeing no extra keys disrupt the Resume Builder.
 */
export function mapProfileToResume(
  user: { full_name: string; email: string } | null,
  payload: ProfileExportPayload
): ResumeData {
  const { profile, education, experience, skills, projects, certifications, achievements } = payload;

  return {
    header: {
      fullName: user?.full_name || "",
      position: profile?.headline || "",
      phone: profile?.phone || "",
      email: user?.email || "",
      location: profile?.location || "",
      links: {
        linkedin: profile?.linkedin_url || "",
        linkedinText: profile?.linkedin_text || "",
        github: profile?.github_url || "",
        githubText: profile?.github_text || "",
        portfolio: profile?.portfolio_url || "",
        portfolioText: profile?.portfolio_text || "",
      },
    },
    education: (education || []).map((edu) => ({
      id: edu.id,
      school: edu.institution || "",
      degree: edu.degree || "",
      location: "",
      dates: `${edu.start_date ? edu.start_date.slice(0, 7) : ""} – ${
        edu.end_date ? edu.end_date.slice(0, 7) : "Present"
      }`,
      coursework: edu.cgpa ? `CGPA: ${edu.cgpa}` : "",
    })),
    experience: (experience || []).map((exp) => ({
      id: exp.id,
      company: exp.company || "",
      title: exp.designation || "",
      location: "",
      dates: `${exp.start_date ? exp.start_date.slice(0, 7) : ""} – ${
        exp.end_date ? exp.end_date.slice(0, 7) : "Present"
      }`,
      bullets: exp.description ? [exp.description] : [],
    })),
    projects: (projects || []).map((p) => ({
      id: p.id,
      title: p.title || "",
      technologies: "",
      dates: "",
      links: p.github_link || "",
      linkText: p.github_link_text || "",
      bullets: p.description ? [p.description] : [],
    })),
    skills: [
      {
        id: "profile-imported-skills",
        category: "Skills",
        items: (skills || []).map((s) => `${s.skill_name} (${s.proficiency})`).join(", "),
      },
    ],
    customSections: [
      {
        id: "profile-imported-certifications",
        title: "Certifications",
        fields: (certifications || []).map((c) => ({
          id: c.id,
          type: "link",
          label: c.name,
          value: `${c.organization || ""} (${c.issue_date || ""}) - Credential ID: ${c.credential_id || ""}`,
          href: c.credential_url || "",
        })),
      },
      {
        id: "profile-imported-achievements",
        title: "Achievements",
        fields: (achievements || []).map((a) => ({
          id: a.id,
          type: "textarea",
          label: a.title,
          value: `${a.organization || ""} (${a.date || ""}): ${a.description || ""}`,
        })),
      },
    ],
  };
}
