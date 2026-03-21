import type { ReactNode } from "react";

type DataPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  tabs?: ReactNode;
  summary?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
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
}: DataPanelProps) {
  const hasHeader = title || description || actions;

  return (
    <section
      className={`admin-surface space-y-5 p-6 ${className}`}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            {title ? <div>{title}</div> : null}
            {description ? <div>{description}</div> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      {filters ? <div>{filters}</div> : null}
      {tabs ? <div>{tabs}</div> : null}
      {summary ? <div>{summary}</div> : null}

      {children}

      {footer ? <div className="pt-2 text-xs text-zinc-400">{footer}</div> : null}
    </section>
  );
}
