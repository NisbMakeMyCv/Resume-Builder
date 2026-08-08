/**
 * MakeMyCV — API Client Library
 *
 * Central HTTP client used by all pages/components.
 *
 * Base URL is set via NEXT_PUBLIC_API_URL.
 * Defaults to http://localhost:8000/api/v1 on the server
 * and /api/v1 in the browser.
 */

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In the browser, use relative path.
  // This can be routed through Nginx in production.
  if (typeof window !== "undefined") {
    return "/api/v1";
  }

  return "http://localhost:8000/api/v1";
}


// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;

  /**
   * Bearer token — use when you already have a JWT.
   */
  token?: string;
}


/**
 * Makes a typed API request to the FastAPI backend.
 *
 * Throws an Error with the backend's detail message
 * on non-2xx responses.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Prefer explicitly passed token.
  // Otherwise use stored session token.
  const jwt = token ?? getToken();

  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  // Normalize base URL and path.
  const baseUrl = getBaseUrl();

  const baseUrlClean = baseUrl.replace(/\/+$/, "");

  const pathClean = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${baseUrlClean}${pathClean}`;

  const response = await fetch(url, {
    method,
    headers,
    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });

  // ---------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (
        typeof errorData.detail === "string"
      ) {
        message = errorData.detail;
      } else if (
        Array.isArray(errorData.detail)
      ) {
        // FastAPI validation errors.
        message = errorData.detail
          .map(
            (error: { msg?: string }) =>
              error.msg ?? JSON.stringify(error)
          )
          .join("; ");
      }
    } catch {
      // Response body was not JSON.
      // Keep the default error message.
    }

    throw new Error(message);
  }

  // Some endpoints return 204 No Content.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}


// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = "makemycv_token";
const USER_KEY = "makemycv_user";


export interface StoredUser {
  id: string;
  email: string;
  full_name: string;
}


/**
 * Persist JWT and user profile after
 * successful login/signup.
 */
export function saveSession(
  token: string,
  user: StoredUser
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}


/**
 * Retrieve the stored JWT.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}


/**
 * Retrieve the stored user profile.
 */
export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}


/**
 * Clear all session data.
 */
export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}


// ===========================================================================
// AI — GitHub Repository Analysis
// ===========================================================================

export interface GitHubProjectAnalysis {
  project_name: string;
  description: string;
  project_type: string;
  technologies: string[];
  features: string[];
  implementation: string[];
  resume_bullets: string[];
}


export interface GitHubAnalyzeResponse {
  analysis: GitHubProjectAnalysis;
}


/**
 * Analyze a GitHub repository and generate
 * resume-ready project information.
 */
export async function analyzeGitHubRepository(
  owner: string,
  repo: string
): Promise<GitHubProjectAnalysis> {
  const response =
    await apiRequest<GitHubAnalyzeResponse>(
      "/ai/github/analyze",
      {
        method: "POST",
        body: {
          owner,
          repo,
        },
      }
    );

  return response.analysis;
}


// ===========================================================================
// AI — Improve GitHub Resume Bullets
// ===========================================================================

export interface ImproveGitHubBulletsResponse {
  resume_bullets: string[];
}


/**
 * Improve the existing AI-generated resume bullets
 * for a GitHub project.
 *
 * The project information and current bullets are sent
 * to the backend so the AI can improve the wording
 * without changing the actual project facts.
 */
export async function improveGitHubResumeBullets(
  projectName: string,
  description: string,
  technologies: string[],
  currentBullets: string[]
): Promise<string[]> {
  const response =
    await apiRequest<ImproveGitHubBulletsResponse>(
      "/ai/github/improve-bullets",
      {
        method: "POST",
        body: {
          project_name: projectName,
          description,
          technologies,
          current_bullets: currentBullets,
        },
      }
    );

  return response.resume_bullets;
}