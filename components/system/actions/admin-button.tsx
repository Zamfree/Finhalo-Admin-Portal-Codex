type AdminButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type AdminButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: AdminButtonVariant;
  disabled?: boolean;
  className?: string;
};

export function AdminButton({
  children,
  onClick,
  type = "button",
  variant = "secondary",
  disabled = false,
  className = "",
}: AdminButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition";

  const variants: Record<AdminButtonVariant, string> = {
    primary: "bg-white/10 text-white hover:bg-white/15",
    secondary: "bg-white/6 text-zinc-300 hover:bg-white/10",
    ghost: "text-zinc-400 hover:text-white",
    destructive: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${
        disabled ? "cursor-not-allowed opacity-40" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}