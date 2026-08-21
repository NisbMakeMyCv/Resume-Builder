"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { apiRequest, saveSession } from "../../lib/api";
import SuccessBurst from "./SuccessBurst";

/** Official multicolor Google "G" mark. */
function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Google Sign-In / Sign-Up button — used on both /signin and /signup.
 *
 * Renders a custom modern button (official G mark + hover/press/focus states)
 * that drives the same ID-token → POST /api/v1/auth/google flow via
 * useGoogleLogin. The implicit flow's `access_token` IS the ID token, so the
 * backend contract is unchanged.
 */
export default function GoogleAuthButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
    "162439018220-2gn11m76oek6vspri9b8q794pdcdll91.apps.googleusercontent.com";

  if (!clientId) {
    return (
      <div className="text-center">
        <p className="text-label-sm text-on-surface-variant">
          Google sign-in is not configured yet. Add{" "}
          <code className="text-primary">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to
          your environment to enable it.
        </p>
      </div>
    );
  }

  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      setError("");
      try {
        const idToken = tokenResponse.access_token; // implicit flow → ID token
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
          profile_picture: string | null;
        }>("/auth/me", { token: res.access_token });

        saveSession(res.access_token, user);
        setCelebrate(true);
        setTimeout(() => router.push("/dashboard"), 1400);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Google sign-in failed. Please try again."
        );
      }
    },
    onError: () => setError("Google sign-in failed. Please try again."),
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => login()}
        className="group flex w-full items-center justify-center gap-3 px-6 py-2.5 sm:py-3.5 rounded-lg border border-gray-300 bg-white text-label-md font-semibold text-on-surface transition-all duration-200 hover:bg-gray-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm hover:shadow"
      >
        <GoogleIcon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-105" />
        <span>Continue with Google</span>
      </button>

      {error && (
        <p className="text-label-sm text-error text-center">{error}</p>
      )}
      {celebrate && <SuccessBurst message="Signed in successfully!" />}
    </div>
  );
}
