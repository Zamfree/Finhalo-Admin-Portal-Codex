import type { FormEvent, ReactNode } from "react";
import { AdminButton } from "@/components/system/actions/admin-button";

type FilterBarProps = {
  search?: ReactNode;
  filters?: ReactNode;
  onApply?: (event: FormEvent<HTMLFormElement>) => void;
  onReset?: () => void;
  applyLabel?: string;
  resetLabel?: string;
  className?: string;
};

export function FilterBar({
  search,
  filters,
  onApply,
  onReset,
  applyLabel = "Apply",
  resetLabel = "Reset",
  className = "",
}: FilterBarProps) {
  const hasActions = Boolean(onApply || onReset);

  return (
    <form
      onSubmit={onApply}
      className={`flex flex-col gap-4 md:gap-5 xl:flex-row xl:items-end xl:justify-between ${className}`}
    >
      {search ? <div className="min-w-0 flex-1 xl:max-w-sm">{search}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        {filters ? <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">{filters}</div> : null}

        {hasActions ? (
          <div className="flex items-end gap-2">
            {onReset ? (
              <AdminButton
                type="button"
                onClick={onReset}
                variant="ghost"
                className="h-11 shrink-0 px-5 text-sm font-medium normal-case tracking-normal text-zinc-400"
              >
                {resetLabel}
              </AdminButton>
            ) : null}

            {onApply ? (
              <AdminButton
                type="submit"
                variant="secondary"
                className="h-11 shrink-0 px-5 text-sm font-medium normal-case tracking-normal text-zinc-200"
              >
                {applyLabel}
              </AdminButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
