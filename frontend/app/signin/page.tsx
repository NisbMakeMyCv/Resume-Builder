"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "../components/MaterialIcon";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { apiRequest, saveSession } from "../../lib/api";

/**
 * Sign In — coded from the `sign_in` stitch frame.
 *
 * The backend requires an OTP for login (2FA): after submitting
 * credentials we request a code and reveal an inline OTP field to
 * complete the sign-in.
 */
export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Step 1 — send the 6-digit code to the user's inbox. */
  async function handleRequestOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      setError(err instanceof Error ? err.message : "Failed to send code.");
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
      setError(err instanceof Error ? err.message : "Sign in failed.");
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
    <main className="flex min-h-screen bg-surface-bright text-on-surface antialiased">
      {/* ============ LEFT: ABSTRACT ILLUSTRATION & BRANDING ============ */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary-container overflow-hidden">
        {/* Animated shader layer */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay hero-gradient" />

        <div className="relative z-10 p-16 flex flex-col justify-between w-full">
          <div>
            <h1 className="text-headline-lg text-on-primary-container tracking-tight">
              MakeMyCV
            </h1>
            <p className="mt-4 text-body-lg text-on-primary-container opacity-80 max-w-md">
              One clean, recruiter-approved template. Write your story, let the
              AI polish the details, and get hired.
            </p>
          </div>

          <div className="space-y-6">
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
          </div>
        </div>

        {/* Atmospheric glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-container blur-[120px] rounded-full opacity-30" />
      </section>

      {/* ============ RIGHT: SIGN IN FORM ============ */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-surface-container-lowest">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-8">
              <h1 className="text-headline-md text-primary font-bold">
                MakeMyCV
              </h1>
            </div>
            <h2 className="text-headline-md text-on-surface">Sign In</h2>
            <p className="text-body-md text-on-surface-variant mt-2">
              Enter your credentials to access your professional dashboard.
            </p>
          </div>

          {/* Sign In Card */}
          <div className="bg-white p-2 rounded-brand space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
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
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-brand font-body-md text-on-surface input-focus-ring placeholder:text-outline-variant"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-label-md text-on-surface-variant block"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="text-label-sm text-secondary hover:text-primary transition-colors"
                  href="#"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <MaterialIcon
                  name="lock"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]"
                />
                <input
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-outline-variant rounded-brand font-body-md text-on-surface input-focus-ring placeholder:text-outline-variant"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={otpSent}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
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
              <div className="space-y-2 entrance-fade-up">
                <div className="flex justify-between items-center">
                  <label className="text-label-md text-on-surface-variant block">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    className="text-label-sm text-secondary hover:text-primary transition-colors"
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
                      className="otp-input w-full aspect-square text-center text-headline-md font-bold border border-outline-variant rounded-lg bg-surface focus:border-primary transition-all duration-200"
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      type="text"
                      value={digit}
                      onChange={(e) =>
                        handleOtpChange(e.target.value, index)
                      }
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-brand border border-error-container bg-error-container/40 px-4 py-3 text-label-md text-on-error-container">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 pt-2">
              {otpSent ? (
                <button
                  className="btn-press btn-shine w-full py-4 bg-primary text-on-primary rounded-brand font-label-md shadow-lg shadow-primary/10 hover:bg-primary-container flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  <span>{loading ? "Signing In..." : "Verify & Sign In"}</span>
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </button>
              ) : (
                <form onSubmit={handleRequestOtp}>
                  <button
                    className="btn-press btn-shine w-full py-4 bg-primary text-on-primary rounded-brand font-label-md shadow-lg shadow-primary/10 hover:bg-primary-container flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={otpLoading}
                  >
                    <span>
                      {otpLoading ? "Sending Code..." : "Send Verification Code"}
                    </span>
                    <MaterialIcon name="arrow_forward" className="text-[18px]" />
                  </button>
                </form>
              )}

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-outline-variant" />
                <span className="flex-shrink mx-4 text-label-sm text-on-surface-variant uppercase tracking-widest">
                  or
                </span>
                <div className="flex-grow border-t border-outline-variant" />
              </div>

              <GoogleAuthButton />
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center space-y-6">
            <p className="text-body-md text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link
                className="text-primary font-semibold hover:underline"
                href="/signup"
              >
                Sign Up
              </Link>
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4">
              <a
                className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#"
              >
                Terms of Service
              </a>
              <a
                className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                href="#"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
