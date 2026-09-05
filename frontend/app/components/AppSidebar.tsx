"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useCallback, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";
import MaterialIcon from "./MaterialIcon";
import { clearSession, getStoredUser } from "@/lib/api";
import { useSidebar } from "./SidebarContext";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const SIDEBAR_MIN = 256; // 16rem — current optimal width
const SIDEBAR_MAX = 420; // 26.25rem — comfortable maximum

type SidebarItem = {
  label: string;
  icon: string;
  href?: string;
  /** Items with no backend support yet are rendered non-functional. */
  disabled?: boolean;
};

const NAV_ITEMS: SidebarItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Master Profile", icon: "person_book", href: "/profile" },
  { label: "My Resumes", icon: "description", href: "/resumes" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

/** Shared link treatment — larger text, soft rounded hover states. */
const LINK_BASE =
  "flex items-center gap-3 px-4 py-2 rounded-lg text-lg font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all duration-200 ease-in-out";
const LINK_ACTIVE = "text-primary bg-surface-container-high font-semibold";

/**
 * Responsive sidebar. On desktop it is a fixed left rail that the user can
 * drag-resize between SIDEBAR_MIN and SIDEBAR_MAX; on mobile it collapses
 * into an overlay drawer controlled by the menu toggle.
 */
export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const { theme, setTheme, resolved } = useTheme();
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(SIDEBAR_MIN);
  const [imgError, setImgError] = useState(false);
  const draggingRef = useRef(false);

  // B11 FIX: Load user after mount to avoid SSR hydration mismatch
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Sync the CSS variable so dashboard/resumes content offsets follow.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${width}px`
    );
  }, [width]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const startX = e.clientX;
    const startWidth = width;

    function handleMove(ev: PointerEvent) {
      if (!draggingRef.current) return;
      const next = Math.min(
        SIDEBAR_MAX,
        Math.max(SIDEBAR_MIN, startWidth + (ev.clientX - startX))
      );
      setWidth(next);
    }

    function handleUp() {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  const initial = (user?.full_name ?? "U").trim().charAt(0).toUpperCase();

  /** Render a real avatar only when profile_picture is a usable URL. */
  const avatarSrc = (user?.profile_picture ?? "").trim();
  const showAvatar = /^(https?:)?\/\//i.test(avatarSrc);

  const sidebarBody = (
    <div className="flex flex-col h-full" style={{ width }}>
      <div className="px-6 pt-8 pb-6">
        <Logo />
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = Boolean(item.href && pathname?.startsWith(item.href));
          const content = (
            <>
              <MaterialIcon
                name={item.icon}
                className={active ? "text-primary" : "text-on-surface-variant"}
                filled={active}
              />
              <span className="truncate">{item.label}</span>
            </>
          );

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className={`${LINK_BASE} opacity-50 cursor-not-allowed`}
                title="Coming soon"
              >
                {content}
                <span className="ml-auto text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              onClick={() => setOpen(false)}
              className={`${LINK_BASE} ${active ? LINK_ACTIVE : ""}`}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* U24 FIX: Dark mode toggle at bottom of sidebar */}
      <div className="px-4 py-2 border-t border-outline-variant">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MaterialIcon
              name={resolved === "dark" ? "dark_mode" : "light_mode"}
              className="text-on-surface-variant"
            />
            <span className="text-label-md font-medium text-on-surface">
              {resolved === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              resolved === "dark"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
            aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <MaterialIcon
              name={resolved === "dark" ? "light_mode" : "dark_mode"}
              className="text-[20px]"
            />
          </button>
        </div>
      </div>

      <button
        className="px-4 py-3 flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-high cursor-pointer transition-colors w-full text-left"
        onClick={handleLogout}
      >
        <MaterialIcon name="logout" />
        <span className="text-label-md">Log Out</span>
      </button>

      <Link
        href="/profile"
        className="p-6 mt-auto flex items-center gap-3 border-t border-outline-variant hover:bg-surface-container-high cursor-pointer transition-colors"
        onClick={() => setOpen(false)}
      >
        {showAvatar && !imgError ? (
          <img
            src={avatarSrc}
            alt={user?.full_name ?? "User"}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary-fixed"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shrink-0">
            {initial}
          </div>
        )}
        <div className="overflow-hidden flex-1 flex flex-col">
          <p className="text-label-md truncate">
            {user?.full_name ?? "User"}
          </p>
          <p className="text-xs text-primary hover:underline cursor-pointer mt-1">
            View Profile
          </p>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop rail — always visible on lg+, drag-resizable */}
      <aside
        className="hidden lg:flex bg-surface-container-lowest h-screen fixed left-0 top-0 border-r border-outline-variant flex-col z-50"
        style={{ width }}
      >
        {sidebarBody}

        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize group z-10"
          onPointerDown={handlePointerDown}
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 right-0 w-[3px] bg-transparent group-hover:bg-secondary/40 transition-colors" />
        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden bg-surface-container-lowest w-64 fixed left-0 top-0 h-screen z-50 border-r border-outline-variant flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-3 z-10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-on-surface-variant hover:text-on-surface p-1"
            aria-label="Close menu"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
        {sidebarBody}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 px-4 flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant z-40">
        <span className="text-label-md font-bold text-primary">NISB-MakeMyCV</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-on-surface-variant hover:text-on-surface p-1"
          aria-label="Open menu"
        >
          <MaterialIcon name="menu" />
        </button>
      </header>
    </>
  );
}
