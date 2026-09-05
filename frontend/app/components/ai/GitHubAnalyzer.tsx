"use client";

import { useState } from "react";
import MaterialIcon from "../MaterialIcon";
import {
  analyzeGitHubRepo,
  getToken,
  improveGitHubBullets,
  type GitHubAnalysis,
} from "../../../lib/api";

/**
 * AI Features — GitHub Repository Analyzer.
 *
 * Takes an `owner` / `repo` pair, sends it to
 * POST /api/v1/ai/github/analyze, and renders the resume-ready output
 * (description, project type, detected technologies, and 3 resume bullets).
 * The "Improve Bullets" button sends the current result to
 * POST /api/v1/ai/github/improve-bullets for iterative refinement.
 *
 * Requires a signed-in user: the JWT is sent as a Bearer token (the AI
 * routes are registered under /api/v1/ai/github on the backend).
 */
export default function GitHubAnalyzer({ onAddProject }: { onAddProject?: (project: any) => void }) {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState<GitHubAnalysis | null>(null);
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState("");

  // U16 FIX: Pre-check auth so we can show a locked state up-front
  const isSignedIn = typeof window !== "undefined" && !!localStorage.getItem("makemycv_access_token");

  async function handleAnalyze() {
    const token = getToken();
    if (!token) {
      setError("Please sign in to use AI features.");
      return;
    }
    if (!owner.trim() || !repo.trim()) {
      setError("Enter both the GitHub owner and repository name.");
      return;
    }

    setError("");
    setImproveError("");
    setLoading(true);
    try {
      const res = await analyzeGitHubRepo(token, owner.trim(), repo.trim());
      setAnalysis(res.analysis);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    if (!analysis) return;

    const token = getToken();
    if (!token) {
      setImproveError("Please sign in to use AI features.");
      return;
    }

    setImproveError("");
    setImproving(true);
    try {
      const res = await improveGitHubBullets(token, {
        project_name: analysis.project_name,
        description: analysis.description,
        technologies: analysis.technologies,
        current_bullets: analysis.resume_bullets,
      });
      setAnalysis((prev) =>
        prev ? { ...prev, resume_bullets: res.resume_bullets } : prev
      );
    } catch (err) {
      setImproveError(
        err instanceof Error
          ? err.message
          : "Could not improve bullets. Please try again."
      );
    } finally {
      setImproving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
          <MaterialIcon name="smart_toy" className="text-primary" filled />
        </div>
        <div>
          <h3 className="text-headline-md text-primary">GitHub Analyzer</h3>
          <p className="text-label-sm text-on-surface-variant">
            Paste a public repo and let AI write your resume project section.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-label-md font-semibold text-on-surface block">
              Owner
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all"
              placeholder="github-username"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-label-md font-semibold text-on-surface block">
              Repository
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all"
              placeholder="repository-name"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
          </div>
        </div>

        {/* U16 FIX: Show locked state if not signed in */}
        {!isSignedIn && (
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl border border-outline-variant">
            <MaterialIcon name="lock" className="text-on-surface-variant text-[20px]" />
            <p className="text-label-md text-on-surface-variant">
              <span className="font-semibold text-on-surface">Sign in required</span> — AI features need an account.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !isSignedIn}
          title={!isSignedIn ? "Sign in to use AI features" : undefined}
          className="btn-primary btn-shine px-6 py-3 rounded-full text-label-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <MaterialIcon name="sync" className="animate-spin text-[18px]" />
          ) : !isSignedIn ? (
            <MaterialIcon name="lock" className="text-[18px]" />
          ) : (
            <MaterialIcon name="auto_awesome" className="text-[18px]" filled />
          )}
          {loading ? "Analyzing..." : !isSignedIn ? "Sign in to Analyze" : "Analyze Repository"}
        </button>

        {/* Errors */}
        {error && (
          <div className="rounded-lg border border-error-container bg-error-container/40 px-4 py-3 text-label-md text-on-error-container">
            {error}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6 pt-2 border-t border-outline-variant">
            {/* Project header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-headline-md text-on-surface">
                    {analysis.project_name}
                  </h4>
                  <span className="text-label-sm bg-primary-fixed text-on-primary-fixed px-2.5 py-0.5 rounded-full font-semibold">
                    {analysis.project_type}
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant mt-2">
                  {analysis.description}
                </p>
              </div>
            </div>

            {/* Technologies */}
            {analysis.technologies.length > 0 && (
              <div>
                <p className="text-label-md font-semibold text-on-surface mb-2">
                  Technology Stack
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-label-sm bg-surface-container px-3 py-1 rounded-full text-on-surface-variant"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume bullets */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-label-md font-semibold text-on-surface">
                  Resume Bullets
                </p>
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={improving}
                  className="btn-outline px-4 py-2 rounded-full text-label-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {improving ? (
                    <MaterialIcon
                      name="sync"
                      className="animate-spin text-[16px]"
                    />
                  ) : (
                    <MaterialIcon name="auto_fix_high" className="text-[16px]" />
                  )}
                  {improving ? "Improving..." : "Improve Bullets"}
                </button>
              </div>
              {improveError && (
                <p className="text-label-sm text-error mb-2">{improveError}</p>
              )}
              <ul className="space-y-2">
                {analysis.resume_bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-body-md text-on-surface-variant"
                  >
                    <MaterialIcon
                      name="check_circle"
                      className="text-secondary shrink-0 text-[18px]"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              
              {onAddProject && (
                <div className="mt-6 flex flex-wrap justify-between gap-3">
                  {/* U17 FIX: Analyze another repo without closing the panel */}
                  <button
                    type="button"
                    onClick={() => {
                      setAnalysis(null);
                      setOwner("");
                      setRepo("");
                      setError("");
                      setImproveError("");
                    }}
                    className="btn-outline px-4 py-2 rounded-full text-label-sm flex items-center gap-1.5"
                  >
                    <MaterialIcon name="refresh" className="text-[16px]" />
                    Analyze Another Repo
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddProject({
                      title: analysis.project_name,
                      description: analysis.description,
                      technologies: analysis.technologies.join(", "),
                      links: `https://github.com/${owner}/${repo}`,
                      bullets: analysis.resume_bullets
                    })}
                    className="btn-primary px-5 py-2.5 rounded-full text-label-md flex items-center gap-2"
                  >
                    <MaterialIcon name="add_circle" className="text-[18px]" />
                    Add to Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
