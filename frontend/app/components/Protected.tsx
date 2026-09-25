"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import { useTutorial } from "./TutorialContext";

const TUTORIAL_SEEN_KEY = "makemycv_tutorial_seen";
const TUTORIAL_TIMER_FLAG = "makemycv_tutorial_timer_set";

/**
 * Client-side guard for authenticated pages. While there is no token
 * it renders nothing and redirects to /signin.
 *
 * Also owns the tutorial auto-start: Protected is the first component
 * that guarantees getToken() returns a valid value, making it the
 * correct location for first-time user detection.
 */
export default function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const { startTutorial } = useTutorial();
  // Stable ref so the timeout closure always calls the latest function
  const startTutorialRef = useRef(startTutorial);
  startTutorialRef.current = startTutorial;

  useEffect(() => {
    if (!getToken()) {
      router.replace("/signin");
      return;
    }

    setReady(true);

    // ── Tutorial auto-start ─────────────────────────────────
    // Only fire once per browser session (sessionStorage clears on tab/window
    // close, so a fresh login always gets a fresh chance to see the tutorial).
    const alreadySeen = localStorage.getItem(TUTORIAL_SEEN_KEY);
    const timerAlreadySet = sessionStorage.getItem(TUTORIAL_TIMER_FLAG);

    if (!alreadySeen && !timerAlreadySet) {
      sessionStorage.setItem(TUTORIAL_TIMER_FLAG, "1");
      const timer = setTimeout(() => {
        // Double-check: user might have skipped during the delay
        if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) {
          startTutorialRef.current();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // router is stable; startTutorial accessed via ref

  if (!ready) return null;
  return <>{children}</>;
}
