"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#f7f7ff] text-[#10152b]">

      {/* ================= NAVBAR ================= */}

      <nav className="border-b border-[#e8e8f2] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* Logo */}

          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4f22df] to-[#8b24ed] text-sm text-white shadow-sm">
              ▤
            </span>

            MakeMyCV
          </Link>


          {/* Right side */}

          <div className="flex items-center gap-4">

            <button
              type="button"
              className="hidden text-sm font-medium text-gray-500 transition hover:text-[#5424e8] sm:block"
            >
              Help
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#5424e8] to-[#8b20ed] text-sm font-semibold text-white">
              B
            </div>

          </div>

        </div>
      </nav>


      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">

        {/* Welcome */}

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-sm font-medium text-[#5424e8]">
              Welcome back 👋
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Build your next opportunity.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
              Create, improve and manage your ATS-friendly resumes
              with AI-powered assistance.
            </p>

          </div>


          {/* Create Resume */}

          <Link
            href="/resume/create"
            className="interactive-button inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f22df] to-[#8b20ed] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200"
          >
            <span className="text-lg">+</span>
            Create New Resume
          </Link>

        </div>


        {/* ================= QUICK STATS ================= */}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">

          <StatCard
            icon="📄"
            label="My Resumes"
            value="0"
            description="No resumes created yet"
          />

          <StatCard
            icon="✦"
            label="AI Suggestions"
            value="0"
            description="Suggestions generated"
          />

          <StatCard
            icon="✓"
            label="ATS Score"
            value="—"
            description="Create a resume to check"
          />

        </div>


        {/* ================= MAIN CONTENT ================= */}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">


          {/* ================= RESUME AREA ================= */}

          <div className="rounded-2xl border border-[#e8e8f2] bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold">
                  Your Resumes
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Manage your resumes and keep them ready for applications.
                </p>

              </div>

            </div>


            {/* Empty state */}

            <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-purple-200 bg-[#faf9ff] px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ebe7ff] text-2xl">
                📄
              </div>

              <h3 className="mt-5 text-base font-semibold">
                Your resume journey starts here.
              </h3>

              <p className="mt-2 max-w-sm text-xs leading-5 text-gray-500">
                Create your first resume and let MakeMyCV help you
                build a professional, ATS-friendly application.
              </p>

              <Link
                href="/resume/create"
                className="mt-5 rounded-lg bg-[#5424e8] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#4520c9]"
              >
                Create My First Resume →
              </Link>

            </div>

          </div>


          {/* ================= AI ASSISTANT ================= */}

          <div className="rounded-2xl border border-[#e8e8f2] bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5424e8] to-[#8b20ed] text-white shadow-md">
                ✦
              </div>

              <div>

                <h2 className="text-sm font-bold">
                  AI Resume Assistant
                </h2>

                <p className="text-xs text-gray-500">
                  Your career co-pilot
                </p>

              </div>

            </div>


            <div className="mt-6 rounded-xl bg-[#f7f5ff] p-4">

              <p className="text-xs font-semibold text-[#5424e8]">
                💡 Quick Tip
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-600">
                Strong resumes focus on measurable achievements rather
                than simply listing responsibilities.
              </p>

            </div>


            <div className="mt-5 space-y-3">

              <AIAction
                icon="✦"
                title="Improve a project"
                text="Turn your project description into strong bullet points."
              />

              <AIAction
                icon="✓"
                title="Optimize for ATS"
                text="Identify keywords and improve resume compatibility."
              />

              <AIAction
                icon="⚡"
                title="Generate achievements"
                text="Transform your work into measurable impact."
              />

            </div>

          </div>

        </div>


        {/* ================= GET STARTED ================= */}

        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4521d8] to-[#8b20ed] p-7 text-white shadow-xl sm:p-8">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <div className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                Ready to begin?
              </div>

              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                Create a resume that gets noticed.
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-5 text-purple-100">
                Start with your education, projects and skills.
                We'll help you turn them into a professional resume.
              </p>

            </div>


            <Link
              href="/resume/create"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#5424e8] shadow-lg transition hover:-translate-y-0.5"
            >
              Start Building →
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}


/* ================= STAT CARD ================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="interactive-card rounded-2xl border border-[#e8e8f2] bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0edff] text-lg">
          {icon}
        </div>

        <span className="text-2xl font-bold text-[#10152b]">
          {value}
        </span>

      </div>

      <h3 className="mt-4 text-sm font-semibold">
        {label}
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>

    </div>
  );
}


/* ================= AI ACTION ================= */

function AIAction({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      className="interactive-card w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-purple-100 hover:bg-purple-50"
    >

      <div className="flex gap-3">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs text-[#5424e8] shadow-sm">
          {icon}
        </div>

        <div>

          <h3 className="text-xs font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-[10px] leading-4 text-gray-500">
            {text}
          </p>

        </div>

      </div>

    </button>
  );
}