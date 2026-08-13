"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import MaterialIcon from "../components/MaterialIcon";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { AuthHeadlineTypewriter } from "../components/AuthHeadlineTypewriter";
import { TestimonialCarousel } from "../components/TestimonialCarousel";
import { useToast } from "../components/ui/Toast";
import { apiRequest } from "@/lib/api";

/**
 * Sign Up — coded from the `sign_up` stitch frame.
 *
 * Flow: submit name/email/password → request an OTP → redirect to
 * /verify-email where the account is created with the code. That page
 * stores the returned JWT and redirects straight to /dashboard — the user
 * is signed in as soon as they verify, with no separate login step.
 */
export default function SignUp() {
  const router = useRouter();
  const toast = useToast();

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

      toast.info("Verification code sent — check your inbox.");
      router.push("/verify-email");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-enter bg-background text-on-background min-h-[100dvh] flex flex-col justify-between">
      {/* Top Nav Bar (transactional — brand only) */}
      <header className="w-full shrink-0 bg-white border-b border-outline-variant h-14 sm:h-16 flex items-center">
        <div className="w-full px-4 sm:px-8 flex justify-between items-center">
          <Logo />
          <Link
            href="/signin"
            className="btn-outline inline-flex items-center text-[13px] sm:text-label-md font-semibold px-4 sm:px-5 py-1.5 sm:py-2 rounded-full"
          >
            Log In
          </Link>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* ============ LEFT: ABSTRACT ILLUSTRATION (hidden on mobile) ============ */}
        <section className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
          {/* Real-world dark/blue background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/signup-team.jpg')" }}
          />
          {/* Dark blue overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/70" />
          <div className="absolute inset-0 opacity-20 hero-gradient" />

          {/* Floating ambient orbs */}
          <motion.div
            className="absolute top-20 -left-16 w-64 h-64 bg-secondary-container/25 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-24 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Atmospheric glow — breathing so the backdrop never sits still */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container/20 blur-[120px] rounded-full animate-breathe" />

          {/* Hero headline — persuasive copy with a live-typing role */}
          <div className="relative z-10 w-full max-w-2xl px-8 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="font-headline-lg text-[34px] lg:text-[46px] leading-[1.15] font-bold text-white">
                Build a resume that lands your next{" "}
                <span className="inline-block text-secondary-container">
                  <Typewriter words={ROLES} />
                  <motion.span
                    className="inline-block w-[3px] h-[0.95em] bg-secondary-container ml-1 align-middle"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 1] }}
                  />
                </span>
              </h1>
              <p className="mt-5 text-body-lg text-on-primary-container/90 max-w-lg mx-auto">
                Pick the Jake template, tell your story, and let our AI polish
                the details — recruiter-ready in minutes.
              </p>
            </motion.div>
          </div>

          {/* Atmospheric glow */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container/20 blur-[120px] rounded-full animate-breathe" />
        </section>

        {/* ============ RIGHT: SIGN UP FORM ============ */}
        <section className="auth-panel lg:w-1/2 w-full flex flex-col justify-center relative bg-slate-50 overflow-y-auto lg:overflow-hidden min-h-[calc(100dvh-4rem)]">
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
            <div className="ambient-card relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl ring-1 ring-black/5 space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="mb-3 lg:mb-4 text-center lg:text-left">
                <h2 className="text-2xl sm:text-headline-md text-primary font-semibold mb-1">
                  Create your account
                </h2>
                <p className="text-body-md text-on-surface-variant">
                  Build your career with confidence.
                </p>
              </div>

            <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-1 sm:space-y-1.5">
                <label
                  className="text-label-md text-on-surface font-semibold block"
                  htmlFor="full_name"
                >
                  Full Name
                </label>
                <div className="relative">
                  <input
                    className="w-full h-10 sm:h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
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
              <div className="space-y-1 sm:space-y-1.5">
                <label
                  className="text-label-md text-on-surface font-semibold block"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    className="w-full h-10 sm:h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Password Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                <div className="space-y-1 sm:space-y-1.5">
                  <label
                    className="text-label-md text-on-surface font-semibold block"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    className="w-full h-10 sm:h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
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
                <div className="space-y-1 sm:space-y-1.5">
                  <label
                    className="text-label-md text-on-surface font-semibold block"
                    htmlFor="confirm_password"
                  >
                    Confirm Password
                  </label>
                  <input
                    className="w-full h-10 sm:h-12 px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none bg-white text-body-md"
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
              <div className="space-y-3 pt-2">
                <button
                  className="btn-primary btn-shine btn-magnetic w-full h-10 sm:h-12 rounded-2xl font-label-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  <span>{loading ? "Sending Code..." : "Create Account"}</span>
                  <MaterialIcon name="arrow_forward" className="text-[20px]" />
                </button>

                <div className="flex items-center gap-4 text-on-surface-variant my-2 lg:my-3">
                  <div className="h-px bg-outline-variant flex-1" />
                  <span className="text-label-sm uppercase tracking-wider text-[10px] sm:text-xs">
                    or
                  </span>
                  <div className="h-px bg-outline-variant flex-1" />
                </div>

                <GoogleAuthButton />

                <div className="text-center mt-3">
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
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="shrink-0 bg-surface-container py-3 border-t border-outline-variant">
        <div className="w-full px-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="text-label-sm text-on-surface-variant">
            © 2026 NISB-MakeMyCV. Made by NISB.
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

      {/* Removed duplicate form block left by merge conflict */}
    </main>
  );
}

/* =========================================================
   LOCAL HELPERS — hero copy animation + floating badges
   ========================================================= */

const ROLES = [
  "UI/UX Design role",
  "Full-Stack Web Dev job",
  "Engineering position",
  "Product Designer role",
];

/** Typewriter — types a word, pauses, erases, moves to the next. */
function useTypewriter(
  words: readonly string[],
  typeSpeed = 65,
  deleteSpeed = 35,
  pause = 1800
) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex % words.length];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === current) {
      // full word shown — hold, then start deleting
      timer = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && text === "") {
      // fully erased — move to next word (deferred so the effect never
      // synchronously writes state)
      timer = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      }, typeSpeed);
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

/** Gently bobbing badge — floats up/down forever, fades in first. */
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
