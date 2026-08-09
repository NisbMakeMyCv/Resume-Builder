"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import Container from "./components/Container";
import MaterialIcon from "./components/MaterialIcon";
import { TypewriterText } from "./components/TypewriterText";
import { cn } from "@/lib/utils";

import LiveClock from "./components/LiveClock";

/**
 * Landing page — `refined_landing_page` stitch frame.
 * Enhanced with: mobile nav, countdown timer, staggered entrance animations,
 * responsive hero, and dark mode support.
 */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="bg-background text-on-background font-body-md min-h-screen flex flex-col overflow-x-hidden">

      {/* ================= TOP NAV BAR ================= */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant">
        <Container className="h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
            <img
              src="/logo.png"
              alt="NISB-MakeMyCV Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="text-[20px] sm:text-headline-md font-bold text-primary tracking-tight whitespace-nowrap">
              NISB-MakeMyCV
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-outline-variant pr-4">
              <LiveClock />
            </div>
            <Link
              href="/signin"
              className="text-label-md font-semibold text-primary px-4 py-2 rounded-full hover:bg-surface-container transition-all btn-press"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-label-md font-semibold shadow-md hover:shadow-lg hover:bg-primary/90 hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 btn-press"
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
        <section className="relative hero-gradient overflow-hidden pt-6 lg:pt-8 pb-12 lg:pb-16">
          <Container className="w-full grid grid-cols-12 gap-6 items-start">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-7 space-y-6 pt-2 pb-4 z-10">

              {/* Headline — stagger 2 */}
              <h1
                className="entrance-fade-up stagger-2 font-headline-lg leading-[1.1] text-primary"
                style={{ fontSize: "clamp(36px, 7vw, 72px)" }}
              >
                Build Your Dream Resume.
                <br />
                <span className="text-secondary">Land Your Career.</span>
              </h1>

              {/* Subtext — stagger 3 */}
              <p className="entrance-fade-up stagger-3 text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                A clean, recruiter-approved resume in minutes. Pick the Jake
                template, tell your story, and let our AI polish the details.
              </p>

              {/* CTAs — stagger 4 */}
              <div className="entrance-fade-up stagger-4 flex flex-wrap gap-4 pt-2">
                <Link
                  href="/signup"
                  className="group bg-primary text-white px-7 py-4 rounded-full font-semibold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 hover:scale-[1.03] active:scale-95 transition-all duration-200 btn-press btn-shine inline-flex items-center gap-2"
                >
                  Start Building For Free
                  <MaterialIcon
                    name="arrow_forward"
                    className="text-[20px] transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="#features"
                  className="bg-surface-container-highest text-primary px-7 py-4 rounded-full font-semibold text-lg hover:bg-surface-container-high hover:-translate-y-1 hover:scale-[1.03] active:scale-95 transition-all duration-200"
                >
                  Explore Features
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Live Resume Canvas */}
            <div className="hidden lg:flex col-span-5 relative justify-end pt-2 pb-4 entrance-fade-up stagger-5">
              
              {/* Floating ATS Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="absolute top-4 right-12 z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-white p-4 shadow-xl flex items-center gap-3 animate-float"
              >
                <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ATS Match</div>
                  <div className="text-lg font-black text-emerald-600 leading-none mt-1">98%</div>
                </div>
              </motion.div>

              {/* Floating AI Badge */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="absolute -bottom-6 -left-12 z-30 bg-white/90 backdrop-blur-md rounded-full border border-white px-5 py-3 shadow-xl flex items-center gap-2 animate-float"
                style={{ animationDelay: '1s' }}
              >
                <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                <span className="text-xs font-bold text-on-surface">AI Bullet Optimization Active</span>
              </motion.div>

              {/* Glass Resume Card */}
              <div className="bg-white/80 dark:bg-surface-container-low/80 backdrop-blur-2xl p-6 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_30px_60px_rgba(0,42,88,0.12)] relative z-10 w-full max-w-[500px]">
                <div className="bg-white dark:bg-surface rounded-[24px] overflow-hidden border border-outline-variant/30 flex flex-col min-h-[560px] shadow-sm">
                  
                  {/* Real Resume Header */}
                  <div className="bg-primary px-8 py-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 mb-4 flex items-center justify-center text-white text-2xl font-bold relative z-10">
                      JR
                    </div>
                    <h2 className="text-2xl font-bold text-white relative z-10">Jake Ryan</h2>
                    <div className="text-white/90 text-sm font-medium mt-1 relative z-10 h-6">
                      <TypewriterText 
                        words={["Senior Full-Stack Engineer", "AI & Machine Learning Developer", "Lead Frontend Architect"]} 
                      />
                    </div>
                    <div className="flex gap-3 text-white/70 text-[10px] mt-4 relative z-10 font-medium">
                      <span>jake@example.com</span>
                      <span>•</span>
                      <span>github.com/jakeryan</span>
                    </div>
                  </div>

                  {/* Real Resume Content (Staggered Animation) */}
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.3, delayChildren: 0.5 }
                      }
                    }}
                    className="flex-1 p-8 space-y-8 bg-[#fdfdfd] dark:bg-surface"
                  >
                    
                    {/* Experience section */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
                      <h3 className="text-xs font-black text-primary tracking-widest uppercase border-b border-outline-variant/40 pb-2 mb-4">Experience</h3>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-sm font-bold text-on-surface">MakeMyCV AI Platform</h4>
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">Present</span>
                        </div>
                        <div className="text-[11px] font-semibold text-secondary italic mb-2">Software Engineer</div>
                        <ul className="list-disc list-outside ml-3 space-y-1.5 text-[11px] text-on-surface-variant leading-relaxed">
                          <li>Engineered FastAPI microservices with Groq LLM integration, reducing resume generation latency by 45%.</li>
                          <li>Designed responsive React & Tailwind components serving 10,000+ active job seekers.</li>
                        </ul>
                      </div>
                    </motion.div>

                    {/* Skills section */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
                      <h3 className="text-xs font-black text-primary tracking-widest uppercase border-b border-outline-variant/40 pb-2 mb-4">Core Competencies</h3>
                      <div className="flex flex-wrap gap-2">
                        {["React", "TypeScript", "FastAPI", "Python", "TailwindCSS", "PostgreSQL"].map(skill => (
                          <span key={skill} className="text-[10px] font-bold text-[#006496] bg-[#006496]/10 dark:text-[#7fc5fd] dark:bg-[#7fc5fd]/10 border border-[#006496]/20 dark:border-[#7fc5fd]/20 px-2.5 py-1 rounded-md hover:bg-[#006496]/20 dark:hover:bg-[#7fc5fd]/20 transition-colors cursor-default">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#d6e3ff]/40 rounded-full blur-[80px] -z-10" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#7fc5fd]/30 rounded-full blur-[80px] -z-10" />
            </div>

            {/* Mobile hero decoration — shown below lg instead of the mockup */}
            <div className="lg:hidden col-span-12 flex justify-center gap-4 pb-8 entrance-fade-up stagger-5">
              {[
                { icon: "psychology", label: "AI Writer" },
                { icon: "fact_check", label: "ATS Check" },
                { icon: "web_stories", label: "Jake Template" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm min-w-[80px]"
                >
                  <span className="material-symbols-outlined text-primary text-[28px]">{icon}</span>
                  <span className="text-[10px] font-semibold text-on-surface-variant text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ================= FEATURES BENTO GRID ================= */}
        <section id="features" className="py-20 md:py-32 bg-surface-container-lowest">
          <Container>
            <div className="text-center mb-16 space-y-4">
              <h2
                className="font-headline-lg text-primary"
                style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
              >
                Everything You Need to Get Hired
              </h2>
              <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Modern tools for modern job seekers. We handle the formatting
                and technicalities so you can focus on your achievements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon="psychology"
                iconClass="bg-primary-container"
                title="AI Resume Assistant"
                text="Our intelligent AI analyzes job descriptions and suggests powerful action verbs and skills to highlight your expertise."
                delay="stagger-1"
              />
              <FeatureCard
                icon="fact_check"
                iconClass="bg-secondary"
                title="ATS Resume Checker"
                text="Instant feedback on how well your CV ranks against Applicant Tracking Systems used by top Fortune 500 companies."
                delay="stagger-2"
              />
              <FeatureCard
                icon="web_stories"
                iconClass="bg-primary"
                title="The Jake Resume Template"
                text="One clean, recruiter-approved layout. Familiar to hiring managers, loved by candidates, and ATS-friendly out of the box."
                delay="stagger-3"
              />
            </div>
          </Container>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section
          id="how-it-works"
          className="py-20 md:py-32 bg-surface-container-low overflow-hidden"
        >
          <Container>
            <div className="text-center mb-16">
              <h2
                className="font-headline-lg text-primary"
                style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
              >
                From Blank Page to Hired
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-4">
                Three simple steps to a professional CV.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 items-start">
              <Step
                number="1"
                title="Pick a Template"
                text="Select from our curated list of professional, ATS-friendly designs."
              />
              <Step
                number="2"
                title="Input Your Content"
                text="Follow our prompts and use AI suggestions to describe your experience."
              />
              <Step
                number="3"
                title="Download & Apply"
                text="Get your CV in PDF or DOCX format and start landing interviews."
              />
            </div>
          </Container>
        </section>

        {/* ================= CTA ================= */}
        <section id="pricing" className="py-20 md:py-32">
          <Container>
            <div className="bg-primary-container rounded-[32px] sm:rounded-[48px] p-8 sm:p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-8">
                <h2
                  className="text-white font-headline-lg leading-tight"
                  style={{ fontSize: "clamp(28px, 5vw, 56px)" }}
                >
                  Ready to Build Your Resume?
                </h2>
                <p className="text-on-primary-container/90 text-body-lg max-w-2xl mx-auto leading-relaxed">
                  Your future employer shouldn&apos;t be the first to see your
                  resume. Make it shine with MakeMyCV&apos;s professional tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-2">
                  <Link
                    href="/signup"
                    className="bg-white text-primary px-8 sm:px-12 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:bg-secondary-fixed transition-all btn-press btn-shine shadow-lg"
                  >
                    Get Started Now
                  </Link>
                  <Link
                    href="#features"
                    className="bg-transparent text-white border-2 border-white/30 px-8 sm:px-12 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:bg-white/10 transition-all btn-press"
                  >
                    View Examples
                  </Link>
                </div>
              </div>

              {/* Abstract Background Shapes */}
              <div className="absolute -bottom-20 -right-20 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-secondary/20 rounded-full blur-[100px]" />
              <div className="absolute -top-20 -left-20 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-on-primary-container/10 rounded-full blur-[100px]" />
            </div>
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
    <div
      className={cn(
        "group tilt-card h-full p-8 bg-surface-bright border border-outline-variant rounded-[24px]",
        "flex flex-col items-center text-center",
        "hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 hover:border-primary/40",
        "relative overflow-hidden entrance-fade-up",
        delay
      )}
    >
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
          <div className="space-y-4 max-w-xs">
            <div className="text-headline-md font-bold text-primary">MakeMyCV</div>
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
            © 2026 MakeMyCV. Made by NISB.
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
