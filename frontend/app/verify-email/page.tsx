"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MaterialIcon from "../components/MaterialIcon";
import { apiRequest } from "@/lib/api";

/**
 * Verify Email / OTP — coded from the `otp_verification` stitch frame.
 *
 * This page both shows the 6-digit entry and — when reached from signup —
 * registers the account with the backend using the stashed signup data.
 * (Sign-in with an existing account verifies the code inline on /signin.)
 */
export default function VerifyEmail() {
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"signup" | "none">("none");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const storedData = sessionStorage.getItem("signupData");
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.email) {
          setEmail(data.email);
          setMode("signup");
        }
      } catch {
        /* malformed storage — treat as no pending signup */
      }
    }
  }, []);

  /** Register (signup flow) or simply proceed when the code is 6 digits. */
  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits of your verification code.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const storedData = sessionStorage.getItem("signupData");
        if (!storedData) throw new Error("Signup session expired. Please try again.");
        const data = JSON.parse(storedData);

        await apiRequest("/auth/register", {
          method: "POST",
          body: {
            full_name: data.fullName,
            email: data.email,
            password: data.password,
            otp_code: code,
          },
        });
        sessionStorage.removeItem("signupData");
        router.push("/signin");
      } else {
        // No pending signup — this page was reached directly. Nothing to do.
        router.push("/signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setLoading(false);
    }
  }

  /** Resend the code (and restart the cooldown timer). */
  async function handleResend() {
    if (!email || resendCooldown > 0) return;
    try {
      await apiRequest("/auth/request-otp", {
        method: "POST",
        body: { email },
      });
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    }
  }

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <main className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
      {/* Top Nav Bar (transactional — brand only) */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant">
        <div className="w-full px-8 h-16 flex items-center">
          <span className="text-headline-md font-bold text-primary">
            MakeMyCV
          </span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-8 pt-20 pb-12">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-[20px] p-8 md:p-12 entrance-fade-up">
          {/* Success Illustration */}
          <div className="flex justify-center mb-8 entrance-fade-up">
            <div className="w-24 h-24 bg-secondary-fixed rounded-full flex items-center justify-center">
              <MaterialIcon
                name="mark_email_read"
                className="text-primary text-[48px]"
                filled
              />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-10">
            <h1 className="text-headline-md text-on-surface mb-2">
              Verify your email
            </h1>
            <p className="text-body-md text-on-surface-variant">
              We&apos;ve sent a 6-digit code to your inbox. Please enter it
              below to secure your MakeMyCV account.
              {email ? (
                <>
                  {" "}
                  <span className="font-semibold text-primary">
                    ({email})
                  </span>
                </>
              ) : null}
            </p>
          </div>

          {/* OTP Inputs — grid keeps 6 boxes inside the card on any width */}
          <div
            className="grid grid-cols-6 gap-2 md:gap-3 mb-10"
            id="otp-container"
          >
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
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={loading}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-[20px] border border-error-container bg-error-container/40 px-4 py-3 text-label-md text-on-error-container">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <button
              className="btn-shine w-full h-14 bg-primary-container text-on-tertiary font-label-md rounded-full hover:bg-[#006699] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              id="verify-btn"
              type="button"
              onClick={handleVerify}
              disabled={loading}
            >
              <span>
                {loading ? "Verifying..." : "Verify Account"}
              </span>
              {loading ? (
                <MaterialIcon name="sync" className="animate-spin text-[20px]" />
              ) : (
                <MaterialIcon name="check_circle" className="text-[20px]" />
              )}
            </button>

            <div className="text-center">
              <p className="text-label-md text-on-surface-variant">
                Didn&apos;t receive the code?{" "}
                <button
                  className="text-primary font-bold hover:underline ml-1 disabled:opacity-50"
                  id="resend-btn"
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || !email}
                >
                  {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Resend Code"}
                </button>
              </p>
            </div>
          </div>

          {/* Security Trust */}
          <div className="mt-12 pt-8 border-t border-outline-variant flex items-center justify-center gap-4 text-on-tertiary-container">
            <div className="flex items-center gap-1">
              <MaterialIcon name="lock" className="text-[16px]" />
              <span className="text-label-sm">Secured</span>
            </div>
            <div className="w-1 h-1 bg-outline-variant rounded-full" />
            <div className="flex items-center gap-1">
              <MaterialIcon name="shield" className="text-[16px]" />
              <span className="text-label-sm">Privacy Guaranteed</span>
            </div>
          </div>

          {/* Change email (only meaningful during signup) */}
          {mode === "signup" && (
            <div className="mt-8 text-center">
              <Link
                href="/signup"
                className="text-label-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                ← Change email address
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container border-t border-outline-variant mt-auto">
        <div className="w-full px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6 text-on-surface-variant font-label-sm">
          <span>© 2026 MakeMyCV. Made by NISB.</span>
          <div className="flex gap-6">
            <a className="hover:underline" href="#">
              Support
            </a>
            <a className="hover:underline" href="#">
              Terms of Service
            </a>
            <a className="hover:underline" href="#">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
