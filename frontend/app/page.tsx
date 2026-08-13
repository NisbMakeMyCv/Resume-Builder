"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import Container from "./components/Container";
import HeroResume from "./components/HeroResume";
import LiveClock from "./components/LiveClock";
import Logo from "./components/Logo";
import MaterialIcon from "./components/MaterialIcon";
import Reveal from "./components/Reveal";
import { cn } from "@/lib/utils";

/**
 * Landing page — `refined_landing_page` stitch frame.
 * Enhanced with: mobile nav, countdown timer, staggered entrance animations,
 * responsive hero, and dark mode support.
 */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="page-enter bg-background text-on-background font-body-md min-h-screen flex flex-col overflow-x-hidden">
      {/* ================= TOP NAV BAR ================= */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant shadow-sm">
        <Container className="h-16 flex justify-between items-center">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-outline-variant pr-4">
              <LiveClock />
            </div>
            <Link
              href="/signin"
              className="btn-outline hidden sm:inline-flex text-label-md font-semibold px-4 py-2 rounded-full"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="btn-primary btn-shine btn-magnetic inline-flex text-label-md font-semibold px-6 py-2.5 rounded-full"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </Container>

        {/* Mobile slide-down menu */}
        <div
          className={cn(
            "sm:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-40 border-t border-outline-variant" : "max-h-0"
          )}
        >
          <div className="flex flex-col px-4 py-3 gap-2 bg-surface-container-lowest">
            <Link
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-label-md font-semibold text-primary px-4 py-3 rounded-xl hover:bg-surface-container transition-colors text-center"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-primary text-on-primary px-4 py-3 rounded-xl text-label-md font-semibold text-center hover:bg-primary/90 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-16 pb-8">
        {/* ================= HERO SECTION ================= */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          {/* Real-world background image (dark/blue themed, free license) */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/hero-office.jpg')" }}
          />
          {/* Dark blue overlay for readability + brand tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/70" />
          <div className="absolute inset-0 hero-gradient opacity-40 mix-blend-overlay" />

          <Container className="w-full grid grid-cols-12 gap-6 items-center relative z-10">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-7 space-y-8 py-12 lg:py-20">
              <motion.h1
                className="font-headline-lg text-3xl sm:text-5xl lg:text-[72px] leading-[1.1] text-white"
                initial="hidden"
                animate="show"
              >
                <span className="block overflow-hidden">
                  <WordReveal delay={0.1}>Build Your Dream Resume.</WordReveal>
                </span>
                <span className="block overflow-hidden">
                  <WordReveal delay={0.35} accent>
                    Land Your Career.
                  </WordReveal>
                </span>
              </motion.h1>

              <motion.p
                className="text-body-lg text-white/80 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
              >
                A clean, recruiter-approved resume in minutes. Pick the Jake
                template, tell your story, and let our AI polish the details.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
              >
                <Link
                  href="/signup"
                  className="btn-shine btn-magnetic inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg bg-white text-primary hover:bg-white/90 shadow-2xl shadow-black/20"
                >
                  Start Building For Free
                  <MaterialIcon
                    name="arrow_forward"
                    className="text-[20px] transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="#features"
                  className="btn-magnetic btn-outline inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg !border-white/40 !text-white hover:!bg-white/10"
                >
                  Explore Features
                </Link>
              </motion.div>
            </div>

            {/* Right Column: live "Jake" resume — written on load */}
            <div className="col-span-12 lg:col-span-5 relative flex justify-center lg:justify-end py-12 lg:py-0">
              <HeroResume />
            </div>
          </Container>
        </section>

        {/* ================= FEATURES BENTO GRID ================= */}
        <section id="features" className="py-20 md:py-32 bg-surface-container-lowest">
          <Container>
            <Reveal>
              <div className="text-center mb-20 space-y-6">
                <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-[48px] text-primary">
                  Everything You Need to Get Hired
                </h2>
                <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                  Modern tools for modern job seekers. We handle the formatting
                  and technicalities so you can focus on your achievements.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-12 gap-6 items-stretch">
              <Reveal delay={0} className="col-span-12 md:col-span-4">
                <FeatureCard
                  icon="psychology"
                  iconClass="bg-primary-container"
                  title="AI Resume Assistant"
                  text="Our intelligent AI analyzes job descriptions and suggests powerful action verbs and skills to highlight your expertise."
                />
              </Reveal>
              <Reveal delay={120} className="col-span-12 md:col-span-4">
                <FeatureCard
                  icon="fact_check"
                  iconClass="bg-secondary"
                  title="ATS Resume Checker"
                  text="Instant feedback on how well your CV ranks against Applicant Tracking Systems used by top Fortune 500 companies."
                />
              </Reveal>
              <Reveal delay={240} className="col-span-12 md:col-span-4">
                <FeatureCard
                  icon="web_stories"
                  iconClass="bg-primary"
                  title="The Jake Resume Template"
                  text="One clean, recruiter-approved layout — the Jake template. Familiar to hiring managers, loved by candidates, and ATS-friendly out of the box."
                />
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section
          id="how-it-works"
          className="py-20 md:py-32 bg-surface-container-low overflow-hidden"
        >
          <Container>
            <Reveal>
              <div className="text-center mb-24">
                <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-[48px] text-primary">
                  From Blank Page to Hired
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-4">
                  Three simple steps to a professional CV.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-12 gap-6 items-stretch">
              <Reveal delay={0} className="col-span-12 md:col-span-4">
                <Step
                  number="1"
                  title="Pick a Template"
                  text="Select from our curated list of professional, ATS-friendly designs."
                />
              </Reveal>
              <Reveal delay={120} className="col-span-12 md:col-span-4">
                <Step
                  number="2"
                  title="Input Your Content"
                  text="Follow our prompts and use AI suggestions to describe your experience."
                />
              </Reveal>
              <Reveal delay={240} className="col-span-12 md:col-span-4">
                <Step
                  number="3"
                  title="Download & Apply"
                  text="Get your CV in PDF or DOCX format and start landing interviews."
                />
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ================= CTA ================= */}
        <section id="pricing" className="py-20 md:py-32">
          <Container>
            <Reveal>
            <div className="bg-primary-container rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
              
              <div className="relative z-10 space-y-10">
                <h2 className="text-white font-headline-lg text-2xl sm:text-4xl md:text-[56px] leading-tight">
                  Ready to Build Your Resume?
                </h2>
                <p className="text-on-primary-container/90 text-body-lg max-w-2xl mx-auto leading-relaxed">
                  Your future employer shouldn&apos;t be the first to see your
                  resume. Make it shine with NISB-MakeMyCV&apos;s professional tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-2">
                  <Link
                    href="/signup"
                    className="btn-shine btn-magnetic inline-flex items-center gap-2 px-12 py-5 rounded-full font-bold text-xl bg-white text-primary hover:bg-white/90 shadow-2xl shadow-black/20"
                  >
                    Get Started Now
                  </Link>
                  <Link
                    href="#features"
                    className="btn-magnetic inline-flex items-center gap-2 bg-transparent text-white border-2 border-white/30 px-12 py-5 rounded-full font-bold text-xl hover:bg-white/10 hover:border-white/50 transition-all btn-press"
                  >
                    View Examples
                  </Link>
                </div>
              </div>

              {/* Abstract Background Shapes */}
              <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] animate-drift" />
              <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-on-primary-container/10 rounded-full blur-[100px] animate-drift-slow" />
            </div>
            </Reveal>
          </Container>
        </section>
      </div>

      {/* ================= FOOTER ================= */}
      <Footer />
    </main>
  );
}

/* =========================================================
   LOCAL COMPONENTS
   ========================================================= */

function FeatureCard({
  icon,
  iconClass,
  title,
  text,
  delay,
}: {
  icon: string;
  iconClass: string;
  title: string;
  text: string;
  delay?: string;
}) {
  return (
    <div className="group col-span-12 md:col-span-4 tilt-card ambient-card h-full p-8 bg-surface-bright border border-outline-variant rounded-[24px] flex flex-col items-center text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 hover:border-primary/40 relative overflow-hidden">
      {/* Hover glow accent */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 group-hover:scale-125 transition-all duration-500" />
      <div className="space-y-6 relative">
        <div
          className={cn(
            "w-14 h-14 mx-auto rounded-2xl flex items-center justify-center",
            "group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300",
            iconClass
          )}
        >
          <MaterialIcon name={icon} className="text-white text-3xl" filled />
        </div>
        <h3 className="font-headline-md text-primary text-2xl">{title}</h3>
        <p className="text-on-surface-variant leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-surface-container-lowest border-4 border-primary-fixed text-primary font-bold text-2xl flex items-center justify-center shadow-xl">
        {number}
      </div>
      <div className="space-y-3">
        <h4 className="font-bold text-xl text-primary">{title}</h4>
        <p className="text-on-surface-variant max-w-xs mx-auto leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant mt-auto">
      <Container className="py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-5 max-w-xs">
            <div className="text-headline-md font-bold text-primary">
              NISB-MakeMyCV
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              The clean, AI-assisted resume builder for ambitious professionals
              worldwide.
            </p>
          </div>

          {/* Product links */}
          <div className="flex flex-col gap-4 sm:items-end">
            <h5 className="font-bold text-on-surface">Product</h5>
            <ul className="flex flex-row gap-6 text-on-surface-variant">
              <FooterLink>Resume</FooterLink>
              <FooterLink>AI Writer</FooterLink>
              <FooterLink>ATS Scan</FooterLink>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-label-sm text-on-surface-variant">
            © 2026 NISB-MakeMyCV. Made by NISB.
          </p>
          <div className="flex gap-6 text-label-sm font-semibold text-on-surface-variant">
            <a className="hover:text-primary transition-colors hover:underline" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-primary transition-colors hover:underline" href="#">
              Terms and Conditions
            </a>
            <a className="hover:text-primary transition-colors hover:underline" href="#">
              Contact
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <a className="hover:text-primary transition-colors cursor-pointer">{children}</a>
    </li>
  );
}

/**
 * Per-word slide-up reveal for the hero headline. Each word rises and fades
 * in sequentially for a premium, editorial effect.
 */
function WordReveal({
  children,
  delay = 0,
  accent = false,
}: {
  children: string;
  delay?: number;
  accent?: boolean;
}) {
  const words = children.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          className={`inline-block overflow-hidden align-top ${
            accent ? "text-sky-200" : "text-white"
          }`}
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{
              delay: delay + i * 0.07,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </>
  );
}
