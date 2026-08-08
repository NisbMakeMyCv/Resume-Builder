"use client";

import { useState } from "react";
import {
  analyzeGitHubRepository,
  improveGitHubResumeBullets,
  GitHubProjectAnalysis,
} from "@/lib/api";

export default function GitHubAnalyzer() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const [analysis, setAnalysis] =
    useState<GitHubProjectAnalysis | null>(null);

  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Analyze GitHub project
  // ---------------------------------------------------------

  async function handleAnalyze() {
    if (!owner.trim() || !repo.trim()) {
      setError(
        "Please enter both GitHub username and repository name."
      );
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const result = await analyzeGitHubRepository(
        owner.trim(),
        repo.trim()
      );

      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze the GitHub repository."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Improve resume bullets
  // ---------------------------------------------------------

  async function handleImproveBullets() {
    if (!analysis) {
      return;
    }

    if (analysis.resume_bullets.length === 0) {
      setError(
        "There are no resume bullets available to improve."
      );
      return;
    }

    setImproving(true);
    setError("");

    try {
      const improvedBullets =
        await improveGitHubResumeBullets(
          analysis.project_name,
          analysis.description,
          analysis.technologies,
          analysis.resume_bullets
        );

      if (!improvedBullets.length) {
        throw new Error(
          "AI could not generate improved resume bullets."
        );
      }

      setAnalysis({
        ...analysis,
        resume_bullets: improvedBullets,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to improve the resume bullets."
      );
    } finally {
      setImproving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Analyze a GitHub Project
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Let AI analyze your GitHub repository and generate
          resume-ready project information.
        </p>
      </div>

      {/* Inputs */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* GitHub Username */}
        <div>
          <label
            htmlFor="github-owner"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            GitHub Username
          </label>

          <input
            id="github-owner"
            type="text"
            value={owner}
            onChange={(event) =>
              setOwner(event.target.value)
            }
            placeholder="Enter your GitHub username"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>

        {/* Repository Name */}
        <div>
          <label
            htmlFor="github-repo"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Repository Name
          </label>

          <input
            id="github-repo"
            type="text"
            value={repo}
            onChange={(event) =>
              setRepo(event.target.value)
            }
            placeholder="Enter repository name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Analyze Button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading || improving}
        className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze Project"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Analysis Result */}
      {analysis && (
        <div className="mt-8 space-y-6">
          {/* Project Name + Description */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {analysis.project_name}
            </h3>

            <p className="mt-2 text-gray-600">
              {analysis.description}
            </p>
          </div>

          {/* Project Type */}
          <div>
            <h4 className="font-semibold text-gray-900">
              Project Type
            </h4>

            <p className="mt-1 text-sm text-gray-600">
              {analysis.project_type}
            </p>
          </div>

          {/* Technologies */}
          {analysis.technologies.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900">
                Technologies
              </h4>

              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.technologies.map(
                  (technology) => (
                    <span
                      key={technology}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {technology}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Important Features */}
          {analysis.features.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900">
                Important Features
              </h4>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {analysis.features.map(
                  (feature) => (
                    <li key={feature}>
                      {feature}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Technical Implementation */}
          {analysis.implementation.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900">
                Technical Implementation
              </h4>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {analysis.implementation.map(
                  (item) => (
                    <li key={item}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Resume Bullets */}
          {analysis.resume_bullets.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900">
                AI-Generated Resume Bullets
              </h4>

              <ul className="mt-2 space-y-3">
                {analysis.resume_bullets.map(
                  (bullet) => (
                    <li
                      key={bullet}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
                    >
                      {bullet}
                    </li>
                  )
                )}
              </ul>

              {/* Improve Button */}
              <button
                type="button"
                onClick={handleImproveBullets}
                disabled={improving || loading}
                className="mt-4 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {improving
                  ? "✨ Improving..."
                  : "✨ Improve These Points"}
              </button>

              <p className="mt-2 text-xs text-gray-500">
                Not satisfied with the generated bullets?
                Let AI improve them while keeping the
                project information accurate.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}