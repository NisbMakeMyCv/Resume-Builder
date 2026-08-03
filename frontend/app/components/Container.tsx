import type { ReactNode } from "react";

/**
 * Full-width container — spans the viewport with 32px page margins so the
 * landing content reaches the screen edges on wide laptop displays.
 */
export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full px-8 ${className}`}>
      {children}
    </div>
  );
}
