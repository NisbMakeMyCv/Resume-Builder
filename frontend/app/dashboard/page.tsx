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

  const [totalResumes, setTotalResumes] = useState(0);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    
    // Fetch identity
    apiRequest<{
      id: string;
      email: string;
      full_name: string;
      profile_picture: string | null;
    }>("/auth/me", { token })
      .then((me) => {
        setUser(me);
        localStorage.setItem("makemycv_user", JSON.stringify(me));
      })
      .catch(() => {});

    // Fetch completion metrics & resumes
    Promise.all([
      getProfile(token).catch(() => null),
      educationApi.list(token).catch(() => []),
      experienceApi.list(token).catch(() => []),
      skillsApi.list(token).catch(() => []),
      projectsApi.list(token).catch(() => []),
      resumesApi.list(token).catch(() => []),
    ]).then(([profile, edu, exp, skills, proj, resumes]) => {
      let score = 0;
      if (user?.profile_picture) score += 10;
      if (profile?.headline) score += 15;
      if (profile?.summary) score += 15;
      if (profile?.location) score += 10;
      if (edu && edu.length > 0) score += 15;
      if (exp && exp.length > 0) score += 15;
      if (skills && skills.length > 0) score += 10;
      if (proj && proj.length > 0) score += 10;
      setCompletion(Math.min(100, score));
      setTotalResumes(resumes ? resumes.length : 0);
    });
  }, [user?.profile_picture]);

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
              Your career dashboard is up to date.
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
              subtext="Create a resume to get started"
              link={{ label: "Go to My Resumes", href: "/resumes" }}
            />
            <MetricCard
              label="Avg. ATS Score"
              icon="leaderboard"
              value="—"
              subtext="ATS Integration Coming Soon"
              progress={0}
            />
            <MetricCard
              label="Profile Views"
              icon="visibility"
              value="0"
              subtext="Shown once you publish"
            />
          </motion.div>

          {/* Action Hero Card */}
          {completion < 100 && (
            <Reveal>
          <motion.div
            className="ambient-card bg-primary-container text-white p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden"
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(0, 42, 88, 0.24)" }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
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
                  <span>{completion}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className="bg-secondary-container h-3 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
              <Link
                href="/profile"
                className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              >
                Complete Your Profile
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>

            {/* Abstract Decoration */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 -mr-10" />
            <motion.div
              className="hidden md:block z-10 w-48 h-48 rounded-full border-8 border-white/10 flex items-center justify-center"
              animate={{ rotate: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <MaterialIcon
                name="verified_user"
                className="text-white/20 text-6xl"
                filled
              />
            </motion.div>
            </motion.div>
            </Reveal>
          )}

          {/* Recent Activity Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Reveal className="lg:col-span-3">
            <div className="ambient-card bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                <h4 className="text-headline-md text-primary">Recent Activity</h4>
                <span className="text-secondary text-label-md">No activity yet</span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center justify-center py-16 px-6 text-center"
              >
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
                  Create your first resume and let NISB-MakeMyCV help you build a
                  professional, ATS-friendly application.
                </p>
                <Link
                  href="/resumes"
                  className="btn-primary btn-shine mt-6 text-white px-6 py-2.5 rounded-full text-label-md font-semibold"
                >
                  Create My First Resume
                </Link>
              </motion.div>
            </div>
            </Reveal>
          </div>
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
