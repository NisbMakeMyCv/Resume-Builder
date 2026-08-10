"use client";

import { motion } from "framer-motion";
import AppSidebar from "../components/AppSidebar";
import Protected from "../components/Protected";
import MaterialIcon from "../components/MaterialIcon";
import GitHubAnalyzer from "../components/ai/GitHubAnalyzer";

/**
 * My Resumes — coded from the `my_resumes` stitch frame (card grid with
 * hover-overlay actions and a dashed "new" card).
 *
 * The backend has no resume endpoints yet, so the grid renders only the
 * empty state with the "New Template" placeholder card. The AI Resume
 * Tools section below wires the GitHub Analyzer to the live backend AI
 * endpoints (/api/v1/ai/github/analyze + /improve-bullets).
 */
export default function MyResumes() {
  return (
    <Protected>
      <MyResumesInner />
    </Protected>
  );
}

function MyResumesInner() {
  return (
    <div className="page-enter min-h-screen bg-surface text-on-surface">
      <AppSidebar />

      {/* Top App Bar */}
      <header className="fixed z-40 flex justify-between items-center px-4 lg:px-8 h-14 lg:h-16 top-14 lg:top-0 left-0 lg:left-[var(--sidebar-width)] w-full lg:w-[calc(100%-var(--sidebar-width))] bg-surface border-b border-outline-variant">
        <h1 className="text-headline-md font-bold text-primary">
          My Resumes
        </h1>
        <button
          type="button"
          className="btn-primary btn-shine px-4 lg:px-6 py-2 rounded-full text-label-md flex items-center gap-2 cursor-not-allowed"
          title="Resume creation is coming soon"
        >
          <MaterialIcon name="add" />
          Create New Resume
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-28 lg:pt-24 lg:ml-[var(--sidebar-width)] pb-12 px-4 lg:px-8 min-h-screen">
        <div className="max-w-[1280px] mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-headline-md text-on-surface">My Resumes</h2>
            <p className="text-body-md text-on-surface-variant">
              Manage, download, and track your tailored CVs.
            </p>
          </div>

          {/* Resume Grid — empty state with New Template card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <motion.div
              className="flex flex-col group cursor-pointer"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 100, damping: 18 }}
            >
              <div className="ambient-card relative aspect-[3/4] bg-surface-container rounded-[20px] border-2 border-dashed border-outline-variant overflow-hidden flex flex-col items-center justify-center gap-4 hover:bg-surface-container-high hover:border-primary transition-all active:scale-[0.98]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-outline-variant group-hover:scale-110 transition-transform">
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
            </motion.div>
          </div>

          {/* Stats Bar */}
          <motion.div
            className="mt-10 bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="text-center md:text-left">
                <div className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
                  Total Resumes
                </div>
                <div className="text-headline-md font-bold text-on-surface">
                  0
                </div>
              </div>
              <div className="hidden md:block w-px h-12 bg-outline-variant" />
              <div className="text-center md:text-left">
                <div className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
                  Avg. ATS Score
                </div>
                <div className="text-headline-md font-bold text-primary">
                  —
                </div>
              </div>
              <div className="flex-grow" />
              <div className="w-full md:w-64">
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-2">
                  <span>Storage Capacity</span>
                  <span>(0%)</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-0" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Resume Tools */}
          <div className="mt-12">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <MaterialIcon name="smart_toy" className="text-primary" filled />
                <h2 className="text-headline-md text-on-surface">
                  AI Resume Tools
                </h2>
              </div>
              <p className="text-body-md text-on-surface-variant mt-1">
                Turn any public GitHub repository into resume-ready content.
              </p>
            </div>
            <GitHubAnalyzer />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="lg:ml-[var(--sidebar-width)] lg:w-[calc(100%-var(--sidebar-width))] w-full flex flex-col lg:flex-row gap-4 justify-between items-center px-4 lg:px-8 py-8 bg-surface-container-lowest border-t border-outline-variant">
        <div className="flex items-center gap-8">
          <span className="text-label-md font-bold text-on-surface">
            NISB-MakeMyCV
          </span>
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
          © 2026 NISB-MakeMyCV. Made by NISB.
        </p>
      </footer>
    </div>
  );
}
