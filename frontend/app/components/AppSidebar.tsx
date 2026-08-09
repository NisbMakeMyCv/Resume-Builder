"use client";

import Link from "next/link";
import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import MaterialIcon from "./MaterialIcon";
import { clearSession, getStoredUser } from "@/lib/api";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  icon: string;
  href?: string;
  /** Items with no backend support yet are rendered non-functional. */
  disabled?: boolean;
};

const NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  {
    label: "Master Profile",
    icon: "person_book",
    disabled: true,
  },
  { label: "My Resumes", icon: "description", href: "/resumes" },
  { label: "Settings", icon: "settings", disabled: true },
];

/**
 * AppSidebar — fixed left sidebar on desktop (≥ lg), slide-over drawer on mobile.
 *
 * Desktop: always visible, 256px wide.
 * Mobile: hidden behind a backdrop; slides in when useSidebar().isOpen is true.
 *         Close by clicking the backdrop or pressing Escape.
 */
export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();
  const { isOpen, close } = useSidebar();

  // Close drawer on Escape key.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) close();
    },
    [isOpen, close]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close on route change (mobile).
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Prevent body scroll when drawer is open on mobile.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  const initials = (user?.full_name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <aside
      className={cn(
        // Base styles
        "bg-surface h-screen w-64 flex flex-col z-[500]",
        "border-r border-outline-variant/40 shadow-sm",
        // Layout
        "fixed left-0 top-0",
        // Transitions
        "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        // Visibility State (Mobile vs Desktop)
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      aria-label="Navigation sidebar"
    >
      {/* Brand */}
      <div className="px-6 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-primary">MakeMyCV</h1>
          <p className="text-label-md text-on-surface-variant">Professional Plan</p>
        </div>
        {/* Close button — mobile only */}
        <button
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          onClick={close}
          aria-label="Close navigation menu"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            close
          </span>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = Boolean(item.href && pathname?.startsWith(item.href));
          const content = (
            <>
              <MaterialIcon
                name={item.icon}
                className={active ? "text-primary" : ""}
                filled={active}
              />
              <span className="text-label-md">{item.label}</span>
            </>
          );

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-3 text-on-surface-variant/60 cursor-not-allowed rounded-xl"
                title="Coming soon"
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                active
                  ? "text-primary font-bold bg-primary/10 border-l-4 border-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* User + Theme toggle */}
      <div className="p-6 mt-auto border-t border-outline-variant space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shrink-0 text-sm">
            {initials}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-label-md truncate">{user?.full_name ?? "User"}</p>
            <button
              className="text-xs text-primary hover:underline cursor-pointer"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/40 z-[400] transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />
      {sidebarContent}
    </>
  );
}
