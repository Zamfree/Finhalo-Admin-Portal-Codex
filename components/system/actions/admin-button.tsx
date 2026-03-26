import type { ReactNode } from "react";

type AdminButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type AdminButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: AdminButtonVariant;
  disabled?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
};

export function AdminButton({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  disabled = false,
  className = "",
  title,
  ariaLabel,
}: AdminButtonProps) {
  const base =
    "admin-button admin-interactive inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30";

  const variants: Record<AdminButtonVariant, string> = {
    primary: "admin-button-primary",
    secondary: "admin-button-secondary",
    ghost: "admin-button-ghost",
    destructive: "admin-button-destructive",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`${base} ${variants[variant]} ${disabled ? "cursor-not-allowed opacity-40" : ""
        } ${className}`}
    >
      {children}
    </button>
  );
}
