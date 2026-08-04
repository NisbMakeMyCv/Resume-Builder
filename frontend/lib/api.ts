/**
 * MakeMyCV — API Client Library
 *
 * Central HTTP client used by all pages/components.
 * Base URL is set via NEXT_PUBLIC_API_URL (defaults to http://localhost:8000/api/v1).
 *
 * Usage:
 *   import { apiRequest, saveSession, getToken, getStoredUser, clearSession } from "@/lib/api";
 */

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // In the browser, default to relative path /api/v1 (routed via Nginx)
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
  /** Bearer token — use when you already have a JWT. */
  token?: string;
}

/**
 * Makes a typed API request to the FastAPI backend.
 *
 * Throws an `Error` with the backend's `detail` message on non-2xx responses
 * so callers can do: `catch (err) { setError(err.message) }`.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Prefer explicitly passed token, fall back to stored session token.
  const jwt = token ?? getToken();
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  }

  // Normalize base URL and path to avoid double-slash or missing-slash issues
  const baseUrl = getBaseUrl();
  const baseUrlClean = baseUrl.replace(/\/+$/, "");
  const pathClean = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrlClean}${pathClean}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        // FastAPI validation error — join all messages
        message = errorData.detail
          .map((e: { msg?: string }) => e.msg ?? JSON.stringify(e))
          .join("; ");
      }
    } catch {
      /* response body wasn't JSON — keep the default message */
    }
    throw new Error(message);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Session helpers (localStorage — survives page refreshes)
// ---------------------------------------------------------------------------

const TOKEN_KEY = "makemycv_token";
const USER_KEY = "makemycv_user";

export interface StoredUser {
  id: string;
  email: string;
  full_name: string;
}

/** Persist JWT and user profile after a successful login/signup. */
export function saveSession(token: string, user: StoredUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Retrieve the stored JWT, or `null` if none exists. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Retrieve the stored user profile object, or `null` if none exists. */
export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

/** Clear all session data (called on sign-out). */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
