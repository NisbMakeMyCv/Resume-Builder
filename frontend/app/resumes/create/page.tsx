"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import PersonalForm from "./components/PersonalForm";
import EducationForm from "./components/EducationForm";
import ExperienceForm from "./components/ExperienceForm";
import ProjectsForm from "./components/ProjectsForm";
import SkillsForm from "./components/SkillsForm";
import CertificationsForm from "./components/CertificationsForm";
import AchievementsForm from "./components/AchievementsForm";
import ResumePreview from "./components/ResumePreview";
import ResumeChatbot from "./components/ResumeChatbot";

import { generateResumePDF } from "../../../lib/resumeApi";

/* =========================================================
   TYPES
========================================================= */

export type ResumeData = {
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
  };

  experience: {
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  };

  projects: {
    name: string;
    description: string;
    technologies: string;
    bullets: string[];
    projectLink: string;
    githubLink: string;
  }[];

  skills: {
    name: string;
    category: string;
  }[];

  certifications: {
    name: string;
    organization: string;
    issueDate: string;
    credentialId: string;
    credentialUrl: string;
  }[];

  achievements: {
    title: string;
    organization: string;
    date: string;
    description: string;
  }[];
};

/* =========================================================
   INITIAL DATA
========================================================= */

const initialResumeData: ResumeData = {
  personal: {
    name: "",
    phone: "",
    email: "",
    linkedin: "",
    github: "",
  },

  education: {
    institution: "",
    location: "",
    degree: "",
    dates: "",
  },

  experience: {
    company: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  },

  projects: [
    {
      name: "",
      description: "",
      technologies: "",
      bullets: [],
      projectLink: "",
      githubLink: "",
    },
  ],

  skills: [
    {
      name: "",
      category: "",
    },
  ],

  certifications: [
    {
      name: "",
      organization: "",
      issueDate: "",
      credentialId: "",
      credentialUrl: "",
    },
  ],

  achievements: [
    {
      title: "",
      organization: "",
      date: "",
      description: "",
    },
  ],
};

/* =========================================================
   STEP NAMES
========================================================= */

const steps = [
  "Personal",
  "Education",
  "Experience",
  "Projects",
  "Skills",
  "Certifications",
  "Achievements",
];

/* =========================================================
   PAGE
========================================================= */

export default function CreateResumePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [resumeData, setResumeData] =
    useState<ResumeData>(() => {
      if (typeof window === "undefined") {
        return initialResumeData;
      }

      try {
        const savedResume =
          window.localStorage.getItem("makemycv_resume");

        if (savedResume) {
          const parsed = JSON.parse(savedResume);

          if (
            parsed &&
            typeof parsed === "object" &&
            parsed.personal &&
            parsed.education &&
            parsed.experience &&
            Array.isArray(parsed.projects) &&
            Array.isArray(parsed.skills) &&
            Array.isArray(parsed.certifications) &&
            Array.isArray(parsed.achievements)
          ) {
            return {
              ...initialResumeData,
              ...parsed,
              personal: {
                ...initialResumeData.personal,
                ...parsed.personal,
              },
              education: {
                ...initialResumeData.education,
                ...parsed.education,
              },
              experience: {
                ...initialResumeData.experience,
                ...parsed.experience,
              },
              projects: parsed.projects.map((project: any) => ({
                name: "",
                description: "",
                technologies: "",
                bullets: [],
                projectLink: "",
                githubLink: "",
                ...project,
                bullets: Array.isArray(project?.bullets)
                  ? project.bullets
                      .map((bullet: unknown) => String(bullet).trim())
                      .filter(Boolean)
                  : [],
                technologies: Array.isArray(project?.technologies)
                  ? project.technologies.join(", ")
                  : String(project?.technologies ?? ""),
              })),
              skills: parsed.skills.map((skill: any) => ({
                name: String(skill?.name ?? "").trim(),
                category: String(skill?.category ?? "Technical").trim(),
              })),
              certifications: parsed.certifications.map((certification: any) => ({
                name: "",
                organization: "",
                issueDate: "",
                credentialId: "",
                credentialUrl: "",
                ...certification,
              })),
              achievements: parsed.achievements.map((achievement: any) => ({
                title: "",
                organization: "",
                date: "",
                description: "",
                ...achievement,
              })),
            } as ResumeData;
          }
        }
      } catch (loadError) {
        console.error(
          "Failed to load saved resume from localStorage:",
          loadError
        );
      }

      return initialResumeData;
    });

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================================================
     SAVE RESUME DATA FOR CHATBOT + RESUME EDITOR
  ========================================================= */

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "makemycv_resume",
        JSON.stringify(resumeData)
      );
    } catch (saveError) {
      console.error(
        "Failed to save resume to localStorage:",
        saveError
      );
    }
  }, [resumeData]);

  /* =======================================================
     PERSONAL
  ======================================================= */

  const updatePersonal = (
    field: keyof ResumeData["personal"],
    value: string
  ) => {
    setResumeData((current) => ({
      ...current,

      personal: {
        ...current.personal,
        [field]: value,
      },
    }));
  };

  /* =======================================================
     EDUCATION
  ======================================================= */

  const updateEducation = (
    field: keyof ResumeData["education"],
    value: string
  ) => {
    setResumeData((current) => ({
      ...current,

      education: {
        ...current.education,
        [field]: value,
      },
    }));
  };

  /* =======================================================
     EXPERIENCE
  ======================================================= */

  const updateExperience = (
    field: keyof ResumeData["experience"],
    value: string
  ) => {
    setResumeData((current) => ({
      ...current,

      experience: {
        ...current.experience,
        [field]: value,
      },
    }));
  };

  /* =======================================================
     PROJECTS
  ======================================================= */

  const updateProject = (
    index: number,
    field: keyof ResumeData["projects"][number],
    value: string
  ) => {
    setResumeData((current) => ({
      ...current,

      projects: current.projects.map(
        (project, projectIndex) =>
          projectIndex === index
            ? {
                ...project,
                [field]: value,
              }
            : project
      ),
    }));
  };

  const addProject = () => {
    setResumeData((current) => ({
      ...current,

      projects: [
        ...current.projects,

        {
          name: "",
          description: "",
          technologies: "",
          bullets: [],
          projectLink: "",
          githubLink: "",
        },
      ],
    }));
  };

  const removeProject = (index: number) => {
    setResumeData((current) => {
      if (current.projects.length <= 1) {
        return current;
      }

      return {
        ...current,

        projects: current.projects.filter(
          (_, projectIndex) =>
            projectIndex !== index
        ),
      };
    });
  };

  /* =======================================================
     SKILLS
  ======================================================= */

  const updateSkill = (
    index: number,
    field: keyof ResumeData["skills"][number],
    value: string
  ) => {
    setResumeData((current) => ({
      ...current,

      skills: current.skills.map(
        (skill, skillIndex) =>
          skillIndex === index
            ? {
                ...skill,
                [field]: value,
              }
            : skill
      ),
    }));
  };

  const addSkill = () => {
    setResumeData((current) => ({
      ...current,

      skills: [
        ...current.skills,

        {
          name: "",
          category: "",
        },
      ],
    }));
  };

  const removeSkill = (index: number) => {
    setResumeData((current) => {
      if (current.skills.length <= 1) {
        return current;
      }

      return {
        ...current,

        skills: current.skills.filter(
          (_, skillIndex) =>
            skillIndex !== index
        ),
      };
    });
  };

  /* =======================================================
     CERTIFICATIONS
  ======================================================= */

  const updateCertification = (
    index: number,
    field: keyof ResumeData["certifications"][number],
    value: string
  ) => {
    setResumeData((current) => ({
      ...current,

      certifications:
        current.certifications.map(
          (
            certification,
            certificationIndex
          ) =>
            certificationIndex === index
              ? {
                  ...certification,
                  [field]: value,
                }
              : certification
        ),
    }));
  };

  const addCertification = () => {
    setResumeData((current) => ({
      ...current,

      certifications: [
        ...current.certifications,

        {
          name: "",
          organization: "",
          issueDate: "",
          credentialId: "",
          credentialUrl: "",
        },
      ],
    }));
  };

  const removeCertification = (index: number) => {
    setResumeData((current) => {
      if (current.certifications.length <= 1) {
        return current;
      }

      return {
        ...current,

        certifications:
          current.certifications.filter(
            (_, certificationIndex) =>
              certificationIndex !== index
          ),
      };
    });
  };

  /* =======================================================
     ACHIEVEMENTS
  ======================================================= */

  const updateAchievement = (
    index: number,
    field: keyof ResumeData["achievements"][number],
    value: string
  ) => {
    setResumeData((current) => ({
      ...current,

      achievements:
        current.achievements.map(
          (
            achievement,
            achievementIndex
          ) =>
            achievementIndex === index
              ? {
                  ...achievement,
                  [field]: value,
                }
              : achievement
        ),
    }));
  };

  const addAchievement = () => {
    setResumeData((current) => ({
      ...current,

      achievements: [
        ...current.achievements,

        {
          title: "",
          organization: "",
          date: "",
          description: "",
        },
      ],
    }));
  };

  const removeAchievement = (index: number) => {
    setResumeData((current) => {
      if (current.achievements.length <= 1) {
        return current;
      }

      return {
        ...current,

        achievements:
          current.achievements.filter(
            (_, achievementIndex) =>
              achievementIndex !== index
          ),
      };
    });
  };
  /* =======================================================
     CHATBOT OPERATION TYPES
  ======================================================= */

  type ResumeOperation = {
    action:
      | "add"
      | "update"
      | "delete"
      | "replace"
      | "clear";

    section:
      | "personal"
      | "education"
      | "experience"
      | "projects"
      | "skills"
      | "technical_skills"
      | "certifications"
      | "achievements";

    field?: string | null;

    index?: number | null;

    data?: any;
  };


  /* =======================================================
     APPLY AI RESUME OPERATIONS
  ======================================================= */

  const applyResumeOperations = (
    operations: ResumeOperation[]
  ) => {
    setResumeData((current) => {
      let updated = { ...current };

      for (const operation of operations) {
        const {
          action,
          section,
          field,
          index,
          data,
        } = operation;


        /* =================================================
           PERSONAL
        ================================================= */

        if (section === "personal") {
          if (
            action === "update" &&
            field
          ) {
            updated = {
              ...updated,

              personal: {
                ...updated.personal,

                [field]:
                  String(data ?? ""),
              },
            };
          }

          if (
            action === "replace" &&
            data
          ) {
            updated = {
              ...updated,

              personal: {
                ...updated.personal,
                ...data,
              },
            };
          }

          if (action === "clear") {
            updated = {
              ...updated,

              personal: {
                name: "",
                phone: "",
                email: "",
                linkedin: "",
                github: "",
              },
            };
          }

          continue;
        }


        /* =================================================
           EDUCATION
        ================================================= */

        if (section === "education") {
          if (
            action === "update" &&
            field
          ) {
            updated = {
              ...updated,

              education: {
                ...updated.education,

                [field]:
                  String(data ?? ""),
              },
            };
          }

          if (
            action === "replace" &&
            data
          ) {
            updated = {
              ...updated,

              education: {
                ...updated.education,
                ...data,
              },
            };
          }

          if (action === "add") {
            updated = {
              ...updated,

              education: {
                ...updated.education,
                ...data,
              },
            };
          }

          if (action === "clear") {
            updated = {
              ...updated,

              education: {
                institution: "",
                location: "",
                degree: "",
                dates: "",
              },
            };
          }

          continue;
        }


        /* =================================================
           EXPERIENCE
        ================================================= */

        if (section === "experience") {
          if (
            action === "update" &&
            field
          ) {
            updated = {
              ...updated,

              experience: {
                ...updated.experience,

                [field]:
                  String(data ?? ""),
              },
            };
          }

          if (
            action === "replace" &&
            data
          ) {
            updated = {
              ...updated,

              experience: {
                ...updated.experience,
                ...data,
              },
            };
          }

          if (action === "add") {
            updated = {
              ...updated,

              experience: {
                ...updated.experience,
                ...data,
              },
            };
          }

          if (action === "clear") {
            updated = {
              ...updated,

              experience: {
                company: "",
                role: "",
                location: "",
                startDate: "",
                endDate: "",
                description: "",
              },
            };
          }

          continue;
        }

        /* =================================================
           PROJECTS
        ================================================= */

        if (section === "projects") {
          const projects = updated.projects;

          /* -----------------------------------------------
             ADD PROJECT
          ----------------------------------------------- */

          if (
            action === "add" &&
            data
          ) {
            const projectData = {
              ...data,
            };

            // AI may return bullets as:
            // ["Built...", "Implemented..."]
            //
            // or:
            // { value: ["Built...", "Implemented..."] }

            if (
              projectData.bullets &&
              !Array.isArray(
                projectData.bullets
              ) &&
              Array.isArray(
                projectData.bullets.value
              )
            ) {
              projectData.bullets =
                projectData.bullets.value;
            }

            if (
              !Array.isArray(
                projectData.bullets
              )
            ) {
              projectData.bullets = [];
            } else {
              projectData.bullets =
                projectData.bullets
                  .map((bullet: unknown) =>
                    String(bullet).trim()
                  )
                  .filter(Boolean);
            }

            // AI may return technologies as:
            // ["React", "FastAPI"]
            //
            // Frontend expects:
            // "React, FastAPI"

            if (
              Array.isArray(
                projectData.technologies
              )
            ) {
              projectData.technologies =
                projectData.technologies.join(
                  ", "
                );
            }

            // Make sure technologies is always a string.
            if (
              projectData.technologies !==
                undefined &&
              projectData.technologies !== null &&
              typeof projectData.technologies !==
                "string"
            ) {
              projectData.technologies =
                String(
                  projectData.technologies
                );
            }

            updated = {
              ...updated,

              projects: [
                ...projects,

                {
                  name: "",
                  description: "",
                  technologies: "",
                  bullets: [],
                  projectLink: "",
                  githubLink: "",

                  ...projectData,
                },
              ],
            };

            continue;
          }


          /* -----------------------------------------------
             UPDATE PROJECT
          ----------------------------------------------- */

          if (
            action === "update" &&
            index !== null &&
            index !== undefined &&
            projects[index]
          ) {
            const updatedProjects =
              projects.map(
                (
                  project,
                  projectIndex
                ) => {
                  if (
                    projectIndex !== index
                  ) {
                    return project;
                  }

                  let mergedProject = {
                    ...project,
                  };

                  // -------------------------------------------------
                  // Update a project field.
                  //
                  // The AI may send:
                  //   data: "value"
                  //
                  // or:
                  //   data: { value: "value" }
                  //
                  // Bullets are special because they are an array.
                  // -------------------------------------------------

                  if (field === "bullets") {
                    const bulletValue =
                      Array.isArray(data)
                        ? data
                        : Array.isArray(data?.value)
                        ? data.value
                        : [];

                    mergedProject = {
                      ...mergedProject,
                      bullets: bulletValue
                        .map((bullet: unknown) =>
                          String(bullet).trim()
                        )
                        .filter(Boolean),
                    };
                  } else {
                    const fieldValue =
                      data &&
                      typeof data === "object" &&
                      !Array.isArray(data) &&
                      "value" in data
                        ? data.value
                        : data;

                    mergedProject = {
                      ...mergedProject,
                      ...(field
                        ? {
                            [field]:
                              fieldValue,
                          }
                        : fieldValue),
                    };
                  }

                  // Normalize technologies after an AI update.
                  if (
                    Array.isArray(
                      mergedProject.technologies
                    )
                  ) {
                    mergedProject.technologies =
                      mergedProject.technologies.join(
                        ", "
                      );
                  }

                  if (
                    mergedProject.technologies !==
                      undefined &&
                    mergedProject.technologies !==
                      null &&
                    typeof mergedProject.technologies !==
                      "string"
                  ) {
                    mergedProject.technologies =
                      String(
                        mergedProject.technologies
                      );
                  }

                  // Normalize bullets after an AI update.
                  if (
                    !Array.isArray(
                      mergedProject.bullets
                    )
                  ) {
                    mergedProject.bullets = [];
                  } else {
                    mergedProject.bullets =
                      mergedProject.bullets
                        .map((bullet: unknown) =>
                          String(bullet).trim()
                        )
                        .filter(Boolean);
                  }

                  return mergedProject;
                }
              );

            updated = {
              ...updated,

              projects:
                updatedProjects,
            };

            continue;
          }


          /* -----------------------------------------------
             DELETE PROJECT
          ----------------------------------------------- */

          if (
            action === "delete" &&
            index !== null &&
            index !== undefined
          ) {
            updated = {
              ...updated,

              projects:
                projects.filter(
                  (
                    _,
                    projectIndex
                  ) =>
                    projectIndex !== index
                ),
            };

            continue;
          }


          /* -----------------------------------------------
             REPLACE PROJECTS
          ----------------------------------------------- */

          if (
            action === "replace" &&
            Array.isArray(data)
          ) {
            const normalizedProjects =
              data.map(
                (project) => {
                  const normalizedProject = {
                    ...project,
                  };

                  if (
                    Array.isArray(
                      normalizedProject.technologies
                    )
                  ) {
                    normalizedProject.technologies =
                      normalizedProject.technologies.join(
                        ", "
                      );
                  }

                  if (
                    normalizedProject.technologies !==
                      undefined &&
                    normalizedProject.technologies !==
                      null &&
                    typeof normalizedProject.technologies !==
                      "string"
                  ) {
                    normalizedProject.technologies =
                      String(
                        normalizedProject.technologies
                      );
                  }

                  if (
                    !Array.isArray(
                      normalizedProject.bullets
                    )
                  ) {
                    normalizedProject.bullets = [];
                  } else {
                    normalizedProject.bullets =
                      normalizedProject.bullets
                        .map((bullet: unknown) =>
                          String(bullet).trim()
                        )
                        .filter(Boolean);
                  }

                  return normalizedProject;
                }
              );

            updated = {
              ...updated,

              projects:
                normalizedProjects,
            };

            continue;
          }


          /* -----------------------------------------------
             CLEAR PROJECTS
          ----------------------------------------------- */

          if (
            action === "clear"
          ) {
            updated = {
              ...updated,

              projects: [],
            };

            continue;
          }
        }
        /* =================================================
           SKILLS
        ================================================= */

        if (
          section === "skills" ||
          section === "technical_skills"
        ) {
          const skills =
            updated.skills;

          if (
            action === "add" &&
            data
          ) {
            const skillItems = Array.isArray(data)
              ? data
              : [data];

            const normalizedSkills = skillItems
              .map((item: any) => {
                const source =
                  item &&
                  typeof item === "object"
                    ? item
                    : { name: String(item ?? "") };

                return {
                  name: String(source.name ?? source.value ?? "").trim(),
                  category: String(source.category ?? "Technical").trim(),
                };
              })
              .filter((skill: any) => skill.name);

            updated = {
              ...updated,

              skills: [
                ...skills,
                ...normalizedSkills,
              ],
            };

            continue;
          }

          if (
            action === "update" &&
            index !== null &&
            index !== undefined &&
            skills[index]
          ) {
            updated = {
              ...updated,

              skills: skills.map(
                (
                  skill,
                  skillIndex
                ) =>
                  skillIndex === index
                    ? {
                        ...skill,
                        ...(field
                          ? {
                              [field]:
                                data &&
                                typeof data === "object" &&
                                !Array.isArray(data) &&
                                "value" in data
                                  ? data.value
                                  : data,
                            }
                          : data),
                      }
                    : skill
              ),
            };

            continue;
          }

          if (
            action === "delete" &&
            index !== null &&
            index !== undefined
          ) {
            updated = {
              ...updated,

              skills:
                skills.filter(
                  (_, skillIndex) =>
                    skillIndex !== index
                ),
            };

            continue;
          }

          if (
            action === "delete" &&
            data
          ) {
            const target =
              data.name ||
              data.title ||
              "";

            if (target) {
              updated = {
                ...updated,

                skills:
                  skills.filter(
                    (skill) =>
                      skill.name
                        .toLowerCase() !==
                      String(
                        target
                      ).toLowerCase()
                  ),
              };
            }

            continue;
          }

          if (
            action === "replace" &&
            Array.isArray(data)
          ) {
            updated = {
              ...updated,
              skills: data,
            };

            continue;
          }

          if (action === "clear") {
            updated = {
              ...updated,
              skills: [],
            };

            continue;
          }
        }


        /* =================================================
           CERTIFICATIONS
        ================================================= */

        if (
          section === "certifications"
        ) {
          const certifications =
            updated.certifications;

          if (
            action === "add" &&
            data
          ) {
            updated = {
              ...updated,

              certifications: [
                ...certifications,

                {
                  name: "",
                  organization: "",
                  issueDate: "",
                  credentialId: "",
                  credentialUrl: "",
                  ...data,
                },
              ],
            };

            continue;
          }

          if (
            action === "update" &&
            index !== null &&
            index !== undefined &&
            certifications[index]
          ) {
            updated = {
              ...updated,

              certifications:
                certifications.map(
                  (
                    certification,
                    certificationIndex
                  ) =>
                    certificationIndex ===
                    index
                      ? {
                          ...certification,
                          ...(field
                            ? {
                                [field]:
                                  data,
                              }
                            : data),
                        }
                      : certification
                ),
            };

            continue;
          }

          if (
            action === "delete" &&
            index !== null &&
            index !== undefined
          ) {
            updated = {
              ...updated,

              certifications:
                certifications.filter(
                  (
                    _,
                    certificationIndex
                  ) =>
                    certificationIndex !==
                    index
                ),
            };

            continue;
          }

          if (
            action === "replace" &&
            Array.isArray(data)
          ) {
            updated = {
              ...updated,
              certifications: data,
            };

            continue;
          }

          if (action === "clear") {
            updated = {
              ...updated,
              certifications: [],
            };

            continue;
          }
        }


        /* =================================================
           ACHIEVEMENTS
        ================================================= */

        if (
          section === "achievements"
        ) {
          const achievements =
            updated.achievements;

          if (
            action === "add" &&
            data
          ) {
            updated = {
              ...updated,

              achievements: [
                ...achievements,

                {
                  title: "",
                  organization: "",
                  date: "",
                  description: "",
                  ...data,
                },
              ],
            };

            continue;
          }

          if (
            action === "update" &&
            index !== null &&
            index !== undefined &&
            achievements[index]
          ) {
            updated = {
              ...updated,

              achievements:
                achievements.map(
                  (
                    achievement,
                    achievementIndex
                  ) =>
                    achievementIndex ===
                    index
                      ? {
                          ...achievement,
                          ...(field
                            ? {
                                [field]:
                                  data,
                              }
                            : data),
                        }
                      : achievement
                ),
            };

            continue;
          }

          if (
            action === "delete" &&
            index !== null &&
            index !== undefined
          ) {
            updated = {
              ...updated,

              achievements:
                achievements.filter(
                  (
                    _,
                    achievementIndex
                  ) =>
                    achievementIndex !==
                    index
                ),
            };

            continue;
          }

          if (
            action === "replace" &&
            Array.isArray(data)
          ) {
            updated = {
              ...updated,
              achievements: data,
            };

            continue;
          }

          if (action === "clear") {
            updated = {
              ...updated,
              achievements: [],
            };

            continue;
          }
        }
      }

      return updated;
    });
  };

  /* =======================================================
     CHATBOT BRIDGE
  ======================================================= */

  const handleChatbotRequest = (
    operations: ResumeOperation[]
  ) => {
    console.log(
      "AI Resume Operations:",
      operations
    );

    applyResumeOperations(operations);
  };

  /* =======================================================
     GENERATE PDF
  ======================================================= */

  const handleGenerateResume = async () => {
    setIsGenerating(true);
    setError("");

    try {
      console.log(
        "Sending ResumeData to backend:",
        resumeData
      );

      const pdfBlob =
        await generateResumePDF(resumeData);

      const downloadUrl =
        window.URL.createObjectURL(pdfBlob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;

      link.download = "resume.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        downloadUrl
      );
    } catch (err) {
      console.error(
        "Resume generation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate resume."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-surface p-6 sm:p-8">

      <div className="max-w-5xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex items-start justify-between gap-4">

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-on-surface">
              Create Your Resume
            </h1>

            <p className="mt-2 text-on-surface-variant">
              Build your professional resume step by step.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/resumes/create/ai")}
            className="
              shrink-0
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-violet-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-violet-700
              shadow-sm
              transition-all
              hover:bg-violet-50
              hover:border-violet-300
              hover:shadow-md
              active:scale-95
            "
          >
            ✨ AI Chatbot
          </button>

        </div>

        {/* =================================================
            STEP INDICATOR
        ================================================= */}

        <div className="flex flex-wrap items-center gap-3 mb-8">

          {steps.map((label, index) => {

            const stepNumber = index + 1;

            return (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setStep(stepNumber)
                }
                className={`
                  px-4
                  py-2
                  rounded-full
                  text-sm
                  font-medium
                  transition-all
                  ${
                    step === stepNumber
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }
                `}
              >
                {stepNumber}. {label}
              </button>
            );

          })}

        </div>

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (

          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}

        {/* =================================================
            STEP 1 â€” PERSONAL
        ================================================= */}

        {step === 1 && (

          <PersonalForm
            data={resumeData.personal}
            onChange={updatePersonal}
            onNext={() => setStep(2)}
          />

        )}

        {/* =================================================
            STEP 2 â€” EDUCATION
        ================================================= */}

        {step === 2 && (

          <EducationForm
            data={resumeData.education}
            onChange={updateEducation}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />

        )}

        {/* =================================================
            STEP 3 â€” EXPERIENCE
        ================================================= */}

        {step === 3 && (

          <ExperienceForm
            data={resumeData.experience}
            onChange={updateExperience}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />

        )}

        {/* =================================================
            STEP 4 â€” PROJECTS
        ================================================= */}

        {step === 4 && (

          <ProjectsForm
            data={resumeData.projects}
            onChange={updateProject}
            onAdd={addProject}
            onRemove={removeProject}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />

        )}

        {/* =================================================
            STEP 5 â€” SKILLS
        ================================================= */}

        {step === 5 && (

          <SkillsForm
            data={resumeData.skills}
            onChange={updateSkill}
            onAdd={addSkill}
            onRemove={removeSkill}
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
          />

        )}

        {/* =================================================
            STEP 6 â€” CERTIFICATIONS
        ================================================= */}

        {step === 6 && (

          <CertificationsForm
            data={resumeData.certifications}
            onChange={updateCertification}
            onAdd={addCertification}
            onRemove={removeCertification}
            onBack={() => setStep(5)}
            onNext={() => setStep(7)}
          />

        )}

        {/* =================================================
            STEP 7 â€” ACHIEVEMENTS
        ================================================= */}

        {step === 7 && (

          <div>

            {/* =================================================
                ACHIEVEMENTS FORM
            ================================================= */}

            <AchievementsForm
              data={resumeData.achievements}
              onChange={updateAchievement}
              onAdd={addAchievement}
              onRemove={removeAchievement}
              onBack={() => setStep(6)}
              onNext={() => {
                console.log(
                  "Resume sections completed."
                );

                console.log(
                  "Final ResumeData:",
                  resumeData
                );
              }}
            />

            {/* =================================================
                RESUME PREVIEW
            ================================================= */}

            <ResumePreview
              data={resumeData}
            />

            {/* =================================================
                AI RESUME ASSISTANT
            ================================================= */}
            <ResumeChatbot
            resumeData={resumeData}
            onResumeUpdate={handleChatbotRequest}
            />
           

            {/* =================================================
                GENERATE RESUME
            ================================================= */}

            <div className="mt-8">

              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">

                <h2 className="text-xl font-bold text-on-surface">
                  Your Resume is Ready
                </h2>

                <p className="mt-2 text-sm text-on-surface-variant">
                  Generate your resume using the information
                  you entered above.
                </p>

                <button
                  type="button"
                  onClick={
                    handleGenerateResume
                  }
                  disabled={isGenerating}
                  className="
                    mt-6
                    w-full
                    sm:w-auto
                    px-8
                    py-3
                    rounded-full
                    bg-primary
                    text-on-primary
                    font-semibold
                    transition-all
                    hover:bg-secondary
                    active:scale-95
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >
                  {isGenerating
                    ? "Generating Resume..."
                    : "Generate & Download Resume"}
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}