export type AIResumePersonal = {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
};

export type AIResumeEducation = {
  institution: string;
  location: string;
  degree: string;
  dates: string;
};

export type AIResumeExperience = {
  job_title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
};

export type AIResumeProject = {
  name: string;
  technologies: string[];
  dates: string;
  bullets: string[];
  project_link: string;
  github_link: string;
};

export type AIResumeTechnicalSkills = {
  languages: string[];
  frameworks: string[];
  developer_tools: string[];
  libraries: string[];
};

export type AIResumeCertification = {
  name: string;
  organization: string;
  issue_date: string;
  credential_id: string;
  credential_url: string;
};

export type AIResumeAchievement = {
  title: string;
  organization: string;
  date: string;
  description: string;
};

export type AIResumeData = {
  personal: AIResumePersonal;
  education: AIResumeEducation[];
  experience: AIResumeExperience[];
  projects: AIResumeProject[];
  technical_skills: AIResumeTechnicalSkills;
  certifications: AIResumeCertification[];
  achievements: AIResumeAchievement[];
};

const emptyResume: AIResumeData = {
  personal: { name: "", phone: "", email: "", linkedin: "", github: "" },
  education: [],
  experience: [],
  projects: [],
  technical_skills: {
    languages: [],
    frameworks: [],
    developer_tools: [],
    libraries: [],
  },
  certifications: [],
  achievements: [],
};

const asString = (value: unknown) =>
  value === null || value === undefined ? "" : String(value).trim();

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(asString).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const toArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? value : value && typeof value === "object" ? [value as T] : [];

export function normalizeResumeForAI(raw: any): AIResumeData {
  if (!raw || typeof raw !== "object") {
    return structuredClone(emptyResume);
  }

  const technical = raw.technical_skills || {};
  const skills = Array.isArray(raw.skills) ? raw.skills : [];

  const technicalSkills: AIResumeTechnicalSkills = {
    languages: asStringArray(technical.languages),
    frameworks: asStringArray(technical.frameworks),
    developer_tools: asStringArray(technical.developer_tools),
    libraries: asStringArray(technical.libraries),
  };

  // Convert the existing form's {name, category} skills into Jake's
  // four technical-skill groups when technical_skills is not already present.
  if (
    !technicalSkills.languages.length &&
    !technicalSkills.frameworks.length &&
    !technicalSkills.developer_tools.length &&
    !technicalSkills.libraries.length
  ) {
    for (const skill of skills) {
      const name = asString(skill?.name);
      if (!name) continue;
      const category = asString(skill?.category).toLowerCase();

      if (category.includes("program")) technicalSkills.languages.push(name);
      else if (category.includes("framework") || category.includes("library")) {
        // Keep explicit Library entries as Libraries; framework entries as Frameworks.
        if (category.includes("library")) technicalSkills.libraries.push(name);
        else technicalSkills.frameworks.push(name);
      } else {
        technicalSkills.developer_tools.push(name);
      }
    }
  }

  const education = toArray<any>(raw.education)
    .map((item) => ({
      institution: asString(item?.institution),
      location: asString(item?.location),
      degree: asString(item?.degree),
      dates: asString(item?.dates),
    }))
    .filter((item) => Object.values(item).some(Boolean));

  const experience = toArray<any>(raw.experience)
    .map((item) => ({
      job_title: asString(item?.job_title ?? item?.role),
      company: asString(item?.company),
      location: asString(item?.location),
      dates: asString(
        item?.dates ||
          (item?.startDate || item?.endDate
            ? `${asString(item?.startDate)} - ${asString(item?.endDate)}`.replace(/^\s*-\s*|\s*-\s*$/g, "")
            : "")
      ),
      bullets: asStringArray(item?.bullets ?? item?.description),
    }))
    .filter((item) =>
      item.job_title || item.company || item.location || item.dates || item.bullets.length
    );

  const projects = toArray<any>(raw.projects)
    .map((item) => ({
      name: asString(item?.name),
      technologies: asStringArray(item?.technologies),
      dates: asString(item?.dates),
      bullets: asStringArray(item?.bullets ?? item?.description),
      project_link: asString(item?.project_link ?? item?.projectLink),
      github_link: asString(item?.github_link ?? item?.githubLink),
    }))
    .filter((item) =>
      item.name || item.technologies.length || item.dates || item.bullets.length || item.project_link || item.github_link
    );

  const certifications = toArray<any>(raw.certifications)
    .map((item) => ({
      name: asString(item?.name),
      organization: asString(item?.organization),
      issue_date: asString(item?.issue_date ?? item?.issueDate),
      credential_id: asString(item?.credential_id ?? item?.credentialId),
      credential_url: asString(item?.credential_url ?? item?.credentialUrl),
    }))
    .filter((item) => Object.values(item).some(Boolean));

  const achievements = toArray<any>(raw.achievements)
    .map((item) => ({
      title: asString(item?.title),
      organization: asString(item?.organization),
      date: asString(item?.date),
      description: asString(item?.description),
    }))
    .filter((item) => Object.values(item).some(Boolean));

  return {
    personal: {
      name: asString(raw.personal?.name),
      phone: asString(raw.personal?.phone),
      email: asString(raw.personal?.email),
      linkedin: asString(raw.personal?.linkedin),
      github: asString(raw.personal?.github),
    },
    education,
    experience,
    projects,
    technical_skills: technicalSkills,
    certifications,
    achievements,
  };
}

export function normalizeExperienceData(data: any): AIResumeExperience {
  const bullets = asStringArray(data?.bullets ?? data?.description);
  let dates = asString(data?.dates);
  if (!dates && (data?.startDate || data?.endDate)) {
    dates = `${asString(data?.startDate)} - ${asString(data?.endDate)}`
      .replace(/^\s*-\s*|\s*-\s*$/g, "");
  }

  return {
    job_title: asString(data?.job_title ?? data?.role),
    company: asString(data?.company),
    location: asString(data?.location),
    dates,
    bullets,
  };
}

export function normalizeProjectData(data: any): AIResumeProject {
  return {
    name: asString(data?.name),
    technologies: asStringArray(data?.technologies),
    dates: asString(data?.dates),
    bullets: asStringArray(data?.bullets ?? data?.description),
    project_link: asString(data?.project_link ?? data?.projectLink),
    github_link: asString(data?.github_link ?? data?.githubLink),
  };
}

export function resumeHasContent(resume: AIResumeData): boolean {
  return Boolean(
    resume.personal.name ||
      resume.personal.email ||
      resume.education.length ||
      resume.experience.length ||
      resume.projects.length ||
      resume.technical_skills.languages.length ||
      resume.technical_skills.frameworks.length ||
      resume.technical_skills.developer_tools.length ||
      resume.technical_skills.libraries.length ||
      resume.certifications.length ||
      resume.achievements.length
  );
}