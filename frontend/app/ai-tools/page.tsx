"use client";

import AppSidebar from "../components/AppSidebar";
import Protected from "../components/Protected";
import MaterialIcon from "../components/MaterialIcon";
import GitHubAnalyzer from "../components/ai/GitHubAnalyzer";
import Reveal from "../components/Reveal";

export default function AIToolsPage() {
  return (
    <Protected>
      <div className="page-enter min-h-screen bg-surface text-on-surface">
        <AppSidebar />

        {/* Top App Bar */}
        <header
          className="
            fixed z-40
            flex justify-between items-center
            px-4 lg:px-8
            h-14 lg:h-16
            top-14 lg:top-0
            left-0 lg:left-[var(--sidebar-width)]
            w-full lg:w-[calc(100%-var(--sidebar-width))]
            bg-surface
            border-b border-outline-variant
          "
        >
          <h1 className="text-headline-md font-bold text-primary">
            AI Tools
          </h1>
        </header>

        {/* Main Content */}
        <main
          className="
            pt-28 lg:pt-24
            lg:ml-[var(--sidebar-width)]
            pb-12
            px-4 lg:px-8
            min-h-screen
          "
        >
          <div className="max-w-[1280px] mx-auto space-y-12">

            {/* =====================================================
                PAGE TITLE
            ====================================================== */}

            <div>
              <h2 className="text-headline-md text-on-surface">
                AI Toolkit
              </h2>

              <p className="text-body-md text-on-surface-variant">
                Leverage artificial intelligence to craft the perfect
                resume and analyze your repositories.
              </p>
            </div>


            {/* =====================================================
                GITHUB ANALYZER
            ====================================================== */}

            <Reveal delay={0}>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <MaterialIcon
                    name="smart_toy"
                    className="text-primary"
                    filled
                  />

                  <h3 className="text-headline-md text-on-surface">
                    GitHub Analyzer
                  </h3>
                </div>

                <p className="text-body-md text-on-surface-variant mt-1">
                  Turn any public GitHub repository into resume-ready
                  content.
                </p>
              </div>

              <GitHubAnalyzer />
            </Reveal>


            {/* =====================================================
                AI RESUME CHATBOT
            ====================================================== */}

            <Reveal delay={100}>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <MaterialIcon
                    name="auto_awesome"
                    className="text-primary"
                    filled
                  />

                  <h3 className="text-headline-md text-on-surface">
                    AI Resume Chatbot
                  </h3>
                </div>

                <p className="text-body-md text-on-surface-variant mt-1">
                  Build, edit and improve your resume using an AI
                  assistant. You can add projects, skills, education,
                  experience and more through conversation.
                </p>
              </div>

              <div
                className="
                  relative
                  overflow-hidden
                  rounded-3xl
                  border border-outline-variant
                  bg-surface-container-low
                  p-6 sm:p-8
                "
              >
                {/* Decorative background */}
                <div
                  className="
                    absolute
                    -top-24
                    -right-24
                    h-64
                    w-64
                    rounded-full
                    bg-primary/10
                    blur-3xl
                    pointer-events-none
                  "
                />

                <div
                  className="
                    absolute
                    -bottom-24
                    -left-24
                    h-64
                    w-64
                    rounded-full
                    bg-secondary/10
                    blur-3xl
                    pointer-events-none
                  "
                />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

                  {/* Left side */}
                  <div className="max-w-2xl">
                    <div
                      className="
                        inline-flex
                        items-center
                        justify-center
                        h-14
                        w-14
                        rounded-2xl
                        bg-primary-container
                        text-primary
                        mb-5
                      "
                    >
                      <MaterialIcon
                        name="chat"
                        className="text-3xl"
                        filled
                      />
                    </div>

                    <h4 className="text-2xl font-bold text-on-surface">
                      Build your resume with AI
                    </h4>

                    <p className="mt-3 text-body-md text-on-surface-variant leading-relaxed">
                      Tell the AI what you want to change and it can
                      help you build and improve your resume. Your
                      conversation, resume information and preview are
                      connected in the AI Resume Builder.
                    </p>

                    {/* Features */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MaterialIcon
                          name="check_circle"
                          className="text-primary"
                          filled
                        />
                        AI resume editing
                      </div>

                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MaterialIcon
                          name="check_circle"
                          className="text-primary"
                          filled
                        />
                        Chat history
                      </div>

                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MaterialIcon
                          name="check_circle"
                          className="text-primary"
                          filled
                        />
                        Job description analysis
                      </div>

                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MaterialIcon
                          name="check_circle"
                          className="text-primary"
                          filled
                        />
                        Live resume preview
                      </div>

                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MaterialIcon
                          name="check_circle"
                          className="text-primary"
                          filled
                        />
                        Skill suggestions
                      </div>

                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MaterialIcon
                          name="check_circle"
                          className="text-primary"
                          filled
                        />
                        Download PDF
                      </div>

                    </div>
                  </div>


                  {/* Right side */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/resumes/create/ai";
                      }}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        bg-primary
                        text-on-primary
                        px-6
                        py-3
                        font-semibold
                        shadow-lg
                        transition-all
                        hover:bg-secondary
                        hover:scale-[1.02]
                        active:scale-95
                      "
                    >
                      <MaterialIcon
                        name="auto_awesome"
                        filled
                      />

                      Open AI Resume Builder

                      <MaterialIcon
                        name="arrow_forward"
                      />
                    </button>
                  </div>

                </div>
              </div>
            </Reveal>


            {/* =====================================================
                ATS SCORE
            ====================================================== */}

            <Reveal delay={200}>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <MaterialIcon
                    name="fact_check"
                    className="text-primary"
                    filled
                  />

                  <h3 className="text-headline-md text-on-surface">
                    ATS Resume Grader
                  </h3>

                  <span
                    className="
                      ml-3
                      text-label-sm
                      text-primary
                      bg-primary-container
                      px-2
                      py-0.5
                      rounded-full
                      font-bold
                    "
                  >
                    Coming Soon
                  </span>
                </div>

                <p className="text-body-md text-on-surface-variant mt-1">
                  Upload your resume and a target job description.
                  We'll score your resume against the ATS algorithm
                  and suggest improvements.
                </p>
              </div>

              <div
                className="
                  ambient-card
                  bg-surface-container-low
                  rounded-2xl
                  border border-dashed
                  border-outline-variant
                  p-10
                  flex flex-col
                  items-center
                  justify-center
                  text-center
                  opacity-60
                "
              >
                <MaterialIcon
                  name="upload_file"
                  className="text-5xl text-outline-variant mb-4"
                />

                <h4 className="text-label-md font-bold text-on-surface">
                  ATS Grader Integration
                </h4>

                <p className="text-label-sm text-on-surface-variant mt-2 max-w-md">
                  We are currently integrating with advanced LLMs to
                  provide a realistic Applicant Tracking System
                  scoring mechanism. Stay tuned!
                </p>

                <button
                  disabled
                  className="
                    mt-6
                    btn-outline
                    px-4
                    py-2
                    rounded-full
                    text-label-md
                    disabled:cursor-not-allowed
                  "
                >
                  Configure ATS Algorithm
                </button>
              </div>
            </Reveal>

          </div>
        </main>
      </div>
    </Protected>
  );
}