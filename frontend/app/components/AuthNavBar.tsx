import Link from "next/link";
import Container from "./Container";
import Logo from "./Logo";

/**
 * Minimal centered-brand navbar used on transactional (auth) pages.
 * Matches the sign_up / otp_verification stitch frames: a fixed bar
 * with only the NISB-MakeMyCV wordmark (no nav links).
 */
export default function AuthNavBar({ showBackTo = null }: { showBackTo?: string | null }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant">
      <Container className="h-16 flex items-center justify-center md:justify-between">
        <Logo />

        {showBackTo ? (
          <Link
            href={showBackTo}
            className="hidden md:block text-label-md font-semibold text-primary px-4 py-2 rounded-full hover:bg-surface-container transition-all btn-press"
          >
            ← Back to {showBackTo === "/signin" ? "Sign In" : "Home"}
          </Link>
        ) : null}
      </Container>
    </header>
  );
}
