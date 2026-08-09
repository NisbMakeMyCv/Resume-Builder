"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppSidebar from "../components/AppSidebar";
import Protected from "../components/Protected";
import MaterialIcon from "../components/MaterialIcon";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import { apiRequest, getStoredUser, getToken } from "@/lib/api";
import LiveClock from "../components/LiveClock";

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
      <SidebarProvider>
        <DashboardInner />
      </SidebarProvider>
    </Protected>
  );
}

function DashboardInner() {
  const [user, setUser] = useState(getStoredUser());
  const { toggle } = useSidebar();

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
      <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/40 fixed top-0 left-0 w-full lg:left-64 lg:w-[calc(100%-16rem)] h-16 flex justify-between items-center px-6 lg:px-10 z-[300]">
        {/* Hamburger — mobile only */}
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
          <div className="flex items-center gap-4">
            <span className="text-headline-md font-bold text-primary">Dashboard</span>
            <div className="hidden sm:block border-l border-outline-variant pl-4">
              <LiveClock />
            </div>
          </div>
        </div>

        <Link
          href="/resumes"
          className="bg-primary hover:bg-secondary text-white text-label-md px-4 sm:px-6 py-2 rounded-full transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Create New Resume</span>
          <span className="sm:hidden">+ Resume</span>
        </Link>
      </header>

      {/* Main Content Canvas */}
      <main className="lg:pl-64 pt-16 min-h-screen pb-20">
        <div className="w-full p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <header>
            <h2 className="text-headline-lg text-primary">Hello, {firstName}!</h2>
            <p className="text-body-lg text-on-surface-variant">
              Your career dashboard is up to date.
            </p>
          </header>

          {/* Metrics Bento Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <MetricCard
              label="Total Resumes"
              icon="description"
              value="0"
              subtext="Create a resume to get started"
              link={{ label: "Create a resume to get started", href: "/resumes" }}
            />
            <MetricCard
              label="Avg. ATS Score"
              icon="leaderboard"
              value="—"
              subtext="No resumes yet"
              progress={0}
            />
            <MetricCard
              label="Profile Views"
              icon="visibility"
              value="0"
              subtext="Shown once you publish"
            />
          </div>

          {/* Action Hero Card */}
          <div className="bg-primary-container text-white p-6 sm:p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden">
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
            <div className="hidden md:flex z-10 w-48 h-48 rounded-full border-8 border-white/10 items-center justify-center">
              <MaterialIcon
                name="verified_user"
                className="text-white/20 text-6xl"
                filled
              />
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                <h4 className="text-headline-md text-primary">Recent Activity</h4>
                <span className="text-secondary text-label-md">No activity yet</span>
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
      <footer className="ml-0 lg:ml-64 flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 py-4 bg-surface-container-lowest border-t border-outline-variant text-on-surface-variant text-label-sm gap-2">
        <div className="font-label-md font-bold">© 2026 MakeMyCV. Made by NISB.</div>
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
  subtext,
  link,
  progress,
}: {
  label: string;
  icon: string;
  value: string;
  subtext: string;
  link?: { label: string; href: string };
  progress?: number;
}) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    // If value isn't numeric, just show it (e.g. "—")
    const numericTarget = parseInt(value, 10);
    if (isNaN(numericTarget)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayValue(value);
      return;
    }

    // Animate from 0 to target
    let current = 0;
    const duration = 1000; // 1 second
    const frameRate = 16; // ~60fps
    const totalFrames = duration / frameRate;
    const increment = numericTarget / totalFrames;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericTarget) {
        setDisplayValue(numericTarget.toString());
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current).toString());
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="group bg-surface-container-lowest p-6 rounded-[24px] border border-outline-variant/40 hover:border-primary/30 hover:shadow-elev-2 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      <div className="flex justify-between items-center relative z-10">
        <span className="text-label-md font-semibold text-on-surface-variant">{label}</span>
        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <MaterialIcon name={icon} className="text-primary text-[18px]" />
        </div>
      </div>
      <p className="text-[32px] leading-tight font-bold text-on-surface mt-2 relative z-10">{displayValue}</p>
      
      {link ? (
        <Link href={link.href} className="text-xs font-semibold text-secondary hover:text-primary transition-colors relative z-10">
          {link.label}
        </Link>
      ) : (
        <p className="text-xs text-on-surface-variant/70 relative z-10">{subtext}</p>
      )}

      {progress !== undefined && (
        <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 relative z-10 overflow-hidden">
          <div
            className="bg-secondary h-1.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
