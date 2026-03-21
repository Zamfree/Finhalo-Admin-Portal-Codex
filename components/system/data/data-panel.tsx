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
      className={`admin-surface space-y-6 p-5 md:p-6 ${className}`}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            {title ? <div>{title}</div> : null}
            {description ? <div>{description}</div> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      {filters ? <div className="pt-1">{filters}</div> : null}
      {tabs ? <div className="pt-1">{tabs}</div> : null}
      {summary ? <div className="pt-2">{summary}</div> : null}

      {children}

      {footer ? <div className="pt-3 text-xs text-zinc-400">{footer}</div> : null}
    </section>
  );
}
