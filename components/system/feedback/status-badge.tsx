import type { ReactNode } from "react";

type StatusBadgeProps = {
  children: ReactNode;
  toneClassName: string;
  size?: "compact" | "default";
  className?: string;
};

export function StatusBadge({
  children,
  toneClassName,
  size = "compact",
  className = "",
}: StatusBadgeProps) {
  const sizeClassName =
    size === "default"
      ? "px-2.5 py-1 text-[11px]"
      : "px-2 py-1 text-[10px]";

  return (
    <span
      className={`inline-flex rounded-full font-medium uppercase tracking-[0.06em] ${sizeClassName} ${toneClassName} ${className}`}
    >
      {children}
    </span>
  );
}
