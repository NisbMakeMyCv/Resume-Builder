"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import MaterialIcon from "./MaterialIcon";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DISPLAY_MS = 6000;

/* =========================================================
   MOCK PROFILES — the card cycles through these
   ========================================================= */
const profiles = [
  {
    initials: "JT",
    avatarColor: "bg-blue-300",
    name: "Jake Thompson",
    role: "Senior Software Engineer",
    summary: "Results-driven engineer with 5+ years scaling distributed systems. Proven track record of reducing latency and leading end-to-end delivery of mission-critical product features.",
    contact: [
      { icon: "mail", text: "jake.t@email.com" },
      { icon: "call", text: "+91 98765 43210" },
      { icon: "location_on", text: "Bengaluru, IN" },
    ] as const,
    skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "Redis", "Docker", "AWS"],
    jobs: [
      {
        title: "Senior Software Engineer",
        meta: "TechCorp · 2022 — Present",
        bullets: [
          "Architected a scalable design system powering 40+ high-traffic product screens.",
          "Cut core page load times by 38% through advanced code-splitting and dynamic caching.",
          "Mentored 3 junior engineers to promotion; established bi-weekly technical review cycles.",
        ],
      },
      {
        title: "Software Engineer",
        meta: "StartupX · 2019 — 2022",
        bullets: [
          "Shipped a real-time analytics dashboard utilized by 12,000+ daily active users.",
          "Spearheaded migration from monolith to microservices, reducing deployment time by 60%.",
        ],
      },
    ],
    projects: [
      { name: "OpenResume CLI", desc: "Open-source CLI tool to parse and score PDF resumes against job descriptions." },
      { name: "DevTrack", desc: "GitHub-integrated sprint tracking dashboard featuring AI velocity predictions." },
    ],
    edu: ["B.Tech, Computer Science", "NIT Surathkal · 2015 — 2019"],
  },
  {
    initials: "SR",
    avatarColor: "bg-rose-300",
    name: "Sofia Ramirez",
    role: "UX / UI Designer",
    summary: "Award-winning product designer specializing in enterprise SaaS and accessibility. Passionate about transforming complex workflows into intuitive, inclusive user experiences.",
    contact: [
      { icon: "mail", text: "sofia.r@email.com" },
      { icon: "call", text: "+1 555 218 0412" },
      { icon: "location_on", text: "New York, US" },
    ] as const,
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "A11y", "React"],
    jobs: [
      {
        title: "Lead Product Designer",
        meta: "Designly · 2021 — Present",
        bullets: [
          "Redesigned the flagship SaaS dashboard, serving 8,000+ enterprise clients globally.",
          "Boosted new user onboarding conversion by 27% through iterative A/B testing.",
          "Established and scaled a shared component library of 120+ atomic design tokens.",
        ],
      },
      {
        title: "UI Designer",
        meta: "Pixelworks · 2018 — 2021",
        bullets: [
          "Delivered 60+ high-fidelity mockups for both native mobile and responsive web apps.",
          "Reduced design-to-dev handoff time by 40% via rigorous Figma auto-layout standards.",
        ],
      },
    ],
    projects: [
      { name: "PaletteAI", desc: "AI color palette generator algorithmically tuned for WCAG AA compliance." },
      { name: "DesignLint", desc: "Custom Figma plugin that flags contrast accessibility issues in real time." },
    ],
    edu: ["BFA Interaction Design", "School of Visual Arts · 2014 — 2018"],
  },
  {
    initials: "AK",
    avatarColor: "bg-amber-300",
    name: "Arjun Kapoor",
    role: "Full-Stack Developer",
    summary: "Versatile full-stack developer with deep expertise in Python ecosystems. Adept at building resilient APIs, optimizing queries, and automating deployment pipelines.",
    contact: [
      { icon: "mail", text: "arjun.k@email.com" },
      { icon: "call", text: "+91 77001 44550" },
      { icon: "location_on", text: "Mumbai, IN" },
    ] as const,
    skills: ["Python", "Django", "FastAPI", "React", "AWS", "Celery", "PostgreSQL", "Terraform"],
    jobs: [
      {
        title: "Full-Stack Developer",
        meta: "CloudBridge · 2022 — Present",
        bullets: [
          "Architected and deployed a highly-available backend serving 200k+ requests daily.",
          "Slashed AWS infrastructure costs by 30% via intelligent auto-scaling and spot instances.",
          "Implemented rigorous end-to-end encryption securing over 500,000 active user records.",
        ],
      },
      {
        title: "Junior Developer",
        meta: "WebCraft · 2020 — 2022",
        bullets: [
          "Built and maintained 12+ client-facing RESTful APIs using Django Rest Framework.",
          "Automated manual reporting pipelines, saving the operations team 8 hours per week.",
        ],
      },
    ],
    projects: [
      { name: "BillSplit API", desc: "Serverless backend for expense-splitting with advanced OCR receipt parsing." },
      { name: "Infra-Watcher", desc: "Go-based Terraform drift-detection bot with integrated Slack alerting." },
    ],
    edu: ["B.Tech, IT Engineering", "VJTI Mumbai · 2016 — 2020"],
  },
  {
    initials: "MP",
    avatarColor: "bg-emerald-300",
    name: "Maya Patel",
    role: "Product Manager",
    summary: "Strategic, data-informed Product Manager focused on fintech growth and user retention. Experienced in leading cross-functional squads to deliver high-impact features.",
    contact: [
      { icon: "mail", text: "maya.p@email.com" },
      { icon: "call", text: "+44 7700 980 000" },
      { icon: "location_on", text: "London, UK" },
    ] as const,
    skills: ["Agile/Scrum", "Jira", "SQL", "Mixpanel", "Amplitude", "Roadmapping", "A/B Testing"],
    jobs: [
      {
        title: "Senior Product Manager",
        meta: "Finova · 2021 — Present",
        bullets: [
          "Launched a seamless frictionless payments feature that drove £2M in net new ARR.",
          "Led a cross-functional squad of 14 software engineers, UX designers, and analysts.",
          "Reduced customer churn by 18% via targeted, data-driven user retention loops.",
        ],
      },
      {
        title: "Product Analyst",
        meta: "InsightCo · 2019 — 2021",
        bullets: [
          "Identified core churn behaviors, developing interventions that saved 15% of at-risk users.",
          "Built comprehensive SQL dashboards tracking 30+ critical KPIs for executive review.",
        ],
      },
    ],
    projects: [
      { name: "GrowthOS", desc: "Internal OKR management and tracking tool adopted organization-wide." },
      { name: "NPS Engine", desc: "Automated NPS collection engine with automated weekly Slack digest reports." },
    ],
    edu: ["MBA, Strategy", "London Business School · 2017 — 2019"],
  },
] as const;

/* Per-profile card cross-fade */
const cardVariants: Variants = {
  initial: { opacity: 0, y: 18, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -18,
    filter: "blur(6px)",
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

/**
 * Small reveal wrapper — staggered entrance animation per content row.
 */
function Print({
  delay,
  y = 10,
  className = "",
  children,
}: {
  delay: number;
  y?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * HeroResume — live, multi-profile "Jake-style" resume mockup.
 * Made 100% responsive with sm: fluid typography breakpoints.
 */
export default function HeroResume() {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  const advance = useCallback(
    () => setIdx((i) => (i + 1) % profiles.length),
    []
  );

  useEffect(() => {
    const id = setInterval(advance, DISPLAY_MS);
    return () => clearInterval(id);
  }, [advance]);

  const p = profiles[idx];

  const float = reduced
    ? { animate: undefined, transition: undefined }
    : {
        animate: { y: [0, -10, 0] },
        transition: {
          delay: 1.8,
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  return (
    <>
      {/* ============ RESUME CARD ============ */}
      <motion.div
        className="glass-card p-2 sm:p-4 rounded-[32px] border border-outline-variant shadow-2xl relative z-10 w-full max-w-[480px]"
        initial={{ opacity: 0, y: 40, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: EASE }}
      >
        {/* ATS Score Badge */}
        {!reduced && (
          <motion.div
            className="absolute top-2 right-2 z-20 rounded-full bg-white/95 border border-outline-variant shadow-lg px-2 py-1 sm:px-2.5 sm:py-1.5 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, rotate: 10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 15 }}
          >
            <motion.div
              className="flex items-center gap-1 text-primary"
              animate={reduced ? undefined : { y: [0, -3, 0] }}
              transition={
                reduced
                  ? undefined
                  : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }
              }
            >
              <MaterialIcon name="verified" className="text-[10px] sm:text-[13px] text-secondary" filled />
              <span className="text-[7.5px] sm:text-[9px] font-bold">ATS 94/100</span>
            </motion.div>
          </motion.div>
        )}

        <motion.div
          className="bg-white rounded-[24px] overflow-hidden border border-outline-variant aspect-[3/4] flex flex-col relative"
          initial={false}
          animate={float.animate}
          transition={float.transition}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={idx}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex"
            >
              {/* ================= LEFT SIDEBAR — dark navy ================= */}
              <div className="w-[36%] bg-primary text-white p-2 sm:p-3.5 flex flex-col gap-1 sm:gap-2 overflow-hidden">
                {/* Avatar */}
                <Print delay={0.15} y={14}>
                  <motion.div
                    className={`w-9 h-9 sm:w-12 sm:h-12 ${p.avatarColor} rounded-full border-2 border-white/40 mx-auto flex items-center justify-center`}
                    initial={{ scale: 0, rotate: -14 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 14 }}
                  >
                    <span className="text-white text-[10px] sm:text-[14px] font-bold">{p.initials}</span>
                  </motion.div>
                </Print>

                <Print delay={0.26} y={8}>
                  <div className="text-center text-[7.5px] sm:text-[10px] font-bold tracking-tight">{p.name}</div>
                </Print>
                <Print delay={0.33}>
                  <div className="text-center text-[5.5px] sm:text-[7.5px] text-white/70 leading-tight">{p.role}</div>
                </Print>

                <Print delay={0.42}>
                  <div className="border-t border-white/15 my-0.5" />
                </Print>
                <Print delay={0.48}>
                  <div className="text-[5px] sm:text-[6.5px] font-bold tracking-[0.14em] text-white/50">CONTACT</div>
                </Print>
                {p.contact.map((row, i) => (
                  <Print key={row.icon} delay={0.53 + i * 0.05}>
                    <div className="flex items-center gap-1 text-[5px] sm:text-[6.5px] text-white/70 leading-tight">
                      <MaterialIcon name={row.icon} className="text-[7px] sm:text-[9px] text-secondary-container shrink-0" />
                      <span className="truncate">{row.text}</span>
                    </div>
                  </Print>
                ))}

                <Print delay={0.72}>
                  <div className="border-t border-white/15 my-0.5" />
                </Print>
                <Print delay={0.78}>
                  <div className="text-[5px] sm:text-[6.5px] font-bold tracking-[0.14em] text-white/50">SKILLS</div>
                </Print>
                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                  {p.skills.map((s, i) => (
                    <Print key={s} delay={0.83 + i * 0.04}>
                      <span className="inline-block px-1 sm:px-1.5 py-[2px] rounded-sm bg-white/10 border border-white/10 text-[5px] sm:text-[6.5px] text-white/90">
                        {s}
                      </span>
                    </Print>
                  ))}
                </div>
              </div>

              {/* ================= RIGHT MAIN — white ================= */}
              <div className="flex-1 p-2 sm:p-3.5 space-y-1.5 sm:space-y-2 relative overflow-hidden">
                {/* SUMMARY */}
                <Print delay={0.25}>
                  <div className="text-[5.5px] sm:text-[7.5px] font-bold tracking-[0.14em] text-primary border-b border-primary/15 pb-0.5">
                    SUMMARY
                  </div>
                </Print>
                <Print delay={0.3}>
                  <div className="text-[5px] sm:text-[6.5px] text-on-surface-variant leading-snug">
                    {p.summary}
                  </div>
                </Print>

                {/* EXPERIENCE */}
                <Print delay={0.35}>
                  <div className="text-[5.5px] sm:text-[7.5px] font-bold tracking-[0.14em] text-primary border-b border-primary/15 pb-0.5 pt-0.5">
                    EXPERIENCE
                  </div>
                </Print>

                {p.jobs.map((job, j) => (
                  <div key={job.title} className="space-y-0.5">
                    <Print delay={0.42 + j * 0.2}>
                      <div className="text-[6.5px] sm:text-[8.5px] font-semibold text-on-surface leading-tight">{job.title}</div>
                    </Print>
                    <Print delay={0.46 + j * 0.2}>
                      <div className="text-[5px] sm:text-[6.5px] text-on-surface-variant/80">{job.meta}</div>
                    </Print>
                    <div className="space-y-0.5 pt-0.5">
                      {job.bullets.map((b, i) => (
                        <Print key={b} delay={0.5 + j * 0.2 + i * 0.05}>
                          <div className="flex items-start gap-1">
                            <span className="mt-[2px] sm:mt-[3px] w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-primary shrink-0" />
                            <span className="text-[5px] sm:text-[6.5px] text-on-surface-variant leading-snug">{b}</span>
                          </div>
                        </Print>
                      ))}
                    </div>
                  </div>
                ))}

                {/* PROJECTS */}
                <Print delay={0.9}>
                  <div className="text-[5.5px] sm:text-[7.5px] font-bold tracking-[0.14em] text-primary border-b border-primary/15 pb-0.5 pt-0.5">
                    PROJECTS
                  </div>
                </Print>
                <div className="space-y-1">
                  {p.projects.map((proj, i) => (
                    <Print key={proj.name} delay={0.95 + i * 0.07}>
                      <div className="space-y-[1px]">
                        <div className="text-[6px] sm:text-[7.5px] font-semibold text-on-surface leading-tight">{proj.name}</div>
                        <div className="text-[5px] sm:text-[6.5px] text-on-surface-variant leading-snug">{proj.desc}</div>
                      </div>
                    </Print>
                  ))}
                </div>

                {/* EDUCATION */}
                <Print delay={1.12}>
                  <div className="text-[5.5px] sm:text-[7.5px] font-bold tracking-[0.14em] text-primary border-b border-primary/15 pb-0.5 pt-0.5">
                    EDUCATION
                  </div>
                </Print>
                <Print delay={1.18}>
                  <div className="text-[6.5px] sm:text-[8.5px] font-semibold text-on-surface leading-tight">{p.edu[0]}</div>
                </Print>
                <Print delay={1.22}>
                  <div className="text-[5px] sm:text-[6.5px] text-on-surface-variant/80">{p.edu[1]}</div>
                </Print>

                {/* Blinking caret */}
                {!reduced && (
                  <motion.div
                    className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-1.5 sm:h-2 w-[2px] sm:w-[3px] rounded-sm bg-secondary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0] }}
                    transition={{
                      duration: 1.3,
                      times: [0, 0.08, 0.2, 0.3, 0.45, 0.55, 0.7, 0.8, 1],
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ============ DECORATIVE GLOW ============ */}
      <motion.div
        className="absolute -top-10 -right-10 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl -z-10"
        animate={reduced ? undefined : { y: [0, 14, 0], x: [0, -10, 0] }}
        transition={reduced ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -z-10"
        animate={reduced ? undefined : { y: [0, -14, 0], x: [0, 10, 0] }}
        transition={reduced ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
