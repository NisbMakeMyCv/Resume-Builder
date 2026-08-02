"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "../components/MaterialIcon";
import { apiRequest } from "../../lib/api";

/**
 * Sign Up — coded from the `sign_up` stitch frame.
 *
 * Flow: submit name/email/password → request an OTP → redirect to
 * /verify-email where the account is created with the code.
 */
export default function SignUp() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Send the verification code to the user's inbox.
      await apiRequest("/auth/request-otp", {
        method: "POST",
        body: { email: email.trim() },
      });

      // Stash details so the verify-email page can register the account.
      sessionStorage.setItem(
        "signupData",
        JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        })
      );

      router.push("/verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-background text-on-background min-h-screen flex flex-col">
      {/* Top Nav Bar (transactional — brand only) */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant h-16 flex items-center">
        <div className="max-w-[1280px] mx-auto px-8 w-full flex justify-between items-center">
          <div className="text-headline-md font-extrabold text-primary">
            MakeMyCV
          </div>
          <Link
            href="/signin"
            className="text-label-md font-semibold text-primary hover:underline"
          >
            Log In
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row pt-16 h-screen overflow-hidden">
        {/* ============ LEFT: ABSTRACT ILLUSTRATION (hidden on mobile) ============ */}
        <section className="hidden md:flex flex-1 bg-primary relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20 hero-gradient" />
          <div className="relative z-10 w-full max-w-xl px-12 text-center text-on-primary">
            <div className="mb-12 relative">
              {/* Floating Resume Preview */}
              <div className="animate-float bg-white rounded-lg w-72 mx-auto resume-shadow border border-outline-variant">
                <div className="p-6 aspect-[3/4]">
                  {/* Mock resume skeleton */}
                  <div className="h-6 w-1/2 bg-surface-container rounded-md mx-auto mb-6" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-surface-container rounded-sm" />
                    <div className="h-2 w-5/6 bg-surface-container rounded-sm" />
                    <div className="h-2 w-4/6 bg-surface-container rounded-sm" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="h-2 w-full bg-surface-container rounded-sm" />
                    <div className="h-2 w-full bg-surface-container rounded-sm" />
                    <div className="h-2 w-3/4 bg-surface-container rounded-sm" />
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="h-3 w-1/3 bg-primary/10 rounded-md" />
                    <div className="h-2 w-full bg-surface-container rounded-sm" />
                    <div className="h-2 w-2/3 bg-surface-container rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Decorative shapes */}
              <div
                className="absolute -top-10 -right-4 w-12 h-12 bg-secondary-container rounded-full opacity-30 animate-float"
                style={{ animationDelay: "-1s" }}
              />
              <div
                className="absolute top-20 -left-10 w-20 h-20 bg-primary-fixed-dim rounded-lg opacity-20 rotate-12 animate-float"
                style={{ animationDelay: "-3s" }}
              />
            </div>
          </div>
        </section>

        {/* ============ RIGHT: SIGN UP FORM ============ */}
        <section className="flex-1 flex items-center justify-center bg-background p-6 md:p-12 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-outline-variant rounded-2xl p-8 md:p-10 shadow-sm">
            <div className="mb-8">
              <h2 className="text-headline-md text-primary mb-2">
                Create your account
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Build your career with confidence.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-2">
                <label
                  className="text-label-md text-on-surface font-semibold block"
                  htmlFor="full_name"
                >
                  Full Name
                </label>
                <div className="relative">
                  <input
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
                    id="full_name"
                    placeholder="John Doe"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  className="text-label-md text-on-surface font-semibold block"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className="text-label-md text-on-surface font-semibold block"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-label-md text-on-surface font-semibold block"
                    htmlFor="confirm_password"
                  >
                    Confirm Password
                  </label>
                  <input
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
                    id="confirm_password"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-brand border border-error-container bg-error-container/40 px-4 py-3 text-label-md text-on-error-container">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4 pt-4">
                <button
                  className="btn-press w-full h-12 bg-primary-container text-white font-label-md rounded-2xl hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? "Sending Code..." : "Create Account"}</span>
                  <MaterialIcon name="arrow_forward" className="text-[20px]" />
                </button>

                <div className="flex items-center gap-4 text-on-surface-variant my-4">
                  <div className="h-px bg-outline-variant flex-1" />
                  <span className="text-label-sm uppercase tracking-wider">
                    or
                  </span>
                  <div className="h-px bg-outline-variant flex-1" />
                </div>

                <button
                  className="btn-press w-full h-12 bg-white border border-primary text-primary font-label-md rounded-2xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-3"
                  type="button"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="text-center mt-4">
                  <span className="text-label-md text-on-surface-variant">
                    Already have an account?{" "}
                  </span>
                  <Link
                    className="text-label-md text-primary font-bold hover:underline"
                    href="/signin"
                  >
                    Log In
                  </Link>
                </div>
              </div>

              <p className="text-center text-label-sm text-on-surface-variant mt-6 px-4">
                By signing up, you agree to our{" "}
                <a className="text-primary hover:underline" href="#">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-primary hover:underline" href="#">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container py-8 border-t border-outline-variant">
        <div className="max-w-[1280px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-label-sm text-on-surface-variant">
            © 2026 MakeMyCV. Made by NISB.
          </div>
          <div className="flex gap-6">
            <a
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Support
            </a>
            <a
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Privacy
            </a>
            <a
              className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
