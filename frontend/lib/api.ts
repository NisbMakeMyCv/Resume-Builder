const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: any;
  token?: string;
}

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { body, token, ...customConfig } = options;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const authToken = token || getToken();
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

export function saveSession(token: string, user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("makemycv_token", token);
    localStorage.setItem("makemycv_user", JSON.stringify(user));
  }
}

export function getStoredUser() {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("makemycv_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("makemycv_token");
  }
  return null;
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("makemycv_token");
    localStorage.removeItem("makemycv_user");
  }
}
