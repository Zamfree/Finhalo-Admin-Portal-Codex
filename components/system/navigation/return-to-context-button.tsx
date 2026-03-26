"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import { useReturnContext } from "@/hooks/use-return-context";
import { getReturnContextSourceLabel, type ReturnContextSource } from "@/lib/return-context";

type AdminButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ReturnToContextButtonProps = {
  fallbackPath: string;
  label?: string;
  source?: ReturnContextSource | null;
  variant?: AdminButtonVariant;
  className?: string;
  replace?: boolean;
};

export function ReturnToContextButton({
  fallbackPath,
  label,
  source,
  variant = "ghost",
  className,
  replace = false,
}: ReturnToContextButtonProps) {
  const { goBackToContext, maybeGetSource } = useReturnContext({ source });
  const sourceLabel = getReturnContextSourceLabel(maybeGetSource());
  const buttonLabel = label ?? (sourceLabel ? `Back to ${sourceLabel}` : "Back");

  return (
    <AdminButton
      variant={variant}
      className={className}
      onClick={() => goBackToContext(fallbackPath, { replace })}
    >
      {buttonLabel}
    </AdminButton>
  );
}
