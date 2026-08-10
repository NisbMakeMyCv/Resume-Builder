"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";

/**
 * NISB-MakeMyCV brand lockup. Always navigates to the homepage unless the
 * user is already signed in, in which case it returns to the dashboard.
 *
 * Uses a client-side redirect so the link target picks the right route at
 * click-time (a plain `<a href>` can only have one target).
 */
export default function Logo({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    router.push(getToken() ? "/dashboard" : "/");
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      className={`inline-flex items-center gap-2.5 group shrink-0 ${className}`}
      aria-label="NISB-MakeMyCV home"
    >
      {/* NISB logo mark */}
      <span className="relative w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow ring-1 ring-outline-variant">
        <Image
          src="/nisb-logo.png"
          alt="NISB logo"
          width={36}
          height={36}
          className="w-full h-full object-contain"
          priority
        />
      </span>

      {/* Wordmark */}
      <span className="text-headline-md font-bold tracking-tight text-primary leading-none">
        NISB-MakeMyCV
      </span>
    </Link>
  );
}