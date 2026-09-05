"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * Client-side Google OAuth provider. Mounts <GoogleOAuthProvider> so the
 * GoogleLogin component works on the /signin and /signup pages.
 *
 * The client ID is read from NEXT_PUBLIC_GOOGLE_CLIENT_ID. When it isn't
 * configured the provider still renders children (GoogleAuthButton shows a
 * friendly "not configured" note instead of the button).
 */
const FALLBACK_GOOGLE_CLIENT_ID =
  "162439018220-2gn11m76oek6vspri9b8q794pdcdll91.apps.googleusercontent.com";

export default function GoogleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientId = (rawClientId ? rawClientId.trim() : "") || FALLBACK_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
