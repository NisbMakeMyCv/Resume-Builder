"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppSidebar from "../components/AppSidebar";
import Protected from "../components/Protected";
import MaterialIcon from "../components/MaterialIcon";
import { apiRequest, getStoredUser, getToken } from "../../lib/api";

/**
 * Dashboard — coded from the `main_dashboard_desktop` stitch frame.
 *
 * The backend only exposes auth today, so the metrics, activity table and
 * "complete profile" card are shown as honest empty states rather than
 * dummy data. Sidebar destinations without backend support stay disabled.
 */
export default function Dashboard() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}

function DashboardInner() {
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiRequest<{ id: string; email: string; full_name: string }>("/auth/me", {
      token,
    })
      .then((me) => {
        setUser(me);
        localStorage.setItem("makemycv_user", JSON.stringify(me));
      })
      .catch(() => {
        /* token may have expired — Protected redirects on next visit */
      });
  }, []);

  const firstName = (user?.full_name ?? "there").split(" ")[0];

  return (
    <div className="min-h-screen text-on-surface bg-surface">
      <AppSidebar />

      {/* Top App Bar */}
      <header className="bg-surface border-b border-outline-variant fixed top-0 left-64 w-[calc(100%-16rem)] h-16 flex justify-between items-center px-8 z-40">
        <span className="text-headline-md font-bold text-primary">
          Dashboard
        </span>
        <Link
          href="/resumes"
          className="bg-primary hover:bg-secondary text-white text-label-md px-6 py-2 rounded-full transition-transform active:scale-95"
        >
          Create New Resume
        </Link>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 pt-16 min-h-screen pb-20">
        <div className="max-w-[1280px] mx-auto p-8 space-y-8">
          {/* Welcome Header */}
          <header>
            <h2 className="text-headline-lg text-primary">
              Hello, {firstName}!
            </h2>
            <p className="text-body-lg text-on-surface-variant">
              Your career dashboard is up to date.
            </p>
          </header>

          {/* Metrics Bento Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Resumes"
              icon="description"
              value="0"
              footnote="Create a resume to get started"
            />
            <MetricCard
              label="Avg. ATS Score"
              icon="analytics"
              value="—"
              footnote="No resumes yet"
              progress={0}
            />
            <MetricCard
              label="Profile Views"
              icon="visibility"
              value="0"
              footnote="Shown once you publish"
            />
          </div>

          {/* Action Hero Card */}
          <div className="bg-primary-container text-white p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden">
            <div className="space-y-4 z-10 max-w-lg">
              <h3 className="text-headline-md text-on-primary-container">
                Complete Your Master Profile
              </h3>
              <p className="text-body-md text-on-primary-container/90">
                Your master profile is the foundation for all your resumes. A
                complete profile allows our AI to better tailor your
                achievements to specific job descriptions.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-on-primary-container">
                  <span>Profile Completion</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div className="bg-secondary-container h-3 rounded-full w-0" />
                </div>
              </div>
              <div className="bg-white/10 border border-white/30 px-8 py-3 rounded-full font-bold text-white/80 cursor-not-allowed inline-block">
                Coming Soon
              </div>
            </div>

            {/* Abstract Decoration */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 -mr-10" />
            <div className="hidden md:block z-10 w-48 h-48 rounded-full border-8 border-white/10 flex items-center justify-center">
              <MaterialIcon
                name="verified_user"
                className="text-white/20 text-6xl"
                filled
              />
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 bg-white rounded-xl border border-outline-variant overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                <h4 className="text-headline-md text-primary">
                  Recent Activity
                </h4>
                <span className="text-secondary text-label-md">
                  No activity yet
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                  <MaterialIcon
                    name="description"
                    className="text-on-surface-variant text-3xl"
                  />
                </div>
                <h5 className="text-label-md font-bold text-on-surface">
                  Your resume journey starts here
                </h5>
                <p className="text-label-md text-on-surface-variant mt-1 max-w-sm">
                  Create your first resume and let MakeMyCV help you build a
                  professional, ATS-friendly application.
                </p>
                <Link
                  href="/resumes"
                  className="mt-6 bg-primary text-white px-6 py-2.5 rounded-full text-label-md font-semibold hover:bg-secondary transition-colors"
                >
                  Create My First Resume
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="ml-64 w-[calc(100%-16rem)] flex justify-between items-center px-8 py-4 bg-surface-container-lowest border-t border-outline-variant text-on-surface-variant text-label-sm">
        <div className="font-label-md font-bold">
          © 2026 MakeMyCV. Made by NISB.
        </div>
        <div className="flex gap-6">
          <a className="hover:text-primary transition-colors" href="#">
            Privacy Policy
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({
  label,
  icon,
  value,
  footnote,
  progress,
}: {
  label: string;
  icon: string;
  value: string;
  footnote: string;
  progress?: number;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-outline-variant hover:border-primary transition-colors flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <MaterialIcon name={icon} className="text-primary" />
      </div>
      <p className="text-headline-lg">{value}</p>
      <p className="text-xs text-secondary">{footnote}</p>
      {progress !== undefined && (
        <div className="w-full bg-surface-container rounded-full h-1.5 mt-1">
          <div
            className="bg-secondary h-1.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
