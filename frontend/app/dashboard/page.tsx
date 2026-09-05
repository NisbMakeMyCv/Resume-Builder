"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppSidebar from "../components/AppSidebar";
import AnimatedHeading from "../components/AnimatedHeading";
import Reveal from "../components/Reveal";
import Protected from "../components/Protected";
import MaterialIcon from "../components/MaterialIcon";
import { SidebarProvider, useSidebar } from "../components/SidebarContext";
import { 
  apiRequest, 
  getStoredUser, 
  getToken, 
  getProfile, 
  educationApi, 
  experienceApi, 
  skillsApi, 
  projectsApi, 
  resumesApi 
} from "@/lib/api";

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

  const [totalResumes, setTotalResumes] = useState(0);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // B7 FIX: Fetch identity once; don't put `user` in the dep array
    // B8 FIX: Use freshly fetched `me` for profile_picture in completion score
    Promise.all([
      apiRequest<{
        id: string;
        email: string;
        full_name: string;
        profile_picture: string | null;
      }>("/auth/me", { token }),
      getProfile(token).catch(() => null),
      educationApi.list(token).catch(() => []),
      experienceApi.list(token).catch(() => []),
      skillsApi.list(token).catch(() => []),
      projectsApi.list(token).catch(() => []),
      resumesApi.list(token).catch(() => []),
    ]).then(([me, profile, edu, exp, skills, proj, resumes]) => {
      setUser(me);
      localStorage.setItem("makemycv_user", JSON.stringify(me));

      // Use `me.profile_picture` (fresh) not `user?.profile_picture` (stale closure)
      let score = 0;
      if (me.profile_picture) score += 10;
      if (profile?.headline) score += 15;
      if (profile?.summary) score += 15;
      if (profile?.location) score += 10;
      if (edu && edu.length > 0) score += 15;
      if (exp && exp.length > 0) score += 15;
      if (skills && skills.length > 0) score += 10;
      if (proj && proj.length > 0) score += 10;
      setCompletion(Math.min(100, score));
      setTotalResumes(resumes ? resumes.length : 0);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = (user?.full_name ?? "there").split(" ")[0];

  return (
    <div className="page-enter min-h-screen text-on-surface bg-surface">
      <AppSidebar />

      {/* Top App Bar */}
      <header className="bg-surface border-b border-outline-variant fixed z-40 flex justify-between items-center px-4 lg:px-8 h-14 lg:h-16 top-14 lg:top-0 left-0 lg:left-[var(--sidebar-width)] w-full lg:w-[calc(100%-var(--sidebar-width))]">
        <span className="text-headline-md font-bold text-primary">
          Dashboard
        </span>
        <Link
          href="/resumes"
          className="btn-primary btn-shine inline-flex items-center gap-2 text-white text-label-md px-4 lg:px-6 py-2 rounded-full"
        >
          <span className="hidden sm:inline">Create New Resume</span>
          <span className="sm:hidden">+ Resume</span>
        </Link>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-28 lg:pt-16 lg:ml-[var(--sidebar-width)] min-h-screen pb-20">
        <div className="max-w-[1280px] mx-auto p-8 space-y-8">
          {/* Welcome Header */}
          <header>
            <AnimatedHeading
              text={`Hello, ${firstName}!`}
              className="text-headline-lg text-primary"
            />
            <motion.p
              className="text-body-lg text-on-surface-variant"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
            >
              {completion === 100
                ? "Your master profile is 100% complete and ready for instant resume generation!"
                : `Your profile is ${completion}% complete. Fill out your master profile for optimized AI suggestions.`}
            </motion.p>
          </header>

          {/* Metrics Bento Row */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
            }}
          >
            <MetricCard
              label="Total Resumes"
              icon="description"
              value={totalResumes.toString()}
              subtext="Manage your created resumes"
              link={{ label: "Go to My Vault", href: "/resumes" }}
            />
            <MetricCard
              label="Profile Completion"
              icon="how_to_reg"
              value={`${completion}%`}
              subtext="Keep this updated for better AI suggestions"
              progress={completion}
              link={{ label: "Edit Profile", href: "/profile" }}
            />
            <MetricCard
              label="Quick Start"
              icon="bolt"
              value="New"
              subtext="Start building your next resume"
              link={{ label: "Create Resume", href: "/resumes" }}
            />
          </motion.div>

          {/* Action Hero Card */}
          {/* (Hero Card Removed - Profile Completion is now a clean metric card above) */}

          {/* U5 FIX: Quick Actions — replaces always-empty Recent Activity */}
          <Reveal>
            <div className="space-y-4">
              <h4 className="text-headline-md text-primary">Quick Actions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                  icon="add_circle"
                  title="Create New Resume"
                  description="Start building a tailored resume from scratch"
                  href="/resumes"
                  accent="bg-primary-container text-primary"
                />
                <QuickActionCard
                  icon="person_book"
                  title="Update Master Profile"
                  description="Keep your education, skills & experience up to date"
                  href="/profile"
                  accent="bg-secondary-container text-secondary"
                />
                <QuickActionCard
                  icon="smart_toy"
                  title="Analyze a GitHub Repo"
                  description="Let AI write your project bullets from any public repo"
                  href="/resumes"
                  accent="bg-primary-fixed text-on-primary-fixed-variant"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      {/* Footer */}
      <footer className="lg:ml-[var(--sidebar-width)] lg:w-[calc(100%-var(--sidebar-width))] w-full flex flex-col lg:flex-row gap-3 justify-between items-center px-4 lg:px-8 py-4 bg-surface-container-lowest border-t border-outline-variant text-on-surface-variant text-label-sm">
        <div className="font-label-md font-bold">
          © 2026 NISB-MakeMyCV. Made by NISB.
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
    <motion.div
      className="ambient-card bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary transition-colors flex flex-col gap-2"
      variants={{
        hidden: { opacity: 0, y: 26 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 110, damping: 18 } },
      }}
      whileHover={{ y: -5, boxShadow: "0 18px 40px rgba(0, 42, 88, 0.12)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="flex justify-between items-center">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <MaterialIcon name={icon} className="text-primary" />
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
    </motion.div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
  accent,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  accent: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        className="ambient-card bg-surface-container-lowest p-5 rounded-xl border border-outline-variant hover:border-primary transition-all flex items-start gap-4 cursor-pointer group"
        whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0, 42, 88, 0.10)" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent} group-hover:scale-110 transition-transform`}>
          <MaterialIcon name={icon} className="text-[22px]" filled />
        </div>
        <div className="min-w-0">
          <p className="text-label-md font-semibold text-on-surface leading-snug">{title}</p>
          <p className="text-label-sm text-on-surface-variant mt-0.5 leading-snug">{description}</p>
        </div>
        <MaterialIcon name="arrow_forward" className="text-on-surface-variant group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </motion.div>
    </Link>
  );
}
