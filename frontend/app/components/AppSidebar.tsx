"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MaterialIcon from "./MaterialIcon";
import { clearSession, getStoredUser } from "@/lib/api";

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
 * Fixed left sidebar — matches the main_dashboard_desktop / my_resumes
 * stitch frames. Renders the authenticated user at the bottom.
 */
export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

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

  return (
    <aside className="bg-surface-container-low dark:bg-surface-container-lowest h-screen w-64 fixed left-0 top-0 border-r border-outline-variant dark:border-outline flex flex-col z-50">
      <div className="px-6 py-8">
        <h1 className="text-headline-md font-bold text-primary">MakeMyCV</h1>
        <p className="text-label-md text-on-surface-variant">
          Professional Plan
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = Boolean(
            item.href && pathname?.startsWith(item.href)
          );
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
                className="flex items-center gap-3 px-4 py-3 text-on-surface-variant/60 cursor-not-allowed"
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
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                active
                  ? "text-primary font-bold border-r-4 border-primary bg-surface-container-high"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto flex items-center gap-3 border-t border-outline-variant">
        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shrink-0">
          {initials}
        </div>
        <div className="overflow-hidden flex-1">
          <p className="text-label-md truncate">
            {user?.full_name ?? "User"}
          </p>
          <button
            className="text-xs text-primary hover:underline cursor-pointer"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </aside>
  );
}
