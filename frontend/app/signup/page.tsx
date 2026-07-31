"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000/api/v1";

export default function SignUp() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    console.log("CREATE ACCOUNT BUTTON CLICKED");

    setError("");

    // Basic validation
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
      console.log("Requesting OTP for:", email);

      const response = await fetch(
        `${API_URL}/auth/request-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      console.log("OTP API status:", response.status);

      const data = await response.json();

      console.log("OTP API response:", data);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to send verification code."
        );
      }

      // Store signup information temporarily.
      // We will use this on the verify-email page.
      sessionStorage.setItem(
        "signupData",
        JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        })
      );

      console.log("Signup data saved.");
      console.log("Navigating to verify-email...");

      router.push("/verify-email");
    } catch (err) {
      console.error("SIGNUP ERROR:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7ff] text-[#10152b]">

      {/* NAVBAR */}
      <nav className="border-b border-[#e8e8f2] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4f22df] to-[#8b24ed] text-sm text-white">
              ▤
            </span>

            MakeMyCV
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:inline">
              Already have an account?
            </span>

            <Link
              href="/signin"
              className="font-semibold text-[#5424e8] hover:text-[#7b20e8]"
            >
              Sign In
            </Link>
          </div>

        </div>
      </nav>


      {/* MAIN */}
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-md">

          {/* CARD */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_20px_70px_rgba(84,36,232,0.10)] sm:p-8">

            {/* HEADER */}
            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f22df] to-[#8b24ed] text-2xl text-white shadow-lg shadow-purple-200">
                ✦
              </div>

              <h1 className="mt-5 text-2xl font-bold">
                Create Your Account
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Start building your career-ready resume today.
              </p>

            </div>


            {/* GOOGLE */}
            <button
              type="button"
              disabled
              className="mt-7 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-500"
            >
              <span className="text-base font-bold">
                G
              </span>

              Continue with Google
            </button>

            <p className="mt-2 text-center text-[10px] text-gray-400">
              Google login will be connected separately.
            </p>


            {/* DIVIDER */}
            <div className="my-6 flex items-center gap-3">

              <div className="h-px flex-1 bg-gray-200" />

              <span className="text-xs text-gray-400">
                OR
              </span>

              <div className="h-px flex-1 bg-gray-200" />

            </div>


            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* FULL NAME */}
              <div>

                <label
                  htmlFor="fullName"
                  className="mb-2 block text-xs font-semibold text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:opacity-60"
                />

              </div>


              {/* EMAIL */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:opacity-60"
                />

              </div>


              {/* PASSWORD */}
              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-14 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-purple-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

                <p className="mt-2 text-[11px] text-gray-400">
                  Use at least 8 characters.
                </p>

              </div>


              {/* CONFIRM PASSWORD */}
              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-xs font-semibold text-gray-700"
                >
                  Confirm Password
                </label>

                <div className="relative">

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-14 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-purple-600"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>


              {/* TERMS */}
              <div className="flex items-start gap-2 pt-1">

                <input
                  id="terms"
                  type="checkbox"
                  required
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 accent-[#5424e8]"
                />

                <label
                  htmlFor="terms"
                  className="text-[11px] leading-5 text-gray-500"
                >
                  I agree to the{" "}
                  <span className="font-medium text-purple-600">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-purple-600">
                    Privacy Policy
                  </span>
                  .
                </label>

              </div>


              {/* ERROR */}
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}


              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#4f22df] to-[#8b20ed] py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending Verification Code..." : "Create My Account →"}
              </button>

            </form>


            {/* SIGN IN */}
            <p className="mt-6 text-center text-xs text-gray-500">

              Already have an account?{" "}

              <Link
                href="/signin"
                className="font-semibold text-purple-600 hover:text-purple-800"
              >
                Sign In
              </Link>

            </p>

          </div>


          {/* SECURITY */}
          <div className="mt-6 text-center text-[11px] text-gray-400">
            🔒 Your information is securely protected.
          </div>

        </div>

      </section>

    </main>
  );
}