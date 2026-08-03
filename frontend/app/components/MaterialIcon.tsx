"use client";

type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

/**
 * Material Symbols Outlined icon wrapper.
 * Matches the icon usage in the stitch frames:
 *   <span class="material-symbols-outlined text-primary">dashboard</span>
 */
export default function MaterialIcon({
  name,
  className = "",
  filled = false,
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
          : undefined
      }
    >
      {name}
    </span>
  );
}
