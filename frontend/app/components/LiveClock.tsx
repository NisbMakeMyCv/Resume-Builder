"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function LiveClock({ className }: { className?: string }) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Initial render
    const updateClock = () => {
      const now = new Date();
      // 24-hour format: HH:mm:ss
      const formatted = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTime(formatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <div className={cn("w-20 h-6 skeleton rounded-md", className)} />;
  }

  return (
    <div
      className={cn(
        "font-mono text-sm font-semibold tabular-nums tracking-wider text-on-surface-variant flex items-center gap-1.5",
        className
      )}
    >
      <span className="material-symbols-outlined text-[16px] text-primary">
        schedule
      </span>
      {time}
    </div>
  );
}
