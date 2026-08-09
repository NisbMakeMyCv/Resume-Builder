"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    id: 1,
    quote: "MakeMyCV's AI bullet optimizer transformed my resume. I landed my dream Software Engineer role in just weeks!",
    name: "Sarah J.",
    role: "Software Engineer @ Tech Corp",
    initials: "SJ",
    colors: "from-primary to-secondary",
  },
  {
    id: 2,
    quote: "The ATS matching feature is a game-changer. I finally stopped getting auto-rejected and started getting interviews.",
    name: "David M.",
    role: "Product Manager",
    initials: "DM",
    colors: "from-emerald-600 to-teal-500",
  },
  {
    id: 3,
    quote: "Beautiful templates and incredibly fast generation. This is exactly what the resume industry needed.",
    name: "Emily R.",
    role: "UX Designer",
    initials: "ER",
    colors: "from-purple-600 to-indigo-500",
  },
  {
    id: 4,
    quote: "I love how it tailored my bullet points for my target job. Saved me hours of overthinking and rewriting.",
    name: "Michael T.",
    role: "Data Analyst",
    initials: "MT",
    colors: "from-orange-500 to-red-500",
  },
  {
    id: 5,
    quote: "Clean, professional, and recruiter-approved. The PDF exports are pixel-perfect every single time.",
    name: "Jessica W.",
    role: "Marketing Director",
    initials: "JW",
    colors: "from-blue-500 to-indigo-600",
  }
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4500); // Change every 4.5 seconds
    return () => clearInterval(timer);
  }, []);

  const getPosition = (index: number) => {
    const length = testimonials.length;
    let pos = index - currentIndex;
    
    // Normalize to handle wrapping
    if (pos < -Math.floor(length / 2)) pos += length;
    if (pos > Math.floor(length / 2)) pos -= length;
    
    return pos;
  };

  return (
    <div className="relative mt-8 w-full max-w-lg h-[320px] flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="popLayout">
        {testimonials.map((testimonial, index) => {
          const position = getPosition(index);
          const isCenter = position === 0;

          // Only render center, left (-1), and right (1). Others are hidden to save DOM/animation perf.
          if (Math.abs(position) > 1) return null;

          return (
            <motion.div
              key={testimonial.id}
              initial={false}
              animate={{
                x: position * 45 + "%",
                scale: isCenter ? 1 : 0.85,
                opacity: isCenter ? 1 : 0.4,
                zIndex: isCenter ? 30 : 20,
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute bg-white/40 dark:bg-surface-container/40 backdrop-blur-3xl border border-white/80 dark:border-white/10 p-8 rounded-[32px] shadow-[0_30px_60px_rgba(0,42,88,0.08)] w-full max-w-md",
                isCenter ? "animate-float-slow" : ""
              )}
            >
              <div className="flex gap-1 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-2xl leading-none">★</span>
                ))}
              </div>
              <p className="text-lg font-medium text-on-surface mb-6 leading-relaxed italic line-clamp-3">
                &quot;{testimonial.quote}&quot;
              </p>
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full text-white flex items-center justify-center font-black text-lg shadow-inner bg-gradient-to-br", testimonial.colors)}>
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-bold text-on-surface text-sm">{testimonial.name}</div>
                  <div className="text-xs font-bold text-secondary tracking-wide uppercase mt-0.5">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
