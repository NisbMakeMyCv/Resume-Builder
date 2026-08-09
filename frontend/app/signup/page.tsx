"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MaterialIcon from "../components/MaterialIcon";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useToast } from "../components/ui/Toast";
import { apiRequest } from "@/lib/api";

/**
 * Sign Up — coded from the `sign_up` stitch frame.
 *
 * Flow: submit name/email/password → request an OTP → redirect to
 * /verify-email where the account is created with the code.
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
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-container-lowest">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-primary">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-secondary-container/40 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-primary-container/30 blur-[120px]"
        />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
      </div>

      {/* Top Nav (Brand) */}
      <header className="absolute top-0 w-full z-50 h-20 flex items-center px-8">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-headline-md font-extrabold text-white drop-shadow-md">
            MakeMyCV
          </Link>
          <Link
            href="/signin"
            className="text-label-md font-semibold text-white/90 hover:text-white hover:underline drop-shadow-md"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg mx-4 mt-12"
      >
        <div className="bg-surface/60 dark:bg-surface-container-lowest/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-8 sm:p-10 rounded-[32px] shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-headline-md font-bold text-on-surface mb-2">
              Create your account
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Build your career with confidence.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-semibold text-on-surface ml-1" htmlFor="full_name">
                Full Name
              </label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 bg-surface/50 text-on-surface focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                id="full_name"
                placeholder="John Doe"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-semibold text-on-surface ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 bg-surface/50 text-on-surface focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                id="email"
                placeholder="name@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-label-sm font-semibold text-on-surface ml-1" htmlFor="password">
                  Password
                </label>
                <input
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 bg-surface/50 text-on-surface focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
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
              <div className="space-y-1.5">
                <label className="text-label-sm font-semibold text-on-surface ml-1" htmlFor="confirm_password">
                  Confirm Password
                </label>
                <input
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 bg-surface/50 text-on-surface focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
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
            <div className="pt-4 space-y-4">
              <motion.button
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="btn-press btn-shine w-full h-12 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span>Create Account</span>
                )}
                {!loading && <MaterialIcon name="arrow_forward" className="text-[20px]" />}
              </motion.button>

              <div className="flex items-center gap-4 text-on-surface-variant my-4">
                <div className="h-px bg-outline-variant/50 flex-1" />
                <span className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant/70">
                  OR
                </span>
                <div className="h-px bg-outline-variant/50 flex-1" />
              </div>

              <GoogleAuthButton />
            </div>

            <p className="text-center text-xs text-on-surface-variant pt-4">
              By signing up, you agree to our{" "}
              <a className="text-primary hover:underline font-medium" href="#">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="text-primary hover:underline font-medium" href="#">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
