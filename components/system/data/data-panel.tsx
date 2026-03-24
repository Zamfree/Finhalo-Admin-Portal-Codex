import type { ReactNode } from "react";

type DataPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  tabs?: ReactNode;
  summary?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;

  isLoading?: boolean;
  isEmpty?: boolean;
  error?: string | null;
  loadingMessage?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  errorTitle?: ReactNode;
};

export function DataPanel({
  title,
  description,
  actions,
  filters,
  tabs,
  summary,
  footer,
  children,
  className = "",
  isLoading = false,
  isEmpty = false,
  error = null,
  loadingMessage,
  emptyTitle,
  emptyDescription,
  errorTitle,
}: DataPanelProps) {
  const hasHeader = title || description || actions;

  let content = children;

  if (isLoading) {
    content = (
      <div className="admin-surface-soft flex min-h-32 items-center justify-center rounded-xl p-6 text-sm text-zinc-500">
        {loadingMessage ?? "Loading..."}
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-medium text-white">
          {errorTitle ?? "Something went wrong"}
        </p>
        <p className="mt-2 max-w-md text-sm text-zinc-400">{error}</p>
      </div>
    );
  } else if (isEmpty) {
    content = (
      <div className="admin-surface-soft flex min-h-[240px] flex-col items-center justify-center rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-zinc-200">
          {emptyTitle ?? "No data found"}
        </p>
        {emptyDescription ? (
          <p className="mt-2 max-w-md text-sm text-zinc-500">{emptyDescription}</p>
        ) : null}
      </div>
    );
  }

  return (
    <section className={`admin-surface space-y-6 p-5 md:space-y-7 md:p-6 ${className}`}>
      {hasHeader ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl space-y-2.5">
            {title ? <div>{title}</div> : null}
            {description ? <div>{description}</div> : null}
          </div>
          {actions ? <div className="shrink-0 md:pt-1">{actions}</div> : null}
        </div>
      ) : null}

      {filters ? <div className="pt-0.5">{filters}</div> : null}
      {tabs ? <div className="pt-0.5">{tabs}</div> : null}
      {summary ? <div className="pt-1">{summary}</div> : null}

      {content}

      {footer ? <div className="pt-3 text-xs text-zinc-400">{footer}</div> : null}
    </section>
  );
}