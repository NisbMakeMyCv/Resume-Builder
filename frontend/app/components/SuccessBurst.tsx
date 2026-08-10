"use client";

import { useEffect, useState } from "react";
import MaterialIcon from "./MaterialIcon";

/**
 * Full-screen celebratory burst shown right before navigating away
 * after a successful login / registration. Pure visual polish.
 */
export default function SuccessBurst({ message }: { message: string }) {
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShown(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (!shown) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/85 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <span className="ring-burst" />
          <span className="ring-burst delay-1" />
          <span className="ring-burst delay-2" />
          <div className="relative w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl">
            <MaterialIcon
              name="check_circle"
              className="check-pop text-[52px]"
              filled
            />
          </div>
        </div>
        <p className="text-headline-md text-primary font-bold check-pop">
          {message}
        </p>
      </div>
    </div>
  );
}
