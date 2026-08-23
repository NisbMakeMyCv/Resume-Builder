/**
 * NISB-MakeMyCV backend API client.
 *
 * All calls hit the FastAPI backend directly. The base URL can be
 * overridden with NEXT_PUBLIC_API_URL (defaults to the local dev backend).
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const ACCESS_TOKEN_KEY = "makemycv_access_token";
export const USER_KEY = "makemycv_user";

/** Shape returned by GET /api/v1/auth/me. */
export type CurrentUser = {
  id: string;
  email: string;
  full_name: string;
  /** Google profile picture or generated UI-Avatar URL (may be null). */
  profile_picture: string | null;
};

/** Shape stored in localStorage by saveSession(). */
export type StoredUser = CurrentUser;

/** Master Profile — GET/PATCH /api/v1/profile/. */
export type Profile = {
  headline: string | null;
  summary: string | null;
  location: string | null;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

/**
 * Thin fetch wrapper: JSON in, typed JSON out, FastAPI error details surfaced.
 */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    let detail = "Something went wrong. Please try again.";
    if (typeof data?.detail === "string") {
      detail = data.detail;
    } else if (Array.isArray(data?.detail)) {
      detail = data.detail
        .map((d: any) => {
          const loc = d.loc?.slice(1).join(".") || "";
          return loc ? `${loc}: ${d.msg}` : d.msg;
        })
        .join(" | ");
    }
    throw new Error(detail);
  }

  return data as T;
}

/* =========================================================
   AUTH STORAGE HELPERS
   ========================================================= */

export function saveSession(token: string, user: StoredUser) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Refresh the stored identity (call after /auth/me resolves). */
export function storeUser(user: CurrentUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/* =========================================================
   PROFILE (Master Profile) HELPERS
   ========================================================= */

/** GET /api/v1/profile/ — headline, summary, location. */
export function getProfile(token: string): Promise<Profile> {
  return apiRequest<Profile>("/profile/", { token });
}

/** PATCH /api/v1/profile/ — partial update, UI auto-save friendly. */
export function updateProfile(
  token: string,
  patch: Partial<Profile>
): Promise<Profile> {
  return apiRequest<Profile>("/profile/", {
    method: "PATCH",
    token,
    body: patch,
  });
}

/**
 * DELETE /api/v1/auth/me — GDPR-compliant account deletion.
 * The backend responds with 204 No Content, so there is no JSON body.
 */
export function deleteAccount(token: string): Promise<void> {
  return apiRequest<void>("/auth/me", { method: "DELETE", token });
}

/** POST /api/v1/auth/me/photo - Upload a new profile picture */
export async function uploadProfilePhoto(token: string, file: File): Promise<{ message: string; profile_picture: string }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${API_URL}/auth/me/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload photo");
  }
  return res.json();
}

/* =========================================================
   RESUME DATA — Education / Experience / Skills / Projects
   Each backend router exposes:
     GET    /            → list
     POST   /            → create (201)
     PUT    /{id}        → partial update
     DELETE /{id}        → 204 No Content
   Dates are sent as "YYYY-MM-DD"; every response carries the
   server-assigned id, display_order, created_at and updated_at.
   ========================================================= */

export type Education = {
  id: string;
  institution: string;
  degree: string;
  branch: string;
  start_date: string;
  end_date: string | null;
  cgpa: number | null;
};

export type Experience = {
  id: string;
  company: string;
  designation: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
};

export const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Expert"] as const;
export type Proficiency = (typeof PROFICIENCY_LEVELS)[number];

export type Skill = {
  id: string;
  skill_name: string;
  proficiency: Proficiency;
};

export type Project = {
  id: string;
  title: string;
  description: string | null;
  github_link: string | null;
  github_link_text: string | null;
};

/**
 * Minimal per-entity REST helper factory.
 * `url` is the API path (e.g. "/education") — the auth prefix is omitted.
 */
function createCrud<T, C>(url: string) {
  return {
    list(token: string): Promise<T[]> {
      return apiRequest<T[]>(`${url}/`, { token });
    },
    create(token: string, payload: C): Promise<T> {
      return apiRequest<T>(`${url}/`, { method: "POST", token, body: payload });
    },
    update(token: string, id: string, patch: Partial<C>): Promise<T> {
      return apiRequest<T>(`${url}/${id}`, {
        method: "PUT",
        token,
        body: patch,
      });
    },
    remove(token: string, id: string): Promise<void> {
      return apiRequest<void>(`${url}/${id}`, { method: "DELETE", token });
    },
  };
}

export const educationApi = createCrud<Education, EducationCreateInput>("/education");
export const experienceApi = createCrud<Experience, ExperienceCreateInput>("/experience");
export const skillsApi = createCrud<Skill, SkillCreateInput>("/skills");
export const projectsApi = createCrud<Project, ProjectCreateInput>("/projects");

/* =========================================================
   RESUMES — Cloud Storage for Resumes
   ========================================================= */

export type ResumeDocument = {
  id: string;
  title: string;
  drive_file_id?: string | null;
  created_at: string;
  updated_at: string;
};

export const resumesApi = {
  list(token: string): Promise<ResumeDocument[]> {
    return apiRequest<ResumeDocument[]>("/resumes/", { token });
  },
  
  async create(token: string, title: string, fileBlob: Blob): Promise<ResumeDocument> {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", fileBlob, "resume.enc");
    
    const res = await fetch(`${API_URL}/resumes/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error("Failed to create resume");
    }
    return res.json();
  },
  
  async update(token: string, id: string, title?: string, fileBlob?: Blob): Promise<ResumeDocument> {
    const formData = new FormData();
    if (title) formData.append("title", title);
    if (fileBlob) formData.append("file", fileBlob, "resume.enc");
    
    const res = await fetch(`${API_URL}/resumes/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error("Failed to update resume");
    }
    return res.json();
  },
  
  remove(token: string, id: string): Promise<void> {
    return apiRequest<void>(`/resumes/${id}`, { method: "DELETE", token });
  },
  
  async download(token: string, id: string): Promise<Blob> {
    const res = await fetch(`${API_URL}/resumes/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error("Failed to download resume file");
    }
    
    return res.blob();
  }
};

/** Education create payload — the only required fields. */
export type EducationCreateInput = {
  institution: string;
  degree: string;
  branch: string;
  start_date: string;
  end_date?: string | null;
  cgpa?: number | null;
};

/** Experience create payload — the only required fields. */
export type ExperienceCreateInput = {
  company: string;
  designation: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
};

/** Skill create payload — proficiency must be "Beginner" | "Intermediate" | "Expert". */
export type SkillCreateInput = {
  skill_name: string;
  proficiency: Proficiency;
};

/** Project create payload — the only required field is title. */
export type ProjectCreateInput = {
  title: string;
  description?: string | null;
  github_link?: string | null;
  github_link_text?: string | null;
};

/* =========================================================
   AI FEATURES — GitHub Repository Analyzer
   ========================================================= *//** A GitHub project that has been analyzed into resume-ready content. */
export type GitHubAnalysis = {
  project_name: string;
  description: string;
  project_type: string;
  technologies: string[];
  features: string[];
  implementation: string[];
  resume_bullets: string[];
};

export type GitHubAnalyzeResponse = {
  analysis: GitHubAnalysis;
};

/**
 * POST /api/v1/ai/github/analyze
 * Analyzes a public GitHub repository and generates resume content.
 */
export function analyzeGitHubRepo(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubAnalyzeResponse> {
  return apiRequest<GitHubAnalyzeResponse>("/ai/github/analyze", {
    method: "POST",
    token,
    body: { owner, repo },
  });
}

/**
 * POST /api/v1/ai/github/improve-bullets
 * Refines existing resume bullets for a project using the LLM.
 */
export function improveGitHubBullets(
  token: string,
  input: {
    project_name: string;
    description: string;
    technologies: string[];
    current_bullets: string[];
  }
): Promise<{ resume_bullets: string[] }> {
  return apiRequest<{ resume_bullets: string[] }>(
    "/ai/github/improve-bullets",
    {
      method: "POST",
      token,
      body: input,
    }
  );
}
