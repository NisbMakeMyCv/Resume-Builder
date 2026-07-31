"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f8ff] text-[#10152b]">

      {/* ================= NAVBAR ================= */}
      <nav className="border-b border-[#e8e8f2] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">

          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            📄 MakeMyCV
          </Link>

          {/* Back to Home */}
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 transition hover:text-[#5424e8]"
          >
            ← Back to Home
          </Link>

        </div>
      </nav>


      {/* ================= MAIN ================= */}
      <section className="relative min-h-[calc(100vh-64px)] overflow-hidden">

        {/* Background glow */}
        <div className="pointer-events-none absolute left-[-150px] top-20 h-[400px] w-[400px] rounded-full bg-purple-300/20 blur-[120px]" />

        <div className="pointer-events-none absolute right-[-120px] bottom-0 h-[450px] w-[450px] rounded-full bg-violet-300/20 blur-[120px]" />


        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-16 px-6 py-14 lg:grid-cols-2 lg:px-10">

          {/* =====================================================
              LEFT — SIGN IN FORM
          ====================================================== */}

          <div className="mx-auto w-full max-w-md">

            {/* Small badge */}
            <div className="mb-6 inline-flex rounded-full bg-[#ebe7ff] px-4 py-2 text-xs font-medium text-[#5424e8]">
              ✨ Welcome Back
            </div>


            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Sign in to
              <br />
              <span className="bg-gradient-to-r from-[#4521d8] to-[#8b20ed] bg-clip-text text-transparent">
                MakeMyCV.
              </span>
            </h1>


            <p className="mt-4 text-sm leading-6 text-gray-500">
              Continue building your ATS-ready resume and get one step closer
              to your next opportunity.
            </p>


            {/* ================= FORM CARD ================= */}

            <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-7 shadow-[0_20px_60px_rgba(70,40,160,0.10)] md:p-8">

              <form className="space-y-5">

                {/* Email */}
                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                  />

                </div>


                {/* Password */}
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-purple-600 hover:text-purple-800"
                    >
                      Forgot password?
                    </Link>

                  </div>


                  <div className="relative">

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                    />


                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 transition hover:text-purple-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                </div>


                {/* Remember me */}
                <div className="flex items-center gap-2">

                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-purple-600"
                  />

                  <label
                    htmlFor="remember"
                    className="text-xs text-gray-500"
                  >
                    Remember me
                  </label>

                </div>


                {/* Sign In */}
                <button
                  type="submit"
                  className="interactive-button w-full rounded-xl bg-gradient-to-r from-[#4f22df] to-[#7b1fe8] px-5 py-3.5 text-sm font-semibold text-white shadow-lg"
                >
                  Sign In →
                </button>

              </form>


              {/* Divider */}
              <div className="my-6 flex items-center gap-4">

                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-xs text-gray-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-gray-200" />

              </div>


              {/* Google */}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:border-purple-200 hover:bg-purple-50"
              >

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">
                  G
                </span>

                Continue with Google

              </button>


              {/* Sign up */}
              <p className="mt-7 text-center text-sm text-gray-500">

                Don't have an account?{" "}

                <Link
                  href="/signup"
                  className="font-semibold text-purple-600 hover:text-purple-800"
                >
                  Create one
                </Link>

              </p>

            </div>


            {/* Trust text */}
            <div className="mt-6 flex justify-center gap-5 text-[11px] text-gray-400">

              <span>🔒 Secure</span>

              <span>•</span>

              <span>ATS Optimized</span>

              <span>•</span>

              <span>AI Powered</span>

            </div>

          </div>


          {/* =====================================================
              RIGHT — PRODUCT VISUAL
          ====================================================== */}

          <div className="relative hidden min-h-[560px] items-center justify-center lg:flex">

            {/* Glow */}
            <div className="absolute h-[400px] w-[400px] rounded-full bg-purple-300/20 blur-[100px]" />


            {/* Main resume card */}
            <div className="hero-dashboard relative z-10 w-[500px] rounded-[24px] border border-white bg-white p-5 shadow-[0_30px_80px_rgba(70,40,160,0.15)]">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-violet-600">
                    👩🏻‍💻
                  </div>

                  <div>

                    <div className="text-sm font-bold">
                      Ananya Rao
                    </div>

                    <div className="text-[9px] text-gray-400">
                      Software Engineer
                    </div>

                  </div>

                </div>


                <div className="rounded-full bg-green-50 px-3 py-1.5 text-[9px] font-semibold text-green-600">
                  Profile Complete
                </div>

              </div>


              {/* Resume */}
              <div className="mt-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">

                <div className="flex justify-between">

                  <div>

                    <div className="h-3 w-32 rounded bg-gray-800" />

                    <div className="mt-2 h-2 w-24 rounded bg-gray-300" />

                  </div>


                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-purple-400 text-[9px] font-bold text-purple-600">
                    92%
                  </div>

                </div>


                {/* Summary */}
                <div className="mt-6">

                  <div className="mb-2 h-2 w-28 rounded bg-purple-300" />

                  <div className="space-y-2">

                    <div className="h-2 w-full rounded bg-gray-200" />

                    <div className="h-2 w-11/12 rounded bg-gray-200" />

                    <div className="h-2 w-4/5 rounded bg-gray-200" />

                  </div>

                </div>


                {/* Experience */}
                <div className="mt-6">

                  <div className="mb-2 h-2 w-24 rounded bg-purple-300" />

                  <div className="rounded-lg bg-purple-50 p-3">

                    <div className="h-2 w-32 rounded bg-gray-700" />

                    <div className="mt-2 h-1.5 w-24 rounded bg-purple-200" />

                    <div className="mt-3 space-y-1.5">

                      <div className="h-1.5 w-full rounded bg-gray-200" />

                      <div className="h-1.5 w-11/12 rounded bg-gray-200" />

                      <div className="h-1.5 w-4/5 rounded bg-gray-200" />

                    </div>

                  </div>

                </div>


                {/* Projects */}
                <div className="mt-6">

                  <div className="mb-2 h-2 w-20 rounded bg-purple-300" />

                  <div className="grid grid-cols-2 gap-3">

                    <div className="rounded-lg bg-gray-50 p-3">

                      <div className="h-2 w-20 rounded bg-gray-700" />

                      <div className="mt-3 h-1.5 w-full rounded bg-gray-200" />

                      <div className="mt-1.5 h-1.5 w-4/5 rounded bg-gray-200" />

                    </div>


                    <div className="rounded-lg bg-gray-50 p-3">

                      <div className="h-2 w-24 rounded bg-gray-700" />

                      <div className="mt-3 h-1.5 w-full rounded bg-gray-200" />

                      <div className="mt-1.5 h-1.5 w-3/4 rounded bg-gray-200" />

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* ATS card */}
            <div className="float-animation absolute -right-4 top-14 z-20 rounded-2xl border border-purple-100 bg-white px-5 py-4 shadow-xl">

              <div className="text-[10px] text-gray-400">
                ATS Score
              </div>

              <div className="mt-1 text-2xl font-bold text-purple-600">
                92%
              </div>

              <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-purple-100">

                <div className="h-full w-[92%] rounded-full bg-purple-500" />

              </div>

            </div>


            {/* AI card */}
            <div className="float-slow absolute -bottom-2 -left-2 z-20 w-[230px] rounded-2xl border border-purple-100 bg-white p-4 shadow-xl">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                  ✨
                </div>

                <div>

                  <div className="text-xs font-bold text-purple-600">
                    AI Optimized
                  </div>

                  <div className="text-[8px] text-gray-400">
                    Your resume is recruiter-ready
                  </div>

                </div>

              </div>


              <div className="mt-3 rounded-lg bg-purple-50 p-3">

                <div className="text-[8px] font-medium text-gray-600">
                  Skills Match
                </div>

                <div className="mt-2 flex gap-1">

                  <span className="rounded bg-purple-100 px-2 py-1 text-[7px] text-purple-600">
                    React
                  </span>

                  <span className="rounded bg-purple-100 px-2 py-1 text-[7px] text-purple-600">
                    Python
                  </span>

                  <span className="rounded bg-purple-100 px-2 py-1 text-[7px] text-purple-600">
                    SQL
                  </span>

                </div>

              </div>

            </div>


            {/* Job match */}
            <div className="float-animation absolute bottom-24 -right-5 z-20 rounded-xl border border-green-100 bg-white px-4 py-3 shadow-lg">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
                  ✓
                </div>

                <div>

                  <div className="text-[8px] text-gray-400">
                    Job Match
                  </div>

                  <div className="text-sm font-bold text-gray-800">
                    94%
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-100 bg-white px-6 py-6">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-gray-400 md:flex-row">

          <span>
            © 2026 MakeMyCV. Empowering the next generation.
          </span>

          <div className="flex gap-5">

            <Link
              href="/privacy"
              className="transition hover:text-purple-600"
            >
              Privacy Policy
            </Link>

            <Link
              href="/support"
              className="transition hover:text-purple-600"
            >
              Contact Support
            </Link>

          </div>

        </div>

      </footer>

    </main>
  );
}