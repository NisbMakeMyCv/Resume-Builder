import type { ReactNode } from "react";

/**
 * Max-width container — 1280px with 32px page margins (container-max / margin tokens).
 */
export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-8 ${className}`}>
      {children}
    </div>
  );
}
