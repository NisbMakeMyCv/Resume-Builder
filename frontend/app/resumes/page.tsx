"use client";

import AppSidebar from "../components/AppSidebar";
import Protected from "../components/Protected";
import MaterialIcon from "../components/MaterialIcon";
import GitHubAnalyzer from "../components/ai/GitHubAnalyzer";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";

/**
 * My Resumes
 *
 * Resume management page with:
 * - Existing resume empty state
 * - GitHub AI project analyzer
 * - Resume statistics
 */
export default function MyResumes() {
  return (
    <Protected>
      <SidebarProvider>
        <MyResumesLayout />
      </SidebarProvider>
    </Protected>
  );
}

function MyResumesLayout() {
  return (
    <>
      <AppSidebar />
      <MyResumesInner />
    </>
  );
}

function MyResumesInner() {
  const { toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-surface">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full lg:left-64 lg:w-[calc(100%-16rem)] h-16 px-4 sm:px-8 flex justify-between items-center bg-surface border-b border-outline-variant z-[300]">
        {/* Hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            onClick={toggle}
            aria-label="Open navigation menu"
          >
            <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
              menu
            </span>
          </button>
          <h1 className="text-headline-md font-bold text-primary">My Resumes</h1>
        </div>

        <button
          type="button"
          className="bg-primary text-on-primary px-4 sm:px-6 py-2 rounded-full text-label-md flex items-center gap-2 hover:bg-secondary transition-all active:scale-95 cursor-not-allowed"
          title="Resume creation is coming soon"
        >
          <MaterialIcon name="add" />
          <span className="hidden sm:inline">Create New Resume</span>
          <span className="sm:hidden">New</span>
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-0 lg:ml-64 pt-24 pb-12 px-4 sm:px-8 min-h-screen">
        <div className="max-w-[1280px] mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-headline-md text-on-surface">My Resumes</h2>
            <p className="text-body-md text-on-surface-variant">
              Manage, download, and track your tailored CVs.
            </p>
          </div>

          {/* Resume Grid — existing empty state */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex flex-col group cursor-pointer">
              <div className="relative aspect-[3/4] bg-surface-container rounded-[20px] border-2 border-dashed border-outline-variant overflow-hidden flex flex-col items-center justify-center gap-4 hover:bg-surface-container-high hover:border-primary transition-all active:scale-[0.98]">
                <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center text-primary shadow-sm border border-outline-variant group-hover:scale-110 transition-transform duration-200">
                  <MaterialIcon name="add_circle" className="text-4xl" />
                </div>
                <div className="text-center px-6">
                  <p className="font-bold text-on-surface">New Template</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">
                    Start from a professional base
                  </p>
                </div>
              </div>
              <div className="mt-4 px-2">
                <p className="text-label-sm text-primary font-bold">
                  Standard Resume Format
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Free for all users
                </p>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* AI Resume Tools                                             */}
          {/* ---------------------------------------------------------- */}

          <section className="mt-12">
            <div className="mb-6">
              <h2 className="text-headline-md font-bold text-on-surface">
                AI Resume Tools
              </h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                AI-powered tools to create and improve professional resume content.
              </p>
            </div>

            {/* GitHub Project Analyzer */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MaterialIcon name="code" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base sm:text-lg">
                      GitHub Project Analyzer → Resume Description Generator
                    </h3>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      Analyze your GitHub project and generate professional,
                      resume-ready descriptions, technologies, and bullet points.
                    </p>
                  </div>
                </div>
              </div>
              <GitHubAnalyzer />
            </div>
          </section>

          {/* Stats Bar */}
          <div className="mt-10 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-6 sm:gap-16">
              <div className="text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
                  Total Resumes
                </div>
                <div className="text-headline-md font-bold text-on-surface">0</div>
              </div>

              <div className="hidden sm:block w-px h-12 bg-outline-variant" />

              <div className="text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
                  Avg. ATS Score
                </div>
                <div className="text-headline-md font-bold text-primary">—</div>
              </div>

              <div className="flex-grow" />

              <div className="w-full sm:w-64">
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-2">
                  <span>Storage Capacity</span>
                  <span>(0%)</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="ml-0 lg:ml-64 flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 py-6 sm:py-8 bg-surface-container-lowest border-t border-outline-variant gap-3">
        <div className="flex items-center gap-6 sm:gap-8">
          <span className="text-label-md font-bold text-on-surface">MakeMyCV</span>
          <div className="flex gap-4">
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
              Terms
            </a>
          </div>
        </div>
        <p className="text-label-sm text-on-surface-variant">
          © 2026 MakeMyCV. Made by NISB.
        </p>
      </footer>
    </div>
  );
}