/**
 * MakeMyCV — API Client Library
 *
 * Central HTTP client used by all pages/components.
 *
 * Backend:
 * http://127.0.0.1:8000/api/v1
 *
 * All frontend API calls should use paths such as:
 *
 *   /auth/request-otp
 *   /auth/login
 *   /auth/me
 *   /ai/resume/chat
 *   /ai/resume/conversations
 */

function getBaseUrl(): string {
  /*
   * If NEXT_PUBLIC_API_URL is defined, use it.
   *
   * Example:
   * NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
   */
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  /*
   * Browser:
   *
   * We use the FastAPI backend directly during local development.
   */
  if (typeof window !== "undefined") {
    return "http://127.0.0.1:8000/api/v1";
  }

  /*
   * Server-side fallback.
   */
  return "http://127.0.0.1:8000/api/v1";
}

/* =========================================================
   TYPES
========================================================= */

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  body?: Record<string, unknown>;

  /*
   * Optional JWT.
   *
   * If this isn't provided, the token stored in localStorage
   * will automatically be used.
   */
  token?: string;
}

/* =========================================================
   SESSION STORAGE
========================================================= */

const TOKEN_KEY = "makemycv_token";
const USER_KEY = "makemycv_user";

export interface StoredUser {
  id: string;
  email: string;
  full_name: string;
}

/* =========================================================
   GET TOKEN
========================================================= */

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

/* =========================================================
   GET STORED USER
========================================================= */

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

/* =========================================================
   SAVE SESSION
========================================================= */

export function saveSession(
  token: string,
  user: StoredUser
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}

/* =========================================================
   CLEAR SESSION
========================================================= */

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* =========================================================
   API REQUEST
========================================================= */

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
  } = options;

  /* -------------------------------------------------------
     HEADERS
  ------------------------------------------------------- */

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  /* -------------------------------------------------------
     AUTH TOKEN
  ------------------------------------------------------- */

  /*
   * Priority:
   *
   * 1. Explicit token passed to apiRequest()
   * 2. Token stored in localStorage
   */

  const jwt = token ?? getToken();

  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  /* -------------------------------------------------------
     BUILD URL
  ------------------------------------------------------- */

  const baseUrl = getBaseUrl();

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");

  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${cleanBaseUrl}${cleanPath}`;

  /* -------------------------------------------------------
     REQUEST
  ------------------------------------------------------- */

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch (error) {
    console.error(
      "API connection failed:",
      error
    );

    throw new Error(
      "Unable to connect to the MakeMyCV backend. Make sure FastAPI is running on port 8000."
    );
  }

  /* -------------------------------------------------------
     HANDLE 401
  ------------------------------------------------------- */

  if (response.status === 401) {
    /*
     * Don't immediately redirect here.
     *
     * Some pages need to handle the 401 themselves.
     *
     * We only throw a useful error.
     */

    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  /* -------------------------------------------------------
     HANDLE OTHER ERRORS
  ------------------------------------------------------- */

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (
        typeof errorData.detail === "string"
      ) {
        message = errorData.detail;
      } else if (
        Array.isArray(errorData.detail)
      ) {
        message = errorData.detail
          .map(
            (
              error: {
                msg?: string;
              }
            ) =>
              error.msg ??
              JSON.stringify(error)
          )
          .join("; ");
      } else if (
        typeof errorData.message === "string"
      ) {
        message = errorData.message;
      }
    } catch {
      /*
       * Response wasn't JSON.
       * Keep default error.
       */
    }

    throw new Error(message);
  }

  /* -------------------------------------------------------
     NO CONTENT
  ------------------------------------------------------- */

  if (response.status === 204) {
    return undefined as T;
  }

  /* -------------------------------------------------------
     JSON RESPONSE
  ------------------------------------------------------- */

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }
}

/* =========================================================
   OPTIONAL GITHUB HELPERS
========================================================= */

export async function analyzeGitHubRepository(
  owner: string,
  repo: string
) {
  const response = await apiRequest<{
    analysis: unknown;
  }>("/ai/github/analyze", {
    method: "POST",
    body: {
      owner,
      repo,
    },
  });

  return response.analysis;
}

export async function improveGitHubResumeBullets(
  projectName: string,
  description: string,
  technologies: string[],
  currentBullets: string[]
) {
  const response = await apiRequest<{
    resume_bullets: string[];
  }>("/ai/github/improve-bullets", {
    method: "POST",
    body: {
      project_name: projectName,
      description,
      technologies,
      current_bullets: currentBullets,
    },
  });

  return response.resume_bullets;
}