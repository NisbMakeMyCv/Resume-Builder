"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getStoredUser } from "../../lib/api";

/**
 * Client-side guard for authenticated pages. While there is no token
 * it renders nothing and redirects to /signin.
 */
export default function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      setReady(true);
    } else {
      router.replace("/signin");
    }
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
