"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import MaterialIcon from "../components/MaterialIcon";
import GoogleAuthButton from "../components/GoogleAuthButton";
import SuccessBurst from "../components/SuccessBurst";
import { useToast } from "../components/ui/Toast";
import { apiRequest, saveSession } from "../../lib/api";

/**
 * Sign In — coded from the `sign_in` stitch frame.
 *
 * Single-step email + password login: POST /auth/login returns a JWT
 * immediately, which is stored and the user is sent to /profile.
 * No verification-code step on sign-in.
 */
export default function SignIn() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<{
        access_token: string;
        token_type: string;
      }>("/auth/login", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
        },
      });

      // Fetch the profile for the header / dashboard greeting.
      const user = await apiRequest<{
        id: string;
        email: string;
        full_name: string;
        profile_picture: string | null;
      }>("/auth/me", { token: res.access_token });

      saveSession(res.access_token, user);
      setCelebrate(true);
      setTimeout(() => router.push("/profile"), 1400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-enter flex min-h-[100dvh] bg-surface-bright text-on-surface antialiased flex-col">
      {/* Top Nav Bar (transactional — brand only) */}
      <header className="shrink-0 bg-white border-b border-outline-variant h-14 sm:h-16 flex items-center relative z-50">
        <div className="w-full px-4 sm:px-8 flex justify-between items-center">
          <Logo />
          <Link
            href="/signup"
            className="btn-outline inline-flex items-center text-[13px] sm:text-label-md font-semibold px-4 sm:px-5 py-1.5 sm:py-2 rounded-full"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
      {/* ============ LEFT: ABSTRACT ILLUSTRATION & BRANDING ============ */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        {/* Real-world dark/blue background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/signin-desk.jpg')" }}
        />
        {/* Dark blue overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/70" />
        <div className="absolute inset-0 opacity-40 mix-blend-overlay hero-gradient" />

        {/* Floating decorative orbs */}
        <motion.div
          className="absolute top-16 -left-16 w-72 h-72 bg-secondary-container/30 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 p-16 flex flex-col justify-between w-full h-full">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-headline-lg text-on-primary-container tracking-tight font-bold">
              NISB-MakeMyCV
            </h1>
            <p className="mt-4 text-body-lg text-on-primary-container opacity-80 max-w-md">
              One clean, recruiter-approved template. Write your story, let the
              AI polish the details, and get hired.
            </p>
          </motion.div>

          {/* Sleek, dynamic feature showcase instead of the static resume */}
          <div className="my-auto py-8">
            <motion.div
              className="text-left space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight">
                Empowering your career growth:
              </h2>
              <div className="h-16 flex items-center">
                <span className="text-xl lg:text-2xl text-secondary-container font-semibold">
                  <Typewriter words={VALUE_PROPS} />
                  <motion.span
                    className="inline-block w-[3px] h-[0.95em] bg-secondary-container ml-1 align-middle"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 1] }}
                  />
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4 bg-primary/20 p-6 rounded-brand backdrop-blur-sm border border-white/10">
              <MaterialIcon
                name="verified"
                className="text-on-primary-container text-4xl"
                filled
              />
              <div>
                <p className="text-label-md text-on-primary-container">
                  ATS-Friendly
                </p>
                <p className="text-body-md text-on-primary-container opacity-70">
                  Your resume reads perfectly for both machines and recruiters.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Atmospheric glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container blur-[120px] rounded-full opacity-20 animate-breathe" />
      </section>

      {/* ============ RIGHT: SIGN IN FORM ============ */}
      <section className="auth-panel w-full lg:w-1/2 flex flex-col justify-center relative bg-slate-50 overflow-y-auto lg:overflow-hidden min-h-[calc(100dvh-4rem)]">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none" 
          style={{
            backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />
        
        {/* Ambient background blur blobs */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-drift" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none animate-drift-slow" />

        <div className="w-full flex items-center justify-center p-3 sm:p-6 md:p-10 relative z-10 my-auto">
          {/* Elevate the login form on an entrance-animated card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[440px] px-2 sm:px-0"
          >
          <div className="space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-headline-md text-on-surface font-semibold">Sign In</h2>
            <p className="text-body-md text-on-surface-variant mt-1.5">
              Enter your credentials to access your professional dashboard.
            </p>
          </div>

          {/* B9 FIX: Single <form> wraps EVERYTHING so Enter-key submission works */}
          <form onSubmit={handleSubmit}>
          <div className="ambient-card bg-white/90 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-100 space-y-3 sm:space-y-4 lg:space-y-6 shadow-2xl ring-1 ring-black/5">
            {/* Email Field */}
            <div className="space-y-1 sm:space-y-2">
              <label
                className="text-label-md text-on-surface-variant block"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <MaterialIcon
                  name="mail"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]"
                />
                <input
                  className="w-full pl-12 pr-4 py-2.5 sm:py-3.5 bg-white border border-outline-variant rounded-brand font-body-md text-on-surface input-focus-ring placeholder:text-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-200"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-label-md text-on-surface-variant block"
                  htmlFor="password"
                >
                  Password
                </label>
                <a href="/signin/forgot-password" className="text-[11px] font-bold text-secondary hover:text-[#004080] hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  className="w-full pl-12 pr-12 py-2.5 sm:py-3.5 bg-white border border-outline-variant rounded-brand font-body-md text-on-surface input-focus-ring placeholder:text-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-200"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <MaterialIcon
                    name={showPassword ? "visibility_off" : "visibility"}
                    className="text-[20px]"
                  />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-label-md text-on-error-container flex items-center gap-2"
              >
                <MaterialIcon name="error" className="text-error text-[18px]" />
                {error}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-1 sm:pt-2">
              <button
                className="btn-primary btn-shine btn-magnetic w-full py-2.5 sm:py-3.5 rounded-brand font-label-md flex items-center justify-center gap-2 hover:shadow-md hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? "Signing In..." : "Sign In"}</span>
                {loading ? (
                  <MaterialIcon
                    name="sync"
                    className="animate-spin text-[18px]"
                  />
                ) : (
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                )}
              </button>

              <div className="relative flex items-center py-1 sm:py-1.5">
                <div className="flex-grow border-t border-outline-variant" />
                <span className="flex-shrink mx-4 text-[10px] text-on-surface-variant uppercase tracking-widest">
                  or
                </span>
                <div className="h-px bg-outline-variant/50 flex-1" />
              </div>

              <GoogleAuthButton />
            </div>

            <p className="text-center text-xs text-on-surface-variant pt-4">
              Don&apos;t have an account?{" "}
              <Link className="text-primary hover:underline font-bold" href="/signup">
                Sign Up
              </Link>
            </p>
          </div>
          </form>
        </div>
        </motion.div>
        </div>

        {/* Bottom footer pinned to the bottom of the page */}
        <footer className="px-8 py-5 border-t border-outline-variant flex flex-col md:flex-row items-center justify-center gap-x-6 gap-y-2 text-center">
          <a
            className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
            href="/privacy"
          >
            Privacy Policy
          </a>
          <a
            className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
            href="/terms"
          >
            Terms of Service
          </a>
          <a
            className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
            href="mailto:support@nisb.org"
          >
            Contact
          </a>
        </footer>
      </section>
      </div>

      {celebrate && <SuccessBurst message="Welcome back!" />}
    </main>
  );
}

/* =========================================================
   LOCAL HELPERS — stats cycler typewriter + floating badges
   ========================================================= */

// U14 FIX: Removed fictional social proof stats ("10k+ Resumes", "4.9/5 Rating")
// Replace with real messaging that matches the actual product state
const VALUE_PROPS = [
  "🎯 ATS-Optimized Resume Builder",
  "✨ AI-Powered Bullet Writing",
  "📁 Encrypted Cloud Resume Vault",
  "🔗 GitHub Repo → Resume in Seconds",
];

function useTypewriter(
  words: readonly string[],
  typeSpeed = 60,
  deleteSpeed = 30,
  pause = 2000
) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex % words.length];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === current) {
      timer = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && text === "") {
      // fully erased — move to next word (deferred so the effect never
      // synchronously writes state)
      timer = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      }, deleteSpeed);
    } else {
      timer = setTimeout(
        () =>
          setText(current.slice(0, text.length + (isDeleting ? -1 : 1))),
        isDeleting ? deleteSpeed : typeSpeed
      );
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, typeSpeed, deleteSpeed, pause]);

  return text;
}

function Typewriter({ words }: { words: readonly string[] }) {
  return <span>{useTypewriter(words)}</span>;
}

function FloatBadge({
  className = "",
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={`absolute z-20 ${className}`}
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: [10, -10, 10] }}
      transition={{
        opacity: { delay: 0.9, duration: 0.4 },
        scale: { delay: 0.9, duration: 0.4, type: "spring", stiffness: 220 },
        y: {
          delay: delay + 1,
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {children}
    </motion.div>
  );
}
