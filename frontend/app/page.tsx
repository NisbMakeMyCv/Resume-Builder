"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f8ff] text-[#10152b]">

      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 border-b border-[#e8e8f2] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">

          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-[#10152b]"
          >
            📄 MakeMyCV
          </Link>

          {/* Navigation */}
          <div className="hidden items-center gap-10 md:flex">
            <a
              href="#home"
              className="text-sm transition hover:text-[#5424e8]"
            >
              Home
            </a>

            <a
              href="#features"
              className="text-sm transition hover:text-[#5424e8]"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm transition hover:text-[#5424e8]"
            >
              How It Works
            </a>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="rounded-lg border border-[#5424e8] px-5 py-2 text-sm font-medium text-[#5424e8] transition hover:bg-[#5424e8] hover:text-white"
            >
              Log In
            </Link>

            <Link
              href="/signup"
              className="interactive-button rounded-lg bg-gradient-to-r from-[#4f22df] to-[#7b1fe8] px-5 py-2 text-sm font-semibold text-white shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>


      {/* ================= HERO ================= */}
      <section
        id="home"
        className="relative overflow-hidden"
      >

        {/* Background glow */}
        <div className="pointer-events-none absolute left-[-180px] top-20 h-[500px] w-[500px] rounded-full bg-purple-300/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-150px] top-10 h-[500px] w-[500px] rounded-full bg-violet-300/20 blur-[120px]" />

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">

          {/* ================= HERO TEXT ================= */}
          <div className="relative z-10">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-[#ebe7ff] px-4 py-2 text-xs font-medium text-[#5424e8] shadow-sm">
              ✨ AI-POWERED RESUME BUILDER
            </div>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-[64px]">
              Build Your Resume.
              <br />
              Land Your
              <br />
              <span className="bg-gradient-to-r from-[#4521d8] to-[#8b20ed] bg-clip-text text-transparent">
                Next Opportunity.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
              Create an ATS-friendly resume that showcases your technical
              skills, projects, internships, certifications, and achievements —
              with AI-powered assistance to help you stand out.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-5">

              <Link
                href="/signup"
                className="interactive-button rounded-xl bg-gradient-to-r from-[#4f22df] to-[#7b1fe8] px-7 py-4 text-sm font-semibold text-white shadow-lg"
              >
                Build My Resume →
              </Link>

              {/* User avatars */}
              <div className="flex items-center">
                <div className="flex -space-x-2">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-purple-200 text-sm shadow-sm">
                    👩🏻‍💻
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-200 text-sm shadow-sm">
                    👨🏻‍💻
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-pink-200 text-sm shadow-sm">
                    👩🏽‍💻
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-purple-300 text-[9px] font-bold shadow-sm">
                    12K+
                  </div>

                </div>

                <span className="ml-3 text-xs text-gray-500">
                  students building better resumes
                </span>
              </div>
            </div>

            {/* Small trust indicators */}
            <div className="mt-8 flex flex-wrap gap-5 text-xs text-gray-500">
              <span>✓ ATS Optimized</span>
              <span>✓ AI Assisted</span>
              <span>✓ Recruiter Friendly</span>
            </div>
          </div>


          {/* =====================================================
              HERO VISUAL
          ====================================================== */}
          <div className="relative flex min-h-[580px] items-center justify-center lg:min-h-[620px]">

            {/* Large glow behind dashboard */}
            <div className="absolute h-[430px] w-[430px] rounded-full bg-purple-400/20 blur-[90px]" />

            {/* Decorative floating circle */}
            <div className="float-slow absolute right-2 top-12 h-20 w-20 rounded-full bg-gradient-to-br from-purple-200 to-violet-100 opacity-70 blur-sm" />

            {/* ================= MAIN RESUME WINDOW ================= */}
            <div className="hero-dashboard relative z-10 w-full max-w-[590px] rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_30px_80px_rgba(70,40,160,0.16)] backdrop-blur-xl md:p-5">

              {/* Browser-style top bar */}
              <div className="mb-4 flex items-center justify-between px-2">

                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
                </div>

                <div className="rounded-full bg-[#f5f3ff] px-4 py-1.5 text-[9px] font-medium text-purple-600">
                  MakeMyCV Resume Builder
                </div>

                <div className="h-5 w-5 rounded-full bg-purple-100" />
              </div>


              {/* Resume application layout */}
              <div className="grid grid-cols-[0.72fr_1.55fr] gap-4 rounded-2xl bg-[#f7f7fc] p-4">

                {/* ================= LEFT SIDEBAR ================= */}
                <div className="rounded-xl bg-white p-4 shadow-sm">

                  {/* Profile */}
                  <div className="flex items-center gap-2.5">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-violet-600 text-sm">
                      👩🏻‍💻
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-gray-800">
                        Ananya Rao
                      </div>

                      <div className="mt-1 text-[8px] text-gray-400">
                        Software Engineer
                      </div>
                    </div>
                  </div>


                  {/* Sidebar sections */}
                  <div className="mt-6 space-y-5">

                    <div>
                      <div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-purple-600">
                        Profile
                      </div>

                      <div className="space-y-2">
                        <MiniLine width="90%" />
                        <MiniLine width="75%" />
                        <MiniLine width="85%" />
                      </div>
                    </div>


                    <div>
                      <div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-purple-600">
                        Skills
                      </div>

                      <div className="flex flex-wrap gap-1.5">

                        <SkillBadge text="Python" />
                        <SkillBadge text="React" />
                        <SkillBadge text="SQL" />
                        <SkillBadge text="Java" />
                        <SkillBadge text="Git" />

                      </div>
                    </div>


                    <div>
                      <div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-purple-600">
                        Education
                      </div>

                      <div className="text-[8px] font-semibold text-gray-700">
                        B.E. Computer Science
                      </div>

                      <div className="mt-1 text-[7px] text-gray-400">
                        NIE Mysore · 2024–2028
                      </div>
                    </div>


                    <div>
                      <div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-purple-600">
                        Certifications
                      </div>

                      <div className="rounded-md bg-purple-50 p-2 text-[7px] text-purple-700">
                        Professional Ethical Hacking
                      </div>
                    </div>

                  </div>
                </div>


                {/* ================= ACTUAL RESUME ================= */}
                <div className="rounded-xl bg-white p-5 shadow-sm">

                  {/* Resume Header */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">

                    <div>

                      <div className="text-lg font-bold text-[#172033]">
                        Ananya Rao
                      </div>

                      <div className="mt-1 text-[8px] font-medium text-purple-600">
                        SOFTWARE ENGINEER · AI & FULL STACK
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-[7px] text-gray-400">
                        <span>ananya@email.com</span>
                        <span>•</span>
                        <span>LinkedIn</span>
                        <span>•</span>
                        <span>GitHub</span>
                      </div>

                    </div>


                    {/* Resume score */}
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-purple-300">

                      <div className="text-center">
                        <div className="text-[10px] font-bold text-purple-600">
                          92%
                        </div>

                        <div className="text-[6px] text-gray-400">
                          ATS
                        </div>
                      </div>

                    </div>

                  </div>


                  {/* Summary */}
                  <ResumeSection title="PROFESSIONAL SUMMARY">

                    <p className="text-[7px] leading-3 text-gray-500">
                      Computer Science student focused on building scalable
                      software applications and AI-powered solutions with
                      strong foundations in Python, Java, SQL and modern
                      web technologies.
                    </p>

                  </ResumeSection>


                  {/* Experience */}
                  <ResumeSection title="EXPERIENCE">

                    <div className="flex justify-between">

                      <div>
                        <div className="text-[8px] font-bold text-gray-800">
                          Software Engineering Intern
                        </div>

                        <div className="text-[7px] text-purple-600">
                          Tech Solutions Pvt. Ltd.
                        </div>
                      </div>

                      <div className="text-[6px] text-gray-400">
                        2026
                      </div>

                    </div>

                    <div className="mt-2 space-y-1.5">

                      <ResumeBullet>
                        Developed responsive web features using React and
                        REST APIs.
                      </ResumeBullet>

                      <ResumeBullet>
                        Improved API performance through optimized database
                        queries.
                      </ResumeBullet>

                    </div>

                  </ResumeSection>


                  {/* Projects */}
                  <ResumeSection title="PROJECTS">

                    <div className="space-y-3">

                      <div>
                        <div className="text-[8px] font-bold text-gray-800">
                          AI Resume Optimizer
                        </div>

                        <div className="mt-1 text-[7px] leading-3 text-gray-500">
                          Built an AI-assisted resume optimization platform
                          using React, FastAPI and NLP techniques.
                        </div>

                        <div className="mt-1 flex gap-1">
                          <ProjectTag text="React" />
                          <ProjectTag text="FastAPI" />
                          <ProjectTag text="AI" />
                        </div>
                      </div>


                      <div>
                        <div className="text-[8px] font-bold text-gray-800">
                          Disaster Relief Management
                        </div>

                        <div className="mt-1 text-[7px] leading-3 text-gray-500">
                          Full-stack system for coordinating disaster resources
                          and managing relief information.
                        </div>

                        <div className="mt-1 flex gap-1">
                          <ProjectTag text="Node.js" />
                          <ProjectTag text="MySQL" />
                          <ProjectTag text="React" />
                        </div>
                      </div>

                    </div>

                  </ResumeSection>


                  {/* Achievements */}
                  <ResumeSection title="ACHIEVEMENTS">

                    <div className="grid grid-cols-2 gap-2">

                      <div className="rounded-md bg-purple-50 p-2">
                        <div className="text-[7px] font-bold text-purple-700">
                          9.3+ CGPA
                        </div>
                        <div className="mt-1 text-[6px] text-gray-400">
                          Academic Excellence
                        </div>
                      </div>

                      <div className="rounded-md bg-purple-50 p-2">
                        <div className="text-[7px] font-bold text-purple-700">
                          12+ Projects
                        </div>
                        <div className="mt-1 text-[6px] text-gray-400">
                          Technical Portfolio
                        </div>
                      </div>

                    </div>

                  </ResumeSection>

                </div>
              </div>
            </div>


            {/* =================================================
                FLOATING ATS CARD
            ================================================== */}
            <div className="float-animation absolute -right-1 top-10 z-20 rounded-2xl border border-purple-100 bg-white px-5 py-4 shadow-[0_20px_40px_rgba(84,36,232,0.16)] md:-right-5">

              <div className="text-[10px] font-medium text-gray-400">
                ATS Score
              </div>

              <div className="mt-1 flex items-end gap-1">

                <span className="text-2xl font-bold text-purple-600">
                  92%
                </span>

                <span className="mb-1 text-[8px] font-medium text-green-500">
                  +18%
                </span>

              </div>

              <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-purple-100">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-purple-500 to-violet-500" />
              </div>

            </div>


            {/* =================================================
                FLOATING AI CARD
            ================================================== */}
            <div className="float-slow absolute -bottom-3 left-0 z-20 w-[220px] rounded-2xl border border-purple-100 bg-white p-4 shadow-[0_20px_45px_rgba(84,36,232,0.16)] md:-left-8">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-sm">
                  ✨
                </div>

                <div>
                  <div className="text-xs font-bold text-purple-600">
                    AI Writing Assistant
                  </div>

                  <div className="text-[8px] text-gray-400">
                    Improved your project description
                  </div>
                </div>

              </div>


              <div className="mt-3 rounded-lg bg-[#f4f0ff] p-3">

                <p className="text-[7px] leading-3 text-gray-500">
                  "Built a web app and fixed bugs."
                </p>

              </div>


              <div className="mt-2 rounded-lg bg-gradient-to-r from-[#5424e8] to-[#8b20ed] p-3">

                <p className="text-[7px] font-medium leading-3 text-white">
                  "Developed a scalable web application using React and
                  REST APIs, improving user experience and application
                  reliability."
                </p>

              </div>

            </div>


            {/* =================================================
                FLOATING JOB MATCH CARD
            ================================================== */}
            <div className="float-animation absolute bottom-20 right-0 z-20 rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-lg md:-right-8">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
                  ✓
                </div>

                <div>
                  <div className="text-[9px] text-gray-400">
                    Job Match
                  </div>

                  <div className="text-sm font-bold text-gray-800">
                    94%
                  </div>

                </div>

              </div>

            </div>


            {/* Small AI optimized badge */}
            <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-purple-100 bg-white px-4 py-2 text-[9px] font-semibold text-purple-600 shadow-lg">
              ✨ AI Optimized
            </div>

          </div>
        </div>
      </section>


      {/* ================= ATS SECTION ================= */}
      <section
        id="features"
        className="bg-[#f3f3ff] px-6 py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">

          <div className="text-center">

            <h2 className="text-3xl font-bold md:text-4xl">
              Beat the Bots. Impress the Humans.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600">
              Our intelligent resume platform helps your resume pass through
              screening filters while maintaining professional quality.
            </p>

          </div>


          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <FeatureCard
              icon="▣"
              title="ATS Deep-Logic"
              text="We optimize your resume for Applicant Tracking Systems to ensure strong visibility."
            />

            <FeatureCard
              icon="⌕"
              title="Smart Keywords"
              text="Our AI analyzes job descriptions and recommends relevant industry keywords for your resume."
            />

            <FeatureCard
              icon="●"
              title="Human-Centric"
              text="Your resume stays recruiter-friendly, impactful and professional while remaining ATS compatible."
            />

          </div>
        </div>
      </section>


      {/* ================= AI SECTION ================= */}
      <section className="bg-[#eef0ff] px-6 py-24 lg:px-10">

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">

          <div className="interactive-card rounded-2xl bg-white p-5 shadow-xl">

            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-purple-600">
              ✨ AI Writing Assistant
            </div>

            <div className="rounded-lg bg-[#f1efff] p-4 text-xs text-gray-600">
              "I wrote some Python code for a web app and fixed bugs."
            </div>

            <div className="my-4 text-center text-purple-500">
              ↓
            </div>

            <div className="rounded-lg bg-gradient-to-r from-[#5424e8] to-[#7b20e8] p-5 text-sm text-white shadow-lg">

              <p className="font-medium">
                "Architected a scalable REST API using FastAPI and
                PostgreSQL, reducing database latency by 40% through
                optimized indexing and asynchronous query handling."
              </p>

            </div>
          </div>


          <div>

            <div className="mb-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium text-purple-600">
              ✨ AI Writing Assistant
            </div>

            <h2 className="text-3xl font-bold md:text-4xl">
              Write Like a Pro,
              <br />
              Even If You Aren't One.
            </h2>

            <p className="mt-5 leading-7 text-gray-600">
              Don't let weak descriptions hold your career back. Our AI
              Editor suggests action-oriented verbs and quantifiable
              achievements based on your specific industry.
            </p>

            <ul className="mt-6 space-y-4 text-sm text-gray-700">
              <li>✓ Tone optimization for your industry</li>
              <li>✓ Grammar and syntax polishing</li>
              <li>✓ Quantifiable impact suggestions</li>
            </ul>

          </div>
        </div>
      </section>


      {/* ================= ENGINEERING SECTION ================= */}
      <section className="bg-[#f8f8ff] px-6 py-24 lg:px-10">

        <div className="mx-auto max-w-7xl text-center">

          <h2 className="text-3xl font-bold md:text-4xl">
            Standardized for Engineering Excellence
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600">
            Stop worrying about design and start focusing on your tech stack.
            We use industry-standard formats that recruiters expect.
          </p>


          <div className="mt-12 grid gap-5 md:grid-cols-4">

            <EngineeringCard
              icon="&lt;/&gt;"
              title="Technical Skills"
              text="Optimized sections for languages, frameworks and developer tools."
            />

            <EngineeringCard
              icon="▣"
              title="Project Focus"
              text="Describe projects with clear impact and technical depth."
            />

            <EngineeringCard
              icon="□"
              title="Internships"
              text="Highlight real-world experience using quantifiable achievements."
            />

            <EngineeringCard
              icon="◉"
              title="Certifications"
              text="Showcase verified technical certifications clearly."
            />

          </div>

          <p className="mt-8 text-xs font-medium text-purple-600">
            One profile, one perfect ATS-ready PDF.
          </p>

        </div>
      </section>


      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className="bg-[#eef0ff] px-6 py-24 lg:px-10"
      >

        <div className="mx-auto max-w-7xl text-center">

          <h2 className="text-3xl font-bold md:text-4xl">
            Your Path to Employment.
          </h2>

          <p className="mt-3 text-sm text-gray-500">
            Simple, streamlined, and effective.
          </p>


          <div className="relative mt-16 grid gap-12 md:grid-cols-3">

            <Step
              number="1"
              title="Build Your Profile"
              text="Add your education, technical skills, projects, certifications, internships, and achievements in one place."
            />

            <Step
              number="2"
              title="Improve with AI"
              text="Turn your basic project and experience descriptions into clear, impactful resume content with AI assistance."
            />

            <Step
              number="3"
              title="Generate & Apply"
              text="Generate recruiter-ready resumes for different roles and quickly download them for your internship or placement applications."
            />

          </div>
        </div>
      </section>


      {/* ================= CTA ================= */}
      <section className="px-6 py-20 lg:px-10">

        <div className="mx-auto max-w-6xl rounded-3xl bg-[#f0efff] px-6 py-16 text-center shadow-sm">

          <h2 className="text-4xl font-bold md:text-5xl">
            Ready to Land Your Dream Job?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-gray-600">
            Join MakeMyCV to build your technical profile and land your next
            Software Engineering internship or Full Stack Developer role.
          </p>

          <Link
            href="/signup"
            className="interactive-button mt-8 inline-block rounded-lg bg-gradient-to-r from-[#4f22df] to-[#7b1fe8] px-7 py-3 text-sm font-semibold text-white shadow-lg"
          >
            Build Your Free Resume
          </Link>

          <p className="mt-4 text-xs text-gray-400">
            No credit card required. Start for free.
          </p>

        </div>
      </section>


      {/* ================= FOOTER ================= */}
      <footer className="bg-[#f0f0ff] px-6 py-12 lg:px-10">

        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">

          <div>

            <h3 className="text-lg font-bold text-purple-600">
              📄 MakeMyCV
            </h3>

            <p className="mt-4 max-w-xs text-xs leading-6 text-gray-500">
              The ultimate career companion for the modern workforce.
              Precision, automation, and clarity in every document.
            </p>

          </div>


          <FooterColumn
            title="Product"
            links={[
              "Resume Builder",
              "Cover Letter",
              "AI Content Optimizer",
              "Pricing",
            ]}
          />

          <FooterColumn
            title="Resources"
            links={[
              "Resume Guide",
              "ATS Tips",
              "Job Search Strategy",
              "Career Blog",
            ]}
          />

          <FooterColumn
            title="Company"
            links={[
              "About Us",
              "Privacy Policy",
              "Terms of Service",
              "Contact Support",
            ]}
          />

        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-gray-200 pt-6 text-xs text-gray-400">
          © 2026 MakeMyCV. Empowering the next generation.
        </div>

      </footer>

    </main>
  );
}


/* =========================================================
   HERO VISUAL COMPONENTS
========================================================= */

function MiniLine({ width }: { width: string }) {
  return (
    <div
      className="h-1.5 rounded-full bg-gray-200"
      style={{ width }}
    />
  );
}


function SkillBadge({ text }: { text: string }) {
  return (
    <span className="rounded-md bg-purple-50 px-2 py-1 text-[6px] font-medium text-purple-600">
      {text}
    </span>
  );
}


function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">

      <div className="mb-2 text-[7px] font-bold tracking-wider text-purple-600">
        {title}
      </div>

      {children}

    </div>
  );
}


function ResumeBullet({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-1.5">

      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-purple-500" />

      <p className="text-[7px] leading-3 text-gray-500">
        {children}
      </p>

    </div>
  );
}


function ProjectTag({ text }: { text: string }) {
  return (
    <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[6px] font-medium text-purple-600">
      {text}
    </span>
  );
}


/* =========================================================
   OTHER COMPONENTS
========================================================= */

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="interactive-card rounded-xl bg-white p-6 shadow-sm">

      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
        {icon}
      </div>

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-gray-500">
        {text}
      </p>

    </div>
  );
}


function EngineeringCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="interactive-card rounded-xl bg-white p-6 text-left shadow-sm">

      <div className="mb-4 text-sm font-bold text-purple-600">
        {icon}
      </div>

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-xs leading-5 text-gray-500">
        {text}
      </p>

    </div>
  );
}


function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="relative">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-white text-sm font-bold text-purple-600 shadow-md">
        {number}
      </div>

      <h3 className="mt-5 font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-gray-500">
        {text}
      </p>

    </div>
  );
}


function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: string[];
}) {
  return (
    <div>

      <h4 className="text-sm font-semibold">
        {title}
      </h4>

      <ul className="mt-4 space-y-3">

        {links.map((link) => (
          <li key={link}>

            <span className="cursor-pointer text-xs text-gray-500 transition hover:text-purple-600">
              {link}
            </span>

          </li>
        ))}

      </ul>

    </div>
  );
}