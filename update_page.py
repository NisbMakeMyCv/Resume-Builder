import re

with open("frontend/app/page.tsx", "r") as f:
    content = f.read()

# Add imports
if 'getStoredUser' not in content:
    content = content.replace(
        'import { cn } from "@/lib/utils";',
        'import { cn } from "@/lib/utils";\nimport { getStoredUser, CurrentUser } from "@/lib/api";\nimport { useTheme } from "@/app/providers/ThemeProvider";\nimport { useEffect } from "react";'
    )

# Add hooks
content = content.replace(
    '  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);',
    '  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);\n  const [user, setUser] = useState<CurrentUser | null>(null);\n  const { theme, setTheme } = useTheme();\n\n  useEffect(() => {\n    setUser(getStoredUser());\n  }, []);'
)

# Update Desktop nav
desktop_nav_old = """          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-outline-variant pr-4">
              <LiveClock />
            </div>
            <Link
              href="/signin"
              className="btn-outline hidden sm:inline-flex text-label-md font-semibold px-4 py-2 rounded-full"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="btn-primary btn-shine btn-magnetic inline-flex text-label-md font-semibold px-6 py-2.5 rounded-full"
            >
              Sign Up
            </Link>
          </div>"""

desktop_nav_new = """          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-outline-variant pr-4">
              <LiveClock />
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Toggle dark mode"
            >
              <MaterialIcon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-[24px]" />
            </button>

            {user ? (
              <Link href="/resumes" className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-2">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-fixed" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="btn-outline hidden sm:inline-flex text-label-md font-semibold px-4 py-2 rounded-full"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary btn-shine btn-magnetic inline-flex text-label-md font-semibold px-6 py-2.5 rounded-full"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>"""
content = content.replace(desktop_nav_old, desktop_nav_new)

# Update Mobile nav
mobile_nav_old = """          {/* Mobile: hamburger */}
          <div className="flex sm:hidden items-center gap-1">
            <button"""

mobile_nav_new = """          {/* Mobile: hamburger */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
              aria-label="Toggle dark mode"
            >
              <MaterialIcon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-[24px] text-on-surface-variant" />
            </button>
            <button"""
content = content.replace(mobile_nav_old, mobile_nav_new)

# Update Mobile slide-down menu
mobile_menu_old = """        {/* Mobile slide-down menu */}
        <div
          className={cn(
            "sm:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-40 border-t border-outline-variant" : "max-h-0"
          )}
        >
          <div className="flex flex-col px-4 py-3 gap-2 bg-surface-container-lowest">
            <Link
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-label-md font-semibold text-primary px-4 py-3 rounded-xl hover:bg-surface-container transition-colors text-center"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-primary text-on-primary px-4 py-3 rounded-xl text-label-md font-semibold text-center hover:bg-primary/90 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>"""

mobile_menu_new = """        {/* Mobile slide-down menu */}
        <div
          className={cn(
            "sm:hidden overflow-hidden transition-all duration-300",
            mobileMenuOpen ? "max-h-40 border-t border-outline-variant" : "max-h-0"
          )}
        >
          <div className="flex flex-col px-4 py-3 gap-2 bg-surface-container-lowest">
            {user ? (
              <Link
                href="/resumes"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-primary text-on-primary px-4 py-3 rounded-xl text-label-md font-semibold text-center hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Go to My Resumes
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-label-md font-semibold text-primary px-4 py-3 rounded-xl hover:bg-surface-container transition-colors text-center"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-primary text-on-primary px-4 py-3 rounded-xl text-label-md font-semibold text-center hover:bg-primary/90 transition-colors"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>"""
content = content.replace(mobile_menu_old, mobile_menu_new)

with open("frontend/app/page.tsx", "w") as f:
    f.write(content)

