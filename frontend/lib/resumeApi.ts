import type { ResumeData } from "../app/resumes/create/page";

/* =========================================================
   BACKEND DATA TYPE
========================================================= */

type BackendResumeData = {
  personal: {
    name: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
  };

  education: {
    institution: string;
    location: string;
    degree: string;
    dates: string;
  }[];

  experience: {
    job_title: string;
    company: string;
    location: string;
    dates: string;
    bullets: string[];
  }[];

  projects: {
    name: string;
    technologies: string[];
    dates: string;
    bullets: string[];
    project_link: string;
    github_link: string;
  }[];

  technical_skills: {
    languages: string[];
    frameworks: string[];
    developer_tools: string[];
    libraries: string[];
  };

  certifications: {
    name: string;
    organization: string;
    issue_date: string;
    credential_id: string;
    credential_url: string;
  }[];

  achievements: {
    title: string;
    organization: string;
    date: string;
    description: string;
  }[];
};

/* =========================================================
   FRONTEND → BACKEND MAPPER
========================================================= */

export function convertResumeDataToBackend(
  resume: ResumeData
): BackendResumeData {
  return {
    /* =======================================================
       PERSONAL
    ======================================================= */

    personal: {
      name: resume.personal.name,
      phone: resume.personal.phone,
      email: resume.personal.email,
      linkedin: resume.personal.linkedin,
      github: resume.personal.github,
    },

    /* =======================================================
       EDUCATION
    ======================================================= */

    education: [
      {
        institution: resume.education.institution,
        location: resume.education.location,
        degree: resume.education.degree,
        dates: resume.education.dates,
      },
    ].filter(
      (item) =>
        item.institution ||
        item.location ||
        item.degree ||
        item.dates
    ),

    /* =======================================================
       EXPERIENCE
    ======================================================= */

    experience: [
      {
        job_title: resume.experience.role,

        company: resume.experience.company,

        location: resume.experience.location,

        dates:
          resume.experience.startDate ||
          resume.experience.endDate
            ? `${resume.experience.startDate} - ${resume.experience.endDate}`
            : "",

        bullets: resume.experience.description
          ? resume.experience.description
              .split(/\r?\n/)
              .map((bullet) =>
                bullet
                  .replace(/^[-•*]\s*/, "")
                  .trim()
              )
              .filter(Boolean)
          : [],
      },
    ].filter(
      (item) =>
        item.job_title ||
        item.company ||
        item.location ||
        item.dates ||
        item.bullets.length > 0
    ),

    /* =======================================================
       PROJECTS
    ======================================================= */

    projects: resume.projects
      .filter(
        (project) =>
          project.name ||
          project.description ||
          project.bullets?.length > 0 ||
          project.technologies ||
          project.projectLink ||
          project.githubLink
      )
      .map((project) => ({
        name: project.name,

        technologies: project.technologies
          ? project.technologies
              .split(",")
              .map((technology) =>
                technology.trim()
              )
              .filter(Boolean)
          : [],

        dates: "",

        bullets:
          project.bullets?.length > 0
            ? project.bullets
                .map((bullet) =>
                  String(bullet).trim()
                )
                .filter(Boolean)
            : project.description
              ? [project.description.trim()]
              : [],

        project_link:
          project.projectLink,

        github_link:
          project.githubLink,
      })),

    /* =======================================================
       TECHNICAL SKILLS
    ======================================================= */

    technical_skills: {
      languages: resume.skills
        .filter(
          (skill) =>
            skill.name &&
            skill.category ===
              "Programming Language"
        )
        .map(
          (skill) => skill.name
        ),

      frameworks: resume.skills
        .filter(
          (skill) =>
            skill.name &&
            skill.category ===
              "Framework / Library"
        )
        .map(
          (skill) => skill.name
        ),

      developer_tools: resume.skills
        .filter(
          (skill) =>
            skill.name &&
            (
              skill.category === "Tools" ||
              skill.category ===
                "Cloud / DevOps" ||
              skill.category ===
                "Technical" ||
              skill.category ===
                "Technology" ||
              skill.category === ""
            )
        )
        .map(
          (skill) => skill.name
        ),

      libraries: resume.skills
        .filter(
          (skill) =>
            skill.name &&
            skill.category ===
              "Library"
        )
        .map(
          (skill) => skill.name
        ),
    },

    /* =======================================================
       CERTIFICATIONS
    ======================================================= */

    certifications: resume.certifications
      .filter(
        (certification) =>
          certification.name ||
          certification.organization ||
          certification.issueDate ||
          certification.credentialId ||
          certification.credentialUrl
      )
      .map((certification) => ({
        name:
          certification.name,

        organization:
          certification.organization,

        issue_date:
          certification.issueDate,

        credential_id:
          certification.credentialId,

        credential_url:
          certification.credentialUrl,
      })),

    /* =======================================================
       ACHIEVEMENTS
    ======================================================= */

    achievements: resume.achievements
      .filter(
        (achievement) =>
          achievement.title ||
          achievement.organization ||
          achievement.date ||
          achievement.description
      )
      .map((achievement) => ({
        title:
          achievement.title,

        organization:
          achievement.organization,

        date:
          achievement.date,

        description:
          achievement.description,
      })),
  };
}

/* =========================================================
   GENERATE PDF
========================================================= */

export async function generateResumePDF(
  resumeData: ResumeData
): Promise<Blob> {
  const backendData =
    convertResumeDataToBackend(
      resumeData
    );

  /*
   * .env.local:
   *
   * NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
   *
   * Therefore we must NOT add /api/v1 again here.
   */

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api/v1";

  const response = await fetch(
    `${API_BASE_URL}/ai/resume/generate`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "application/pdf",
      },

      body: JSON.stringify(
        backendData
      ),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Resume generation failed (${response.status}): ${errorText}`
    );
  }

  return response.blob();
}