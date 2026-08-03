"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { apiRequest, saveSession } from "../../lib/api";

/**
 * Google Sign-In / Sign-Up button — used on both /signin and /signup.
 *
 * Follows backend/docs/google_login_frontend_guide.md: the official
 * GoogleLogin component returns a JWT ID-token (`credential`), which we
 * send to the backend's POST /api/v1/auth/google. The backend verifies
 * it and creates the account on first login (so this doubles as sign-up).
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set (in frontend/.env.local).
 */
export default function GoogleAuthButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="text-center">
        <p className="text-label-sm text-on-surface-variant">
          Google sign-in is not configured yet. Add{" "}
          <code className="text-primary">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
          to your environment to enable it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <GoogleLogin
        theme="outline"
        size="large"
        shape="rectangular"
        text="continue_with"
        onSuccess={async (credentialResponse) => {
          setError("");
          try {
            const idToken = credentialResponse.credential;
            if (!idToken) {
              throw new Error("Google sign-in did not return a credential.");
            }

            const res = await apiRequest<{
              access_token: string;
              token_type: string;
            }>("/auth/google", {
              method: "POST",
              body: { token: idToken },
            });

            const user = await apiRequest<{
              id: string;
              email: string;
              full_name: string;
            }>("/auth/me", { token: res.access_token });

            saveSession(res.access_token, user);
            router.push("/dashboard");
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Google sign-in failed. Please try again."
            );
          }
        }}
        onError={() => {
          setError("Google sign-in failed. Please try again.");
        }}
      />

      {error && (
        <p className="text-label-sm text-error text-center">{error}</p>
      )}
    </div>
  );
}
