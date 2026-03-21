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
      className={`flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between ${className}`}
    >
      {search ? <div className="min-w-0 flex-1">{search}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {filters ? <div className="flex flex-col gap-3 sm:flex-row sm:items-end">{filters}</div> : null}

        {hasActions ? (
          <div className="flex items-end gap-2">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className="h-11 shrink-0 rounded-xl bg-transparent px-4 text-sm text-zinc-400 transition-all duration-200 hover:bg-white/[0.05] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                {resetLabel}
              </button>
            ) : null}

            {onApply ? (
              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-white/[0.06] px-5 text-sm font-medium text-zinc-200 transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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