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
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : "Something went wrong. Please try again.";
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

/* =========================================================
   AI FEATURES — GitHub Repository Analyzer
   ========================================================= */

/** A GitHub project that has been analyzed into resume-ready content. */
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
