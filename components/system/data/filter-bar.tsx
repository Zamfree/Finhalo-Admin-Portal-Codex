import type { FormEvent, ReactNode } from "react";

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
              <button
                type="button"
                onClick={onReset}
                className="admin-interactive h-11 shrink-0 rounded-xl border border-white/10 bg-transparent px-5 text-sm font-medium text-zinc-400"
              >
                {resetLabel}
              </button>
            ) : null}

            {onApply ? (
              <button
                type="submit"
                className="admin-control h-11 shrink-0 rounded-xl px-5 text-sm font-medium text-zinc-200"
              >
                {applyLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
