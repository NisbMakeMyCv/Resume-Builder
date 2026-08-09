"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MaterialIcon from "../components/MaterialIcon";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { AuthHeadlineTypewriter } from "../components/AuthHeadlineTypewriter";
import { TestimonialCarousel } from "../components/TestimonialCarousel";
import { useToast } from "../components/ui/Toast";
import { apiRequest, saveSession } from "@/lib/api";

/**
 * Sign In — coded from the `sign_in` stitch frame.
 *
 * The backend requires an OTP for login (2FA): after submitting
 * credentials we request a code and reveal an inline OTP field to
 * complete the sign-in.
 */
export default function SignIn() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Step 1 — send the 6-digit code to the user's inbox. */
  async function handleRequestOtp(e?: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) {
    if (e) e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setOtpLoading(true);
    try {
      await apiRequest("/auth/request-otp", {
        method: "POST",
        body: { email: email.trim() },
      });
      setOtpSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code.";
      setError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  }

  /** Step 2 — verify the code and sign in. */
  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError("");
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
          otp_code: code,
        },
      });

      // Fetch the profile for the header / dashboard greeting.
      const user = await apiRequest<{
        id: string;
        email: string;
        full_name: string;
      }>("/auth/me", { token: res.access_token });

      saveSession(res.access_token, user);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-[#f9f9fc] dark:bg-background">
      {/* Animated Abstract Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#d6e3ff]/60 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#7fc5fd]/40 blur-[100px]"
        />
      </div>

      {/* Top Nav (Brand) */}
      <header className="w-full z-50 h-16 sm:h-20 flex items-center px-4 sm:px-8 shrink-0">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/logo.png"
              alt="NISB-MakeMyCV Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="text-[20px] sm:text-headline-md font-bold text-primary tracking-tight whitespace-nowrap">
              NISB-MakeMyCV
            </span>
          </Link>
          <Link
            href="/signup"
            className="text-label-md font-bold text-primary hover:text-[#004080] hover:underline transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Main Grid Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1 py-4 sm:py-8 lg:py-12">
        
        {/* Left Column (Parallax Trust Showcase) - 7 Cols */}
        <div className="hidden lg:flex col-span-7 flex-col justify-center relative min-h-[500px]">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <AuthHeadlineTypewriter />
            <p className="text-body-lg text-on-surface-variant max-w-md leading-relaxed">
              Join thousands of professionals landing interviews at top tech companies using our intelligent LLM-powered resume builder.
            </p>
          </motion.div>

          <TestimonialCarousel />
        </div>

        {/* Right Column (Form Container) - 5 Cols */}
        <div className="col-span-12 lg:col-span-5 flex justify-center lg:justify-end w-full">
          {/* Glass Card Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md mx-auto lg:mx-0"
          >
            <div className="bg-white/85 dark:bg-surface-container-lowest/90 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_20px_60px_rgba(0,42,88,0.08)] p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[32px]">
          
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-headline-md font-bold text-on-surface mb-2">
              Welcome back
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Log in to your professional dashboard.
            </p>
          </div>

          <form className="space-y-4 sm:space-y-5" onSubmit={(e) => { e.preventDefault(); }}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-label-sm font-semibold text-primary ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 bg-white/50 dark:bg-surface/50 text-on-surface focus:bg-white focus:border-[#004080] focus:ring-2 focus:ring-[#004080]/20 transition-all outline-none shadow-sm"
                id="email"
                placeholder="name@company.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={otpSent}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-label-sm font-semibold text-primary" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-[11px] font-bold text-secondary hover:text-[#004080] hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-outline-variant/50 bg-white/50 dark:bg-surface/50 text-on-surface focus:bg-white focus:border-[#004080] focus:ring-2 focus:ring-[#004080]/20 transition-all outline-none shadow-sm"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={otpSent}
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

            {/* OTP Field (revealed after requesting a code) */}
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 pt-2"
              >
                <div className="flex justify-between items-center ml-1">
                  <label className="text-label-sm font-semibold text-primary block">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-secondary hover:text-[#004080] transition-colors"
                    onClick={() => setOtpSent(false)}
                  >
                    Change email
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      className="w-full aspect-square text-center text-headline-sm font-bold border border-outline-variant/50 rounded-xl bg-white/50 dark:bg-surface/50 focus:bg-white focus:border-[#004080] focus:ring-2 focus:ring-[#004080]/20 transition-all duration-200 shadow-sm"
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

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
              {otpSent ? (
                <motion.button
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  className="btn-press btn-shine w-full h-12 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                  type="button"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span>Verify & Sign In</span>
                  )}
                  {!loading && <MaterialIcon name="arrow_forward" className="text-[20px]" />}
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: otpLoading ? 1 : 0.97 }}
                  className="btn-press btn-shine w-full h-12 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                  {!otpLoading && <MaterialIcon name="arrow_forward" className="text-[20px]" />}
                </motion.button>
              )}

              <div className="flex items-center gap-4 text-on-surface-variant my-4">
                <div className="h-px bg-outline-variant/50 flex-1" />
                <span className="text-[11px] uppercase font-bold tracking-widest text-on-surface-variant/70">
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
          </form>
        </div>
      </motion.div>
        </div>
      </div>
    </main>
  );
}
