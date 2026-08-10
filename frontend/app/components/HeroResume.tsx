"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import MaterialIcon from "./MaterialIcon";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DISPLAY_MS = 4500; // time each profile stays on screen

/* =========================================================
   MOCK PROFILES — the card cycles through these
   ========================================================= */
const profiles = [
  {
    initials: "JT",
    avatarColor: "bg-blue-300",
    name: "Jake Thompson",
    role: "Senior Software Engineer",
    contact: [
      { icon: "mail", text: "jake.t@email.com" },
      { icon: "call", text: "+91 98XXXXXX" },
      { icon: "location_on", text: "Bengaluru, IN" },
    ] as const,
    skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL"],
    jobs: [
      {
        title: "Senior Software Engineer",
        meta: "TechCorp · 2022 — Present",
        bullets: [
          "Built a design system powering 40+ product screens.",
          "Cut page load time 38% with code-splitting + caching.",
        ],
      },
      {
        title: "Software Engineer",
        meta: "StartupX · 2019 — 2022",
        bullets: ["Shipped a real-time analytics dashboard for 12k users."],
      },
    ],
    edu: ["B.Tech, Computer Science", "NIT Surathkal · 2015 — 2019"],
  },
  {
    initials: "SR",
    avatarColor: "bg-rose-300",
    name: "Sofia Ramirez",
    role: "UX / UI Designer",
    contact: [
      { icon: "mail", text: "sofia.r@email.com" },
      { icon: "call", text: "+1 555 2180" },
      { icon: "location_on", text: "New York, US" },
    ] as const,
    skills: ["Figma", "React", "Tailwind", "A11y"],
    jobs: [
      {
        title: "Lead Product Designer",
        meta: "Designly · 2021 — Present",
        bullets: [
          "Designed a SaaS dashboard for 8k+ enterprise clients.",
          "Boosted onboarding conversion 27%.",
        ],
      },
      {
        title: "UI Designer",
        meta: "Pixelworks · 2018 — 2021",
        bullets: ["Delivered 60+ high-fidelity mockups across mobile + web."],
      },
    ],
    edu: ["BFA Interaction Design", "SVA · 2014 — 2018"],
  },
  {
    initials: "AK",
    avatarColor: "bg-amber-300",
    name: "Arjun Kapoor",
    role: "Full-Stack Developer",
    contact: [
      { icon: "mail", text: "arjun.k@email.com" },
      { icon: "call", text: "+91 77XXXX4455" },
      { icon: "location_on", text: "Mumbai, IN" },
    ] as const,
    skills: ["Python", "Django", "React", "AWS"],
    jobs: [
      {
        title: "Full-Stack Developer",
        meta: "CloudBridge · 2022 — Present",
        bullets: [
          "Architected a backend serving 200k+ requests/day.",
          "Cut AWS costs 30% via auto-scaling.",
        ],
      },
      {
        title: "Junior Developer",
        meta: "WebCraft · 2020 — 2022",
        bullets: ["Built 12+ client-facing REST APIs."],
      },
    ],
    edu: ["B.Tech, IT Engineering", "VJTI Mumbai · 2016 — 2020"],
  },
  {
    initials: "MP",
    avatarColor: "bg-emerald-300",
    name: "Maya Patel",
    role: "Product Manager",
    contact: [
      { icon: "mail", text: "maya.p@email.com" },
      { icon: "call", text: "+44 7700 980000" },
      { icon: "location_on", text: "London, UK" },
    ] as const,
    skills: ["Jira", "SQL", "Notion", "Analytics"],
    jobs: [
      {
        title: "Senior Product Manager",
        meta: "Finova · 2021 — Present",
        bullets: [
          "Launched a payments feature driving £2M ARR.",
          "Led cross-functional team of 14 engineers.",
        ],
      },
      {
        title: "Product Analyst",
        meta: "InsightCo · 2019 — 2021",
        bullets: ["Identified churn patterns saving 15% of at-risk users."],
      },
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
 * Small reveal wrapper — one top-to-bottom "print" step of the animation.
 * Each line slides up + fades in at its own delay. Replays on every profile
 * swap because the profile subtree remounts with a new key.
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
 * HeroResume — live, multi-profile "Jake-style" resume mockup. The card
 * cycles through 4 placeholder candidates every ~4.5s; each swap cross-fades
 * the whole card and replays a top-to-bottom staggered "print" of the new
 * profile's content with a blinking caret. Pure visual — no data or backend.
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
        className="glass-card p-4 rounded-[32px] border border-outline-variant shadow-2xl relative z-10 w-full max-w-[480px]"
        initial={{ opacity: 0, y: 40, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: EASE }}
      >
        <motion.div
          className="bg-white rounded-[24px] overflow-hidden border border-outline-variant aspect-[3/4] flex flex-col relative"
          initial={false}
          animate={float.animate}
          transition={float.transition}
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* Keyed by profile → whole card cross-fades on swap */}
            <motion.div
              key={idx}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex"
            >
              {/* ================= LEFT SIDEBAR — dark navy ================= */}
              <div className="w-[38%] bg-primary text-white p-3.5 sm:p-4 flex flex-col gap-2 overflow-hidden">
                {/* Avatar pops in first */}
                <Print delay={0.15} y={14}>
                  <motion.div
                    className={`w-12 h-12 sm:w-14 sm:h-14 ${p.avatarColor} rounded-full border-2 border-white/40 mx-auto flex items-center justify-center`}
                    initial={{ scale: 0, rotate: -14 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.15,
                      type: "spring",
                      stiffness: 240,
                      damping: 14,
                    }}
                  >
                    <span className="text-white text-[13px] sm:text-[15px] font-bold">
                      {p.initials}
                    </span>
                  </motion.div>
                </Print>

                <Print delay={0.26} y={8}>
                  <div className="text-center text-[10px] sm:text-[11px] font-bold tracking-tight">
                    {p.name}
                  </div>
                </Print>
                <Print delay={0.33}>
                  <div className="text-center text-[7px] sm:text-[7.5px] text-white/70">
                    {p.role}
                  </div>
                </Print>

                <Print delay={0.42}>
                  <div className="border-t border-white/15 my-1" />
                </Print>
                <Print delay={0.48}>
                  <div className="text-[6.5px] font-bold tracking-[0.16em] text-white/50">
                    CONTACT
                  </div>
                </Print>
                {p.contact.map((row, i) => (
                  <Print key={row.icon} delay={0.53 + i * 0.05}>
                    <div className="flex items-center gap-1 text-[6.5px] sm:text-[7px] text-white/70 leading-tight">
                      <MaterialIcon
                        name={row.icon}
                        className="text-[9px] text-secondary-container"
                      />
                      <span className="truncate">{row.text}</span>
                    </div>
                  </Print>
                ))}

                <Print delay={0.72}>
                  <div className="border-t border-white/15 my-1" />
                </Print>
                <Print delay={0.78}>
                  <div className="text-[6.5px] font-bold tracking-[0.16em] text-white/50">
                    SKILLS
                  </div>
                </Print>
                <div className="flex flex-wrap gap-1">
                  {p.skills.map((s, i) => (
                    <Print key={s} delay={0.83 + i * 0.05}>
                      <span className="inline-block px-1.5 py-[2px] rounded-sm bg-white/10 border border-white/10 text-[6.5px] sm:text-[7px] text-white/85">
                        {s}
                      </span>
                    </Print>
                  ))}
                </div>
              </div>

              {/* ================= RIGHT MAIN — white ================= */}
              <div className="flex-1 p-3.5 sm:p-4 space-y-2 relative overflow-hidden">
                {/* EXPERIENCE */}
                <Print delay={0.35}>
                  <div className="text-[7.5px] font-bold tracking-[0.16em] text-primary border-b border-primary/15 pb-1">
                    EXPERIENCE
                  </div>
                </Print>

                {p.jobs.map((job, j) => (
                  <div key={job.title} className="space-y-1">
                    <Print delay={0.42 + j * 0.28}>
                      <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-on-surface leading-tight">
                        {job.title}
                      </div>
                    </Print>
                    <Print delay={0.47 + j * 0.28}>
                      <div className="text-[6.5px] sm:text-[7px] text-on-surface-variant">
                        {job.meta}
                      </div>
                    </Print>
                    <div className="space-y-[3px] pt-[2px]">
                      {job.bullets.map((b, i) => (
                        <Print key={b} delay={0.52 + j * 0.28 + i * 0.07}>
                          <div className="flex items-start gap-1">
                            <span className="mt-[2px] w-[3px] h-[3px] rounded-full bg-primary shrink-0" />
                            <span className="text-[6.5px] sm:text-[7.5px] text-on-surface-variant leading-snug">
                              {b}
                            </span>
                          </div>
                        </Print>
                      ))}
                    </div>
                  </div>
                ))}

                {/* EDUCATION */}
                <Print delay={0.95}>
                  <div className="text-[7.5px] font-bold tracking-[0.16em] text-primary border-b border-primary/15 pb-1 pt-1">
                    EDUCATION
                  </div>
                </Print>
                <Print delay={1.02}>
                  <div className="text-[8.5px] font-semibold text-on-surface leading-tight">
                    {p.edu[0]}
                  </div>
                </Print>
                <Print delay={1.07}>
                  <div className="text-[6.5px] text-on-surface-variant">
                    {p.edu[1]}
                  </div>
                </Print>

                {/* Blinking caret while "writing" */}
                {!reduced && (
                  <motion.div
                    className="absolute bottom-3 right-4 h-2.5 w-[4px] rounded-sm bg-secondary"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0],
                    }}
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

      {/* ============ ATS SCORE BADGE — snaps on after first print ============ */}
      {!reduced && (
        <motion.div
          className="absolute -top-3 -right-2 z-20 rounded-full bg-white/95 border border-outline-variant shadow-lg px-2.5 py-1.5"
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
            <MaterialIcon
              name="verified"
              className="text-[13px] text-secondary"
              filled
            />
            <span className="text-[9px] font-bold">ATS 94/100</span>
          </motion.div>
        </motion.div>
      )}

      {/* ============ DECORATIVE GLOW ============ */}
      <motion.div
        className="absolute -top-10 -right-10 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl -z-10"
        animate={reduced ? undefined : { y: [0, 14, 0], x: [0, -10, 0] }}
        transition={
          reduced ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -z-10"
        animate={reduced ? undefined : { y: [0, -14, 0], x: [0, 10, 0] }}
        transition={
          reduced ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut" }
        }
      />
    </>
  );
}
