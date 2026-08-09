"use client";

import { useState } from "react";
import {
  analyzeGitHubRepository,
  improveGitHubResumeBullets,
  GitHubProjectAnalysis,
} from "@/lib/api";
import { useToast } from "@/app/components/ui/Toast";
import { cn } from "@/lib/utils";

/* =========================================================
   Skeleton helpers
   ========================================================= */

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("skeleton h-3 rounded-full", className)} />;
}

function AnalysisSkeleton() {
  return (
    <div
      className="mt-8 space-y-8 animate-pulse"
      aria-busy="true"
      aria-label="Loading analysis…"
    >
      {/* Project name / description */}
      <div className="space-y-3">
        <SkeletonLine className="w-1/2 h-5" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-4/5" />
        <SkeletonLine className="w-3/5" />
      </div>
      {/* Technologies */}
      <div className="space-y-3">
        <SkeletonLine className="w-28 h-4" />
        <div className="flex flex-wrap gap-2">
          {[80, 64, 96, 72, 56].map((w) => (
            <div key={w} className="skeleton h-7 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      {/* Bullets */}
      <div className="space-y-3">
        <SkeletonLine className="w-44 h-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Diff row — shows original vs improved bullet side-by-side
   ========================================================= */

function BulletDiffRow({
  original,
  improved,
  onAccept,
  onReject,
}: {
  original: string;
  improved: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  const changed = original !== improved;
  return (
    <li className="rounded-xl border border-outline-variant overflow-hidden">
      {changed ? (
        <>
          {/* Original */}
          <div className="px-4 py-3 bg-error-container/20 border-b border-outline-variant flex items-start gap-3">
            <span className="text-error text-[18px] material-symbols-outlined shrink-0 mt-0.5">
              remove
            </span>
            <p className="text-sm text-on-surface line-through opacity-70">{original}</p>
          </div>
          {/* Improved */}
          <div className="px-4 py-3 bg-green-50 dark:bg-green-950/20 flex items-start gap-3">
            <span className="text-green-600 text-[18px] material-symbols-outlined shrink-0 mt-0.5">
              add
            </span>
            <p className="text-sm text-on-surface flex-1">{improved}</p>
          </div>
          {/* Accept / Reject controls */}
          <div className="flex border-t border-outline-variant">
            <button
              onClick={onAccept}
              className="flex-1 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              Accept
            </button>
            <div className="w-px bg-outline-variant" />
            <button
              onClick={onReject}
              className="flex-1 py-2 text-xs font-semibold text-error hover:bg-error-container/20 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Keep original
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 py-3 flex items-start gap-3">
          <span className="text-outline text-[18px] material-symbols-outlined shrink-0 mt-0.5">
            horizontal_rule
          </span>
          <p className="text-sm text-on-surface-variant">{improved}</p>
        </div>
      )}
    </li>
  );
}

/* =========================================================
   Copy button
   ========================================================= */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors"
    >
      <span className="material-symbols-outlined text-[14px]">
        {copied ? "check" : "content_copy"}
      </span>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/* =========================================================
   Main component
   ========================================================= */

export default function GitHubAnalyzer() {
  const toast = useToast();

  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const [analysis, setAnalysis] = useState<GitHubProjectAnalysis | null>(null);

  // Diff state: stores the original bullets before "improve" so we can show a diff.
  const [originalBullets, setOriginalBullets] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Analyze
  // ---------------------------------------------------------

  async function handleAnalyze() {
    let finalOwner = owner.trim();
    let finalRepo = repo.trim();

    // Utility to extract owner/repo if user pasted a full URL
    const parseUrl = (input: string) => {
      try {
        if (input.includes("github.com/")) {
          const urlStr = input.startsWith("http") ? input : `https://${input}`;
          const url = new URL(urlStr);
          const parts = url.pathname.split("/").filter(Boolean);
          if (parts.length >= 2) {
            return { parsedOwner: parts[0], parsedRepo: parts[1].replace(".git", "") };
          }
        }
      } catch {
        // ignore parse errors
      }
      return null;
    };

    const parsedFromRepo = parseUrl(finalRepo);
    if (parsedFromRepo) {
      finalOwner = parsedFromRepo.parsedOwner;
      finalRepo = parsedFromRepo.parsedRepo;
      setOwner(finalOwner);
      setRepo(finalRepo);
    } else {
      const parsedFromOwner = parseUrl(finalOwner);
      if (parsedFromOwner) {
        finalOwner = parsedFromOwner.parsedOwner;
        finalRepo = parsedFromOwner.parsedRepo;
        setOwner(finalOwner);
        setRepo(finalRepo);
      }
    }

    if (!finalOwner || !finalRepo) {
      const msg = "Please enter both GitHub username and repository name.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setOriginalBullets([]);
    setShowDiff(false);

    try {
      const result = await analyzeGitHubRepository(finalOwner, finalRepo);
      setAnalysis(result);
      toast.success(`Analyzed "${result.project_name}" successfully.`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unable to analyze the GitHub repository.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Improve bullets
  // ---------------------------------------------------------

  async function handleImproveBullets() {
    if (!analysis || analysis.resume_bullets.length === 0) return;

    setImproving(true);
    setError("");
    // Save current bullets for diff
    setOriginalBullets(analysis.resume_bullets);
    setShowDiff(false);

    try {
      const improved = await improveGitHubResumeBullets(
        analysis.project_name,
        analysis.description,
        analysis.technologies,
        analysis.resume_bullets
      );

      if (!improved.length) throw new Error("AI could not generate improved bullets.");

      setAnalysis({ ...analysis, resume_bullets: improved });
      setShowDiff(true);
      toast.success("Bullets improved! Review the changes below.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unable to improve the resume bullets.";
      setError(msg);
      toast.error(msg);
    } finally {
      setImproving(false);
    }
  }

  // Accept or reject a single improved bullet.
  function handleAcceptBullet() {
    // Actually no state tracking per-bullet is needed, they are already accepted in the state.
    // If you need more complex logic, add it here.
  }

  function handleRejectBullet(idx: number) {
    if (!analysis) return;
    const reverted = [...analysis.resume_bullets];
    reverted[idx] = originalBullets[idx];
    setAnalysis({ ...analysis, resume_bullets: reverted });
  }

  // Commit all — exit diff mode.
  function handleCommitAll() {
    setShowDiff(false);
    setOriginalBullets([]);
    toast.success("All bullet changes saved.");
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="github-owner"
            className="text-label-md font-semibold text-on-surface block"
          >
            GitHub Username
          </label>
          <input
            id="github-owner"
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="e.g. torvalds"
            disabled={loading}
            className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm outline-none input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="github-repo"
            className="text-label-md font-semibold text-on-surface block"
          >
            Repository Name
          </label>
          <input
            id="github-repo"
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="e.g. linux"
            disabled={loading}
            className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm outline-none input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60"
          />
        </div>
      </div>

      {/* Analyze button */}
      <button
        type="button"
        id="analyze-btn"
        onClick={handleAnalyze}
        disabled={loading || improving}
        className="btn-press btn-shine inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary text-label-md font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined text-[18px] animate-spin">
              progress_activity
            </span>
            Analyzing…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">search</span>
            Analyze Project
          </>
        )}
      </button>

      {/* Error */}
      {error && !loading && (
        <div
          role="alert"
          className="rounded-xl border border-error-container bg-error-container/30 px-4 py-3 text-label-md text-on-error-container flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px] text-error shrink-0">
            error
          </span>
          {error}
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && <AnalysisSkeleton />}

      {/* Analysis results */}
      {!loading && analysis && (
        <div className="space-y-8 pt-2">
          {/* Project name + description */}
          <div className="space-y-2">
            <h3 className="text-headline-md font-bold text-primary">
              {analysis.project_name}
            </h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {analysis.description}
            </p>
            {analysis.project_type && (
              <span className="inline-block mt-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {analysis.project_type}
              </span>
            )}
          </div>

          {/* Technologies */}
          {analysis.technologies.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
                Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant text-label-sm text-on-surface-variant font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Important Features */}
          {analysis.features.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
                Key Features
              </h4>
              <ul className="space-y-1.5 pl-4">
                {analysis.features.map((f) => (
                  <li key={f} className="text-sm text-on-surface-variant flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Implementation */}
          {analysis.implementation.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
                Implementation Details
              </h4>
              <ul className="space-y-1.5 pl-4">
                {analysis.implementation.map((item) => (
                  <li key={item} className="text-sm text-on-surface-variant flex gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resume Bullets */}
          {analysis.resume_bullets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">
                  AI-Generated Resume Bullets
                </h4>
                <div className="flex items-center gap-3">
                  {showDiff && (
                    <button
                      type="button"
                      onClick={handleCommitAll}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px]">done_all</span>
                      Accept all
                    </button>
                  )}
                  <CopyButton
                    text={analysis.resume_bullets.map((b) => `• ${b}`).join("\n")}
                  />
                </div>
              </div>

              {showDiff && originalBullets.length > 0 ? (
                /* Diff view */
                <ul className="space-y-3">
                  {analysis.resume_bullets.map((bullet, idx) => (
                    <BulletDiffRow
                      key={idx}
                      original={originalBullets[idx] ?? bullet}
                      improved={bullet}
                      onAccept={() => handleAcceptBullet()}
                      onReject={() => handleRejectBullet(idx)}
                    />
                  ))}
                </ul>
              ) : (
                /* Normal view */
                <ul className="space-y-3">
                  {analysis.resume_bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-3 p-4 rounded-xl border border-outline-variant bg-surface-container-lowest hover:border-primary/40 hover:shadow-sm transition-all group"
                    >
                      <span className="text-primary text-[18px] material-symbols-outlined shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        arrow_right
                      </span>
                      <span className="text-sm text-on-surface leading-relaxed">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Improve button */}
              {!showDiff && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    id="improve-bullets-btn"
                    onClick={handleImproveBullets}
                    disabled={improving || loading}
                    className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant bg-surface text-on-surface text-label-md font-semibold hover:bg-surface-container hover:border-primary/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {improving ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">
                          progress_activity
                        </span>
                        Improving…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          auto_awesome
                        </span>
                        Improve These Bullets
                      </>
                    )}
                  </button>
                  <p className="text-xs text-on-surface-variant">
                    Not satisfied? Let AI strengthen the language while keeping accuracy.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}