"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedData = sessionStorage.getItem("signupData");

    if (storedData) {
      try {
        const data = JSON.parse(storedData);

        if (data.email) {
          setEmail(data.email);
        }
      } catch {
        console.log("Unable to read signup data.");
      }
    }
  }, []);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = value;

    setOtp(updatedOtp);

    if (value && index < 5) {
      document
        .getElementById(`otp-${index + 1}`)
        ?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      document
        .getElementById(`otp-${index - 1}`)
        ?.focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");

    /*
      FRONTEND TEST FLOW

      We are not checking a real OTP yet.

      Later:
      1. Send OTP to backend
      2. Backend verifies OTP
      3. Backend creates account
      4. Navigate to signin
    */

    if (enteredOtp.length !== 6) {
      alert("Please enter the 6-digit verification code.");
      return;
    }

    // Frontend-only navigation for now
    window.location.href = "/signin";
  };

  const handleResend = () => {
    alert("OTP resend will be connected to the backend later.");
  };

  return (
    <main className="min-h-screen bg-[#f8f8ff] text-[#10152b]">

      {/* NAVBAR */}
      <nav className="border-b border-[#e8e8f2] bg-white/90 backdrop-blur-md">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">

          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            📄 MakeMyCV
          </Link>

          <Link
            href="/signin"
            className="text-sm font-medium text-gray-600 transition hover:text-[#5424e8]"
          >
            Back to Sign In
          </Link>

        </div>

      </nav>


      {/* MAIN */}
      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* ICON */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ebe7ff] text-2xl shadow-sm">
            ✉️
          </div>


          {/* HEADING */}
          <div className="mt-6 text-center">

            <h1 className="text-3xl font-bold tracking-tight">
              Verify Your Email
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
              We've sent a 6-digit verification code to your
              email address. Enter it below to continue.
            </p>

          </div>


          {/* CARD */}
          <div className="mt-8 rounded-2xl border border-[#e8e8f2] bg-white p-7 shadow-xl">

            {/* EMAIL */}
            <div className="rounded-lg bg-[#f7f6ff] px-4 py-3 text-center">

              <p className="text-xs text-gray-500">
                Verification code sent to
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-[#5424e8]">
                {email || "your-email@example.com"}
              </p>

            </div>


            {/* OTP */}
            <div className="mt-7">

              <label className="text-sm font-medium">
                Enter verification code
              </label>

              <div className="mt-3 flex justify-center gap-2 sm:gap-3">

                {otp.map((digit, index) => (

                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleChange(
                        e.target.value,
                        index
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, index)
                    }
                    className="h-12 w-11 rounded-lg border border-gray-200 bg-gray-50 text-center text-lg font-semibold outline-none transition focus:border-[#5424e8] focus:bg-white focus:ring-2 focus:ring-[#5424e8]/10 sm:h-14 sm:w-12"
                  />

                ))}

              </div>

            </div>


            {/* VERIFY */}
            <button
              type="button"
              onClick={handleVerify}
              className="interactive-button mt-7 w-full cursor-pointer rounded-lg bg-gradient-to-r from-[#4f22df] to-[#7b1fe8] px-6 py-3 text-sm font-semibold text-white shadow-lg"
            >
              Verify Email →
            </button>


            {/* RESEND */}
            <div className="mt-6 text-center">

              <p className="text-xs text-gray-500">
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={handleResend}
                className="mt-2 text-sm font-semibold text-[#5424e8] transition hover:text-[#7b1fe8]"
              >
                Resend OTP
              </button>

            </div>


            {/* CHANGE EMAIL */}
            <div className="mt-5 border-t border-gray-100 pt-5 text-center">

              <Link
                href="/signup"
                className="text-xs text-gray-500 transition hover:text-[#5424e8]"
              >
                ← Change email address
              </Link>

            </div>

          </div>


          {/* SECURITY */}
          <p className="mt-6 text-center text-xs text-gray-400">
            🔒 Your information is securely protected.
          </p>

        </div>

      </section>

    </main>
  );
}