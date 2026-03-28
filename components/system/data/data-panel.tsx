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
      <div
        className="admin-surface-soft flex min-h-36 items-center justify-center rounded-2xl p-6 text-sm text-zinc-500"
        role="status"
        aria-live="polite"
      >
        {loadingMessage ?? "Loading..."}
      </div>
    );
  } else if (error) {
    content = (
      <div
        className="admin-surface-soft flex min-h-36 flex-col items-center justify-center rounded-2xl p-6 text-center"
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-white">
          {errorTitle ?? "Something went wrong"}
        </p>
        <p className="mt-2 max-w-md break-words text-sm text-zinc-400">{error}</p>
      </div>
    );
  } else if (isEmpty) {
    content = (
      <div
        className="admin-surface-soft flex min-h-[240px] flex-col items-center justify-center rounded-2xl p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-zinc-200">
          {emptyTitle ?? "No data found"}
        </p>
        {emptyDescription ? (
          <p className="mt-2 max-w-md break-words text-sm text-zinc-500">{emptyDescription}</p>
        ) : null}
      </div>
    );
  }

  return (
    <section className={`admin-surface space-y-4 p-5 md:space-y-5 md:p-6 ${className}`}>
      {hasHeader ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl space-y-1.5">
            {title ? <div>{title}</div> : null}
            {description ? (
              <div className="text-[13px] leading-6 text-zinc-500 [&_p]:text-[13px] [&_p]:leading-6 [&_p]:text-zinc-500">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? <div className="shrink-0 md:pt-0.5">{actions}</div> : null}
        </div>
      ) : null}

      {filters ? <div>{filters}</div> : null}
      {tabs ? <div>{tabs}</div> : null}
      {summary ? <div>{summary}</div> : null}

      {content}

      {footer ? <div className="pt-2 text-xs text-zinc-400">{footer}</div> : null}
    </section>
  );
}
