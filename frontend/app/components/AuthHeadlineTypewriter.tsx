"use client";

import { cn } from "@/lib/utils";
import { TypewriterText } from "./TypewriterText";

interface AuthHeadlineTypewriterProps {
  className?: string;
}

export function AuthHeadlineTypewriter({ className }: AuthHeadlineTypewriterProps) {
  return (
    <h1 className={cn("text-5xl lg:text-[56px] font-extrabold text-primary leading-[1.1] mb-6 min-h-[140px]", className)}>
      Accelerate Your <br />
      <span className="text-secondary">
        <TypewriterText 
          words={["Career Journey with AI.", "Resume Building Speed.", "Interview Success Rate."]} 
          delayBeforeDelete={3000}
        />
      </span>
    </h1>
  );
}
