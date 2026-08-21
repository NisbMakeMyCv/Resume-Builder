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
      className={`inline-flex items-center gap-2.5 group shrink-0${className ? ` ${className}` : ""}`}
      aria-label="NISB-MakeMyCV home"
    >
      {/* NISB logo mark */}
      <div className="relative shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <Image
          src="/nisb-logo.png"
          alt="NISB logo"
          width={32}
          height={32}
          className="w-8 h-8 object-contain"
          priority
        />
      </div>

      {/* Wordmark */}
      <span className="text-headline-md font-bold tracking-tight text-primary leading-none">
        NISB-MakeMyCV
      </span>
    </Link>
  );
}