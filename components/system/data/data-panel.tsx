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
    <section className={`space-y-4 rounded-3xl border border-white/5 bg-[#0f0f0f] p-6 ${className}`}>
      {hasHeader ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            {title ? <div>{title}</div> : null}
            {description ? <div>{description}</div> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      ) : null}
      {filters ? <div>{filters}</div> : null}
      {tabs ? <div>{tabs}</div> : null}
      {summary ? <div>{summary}</div> : null}
      {children}
      {footer ? <div className="text-xs text-zinc-500">{footer}</div> : null}
    </section>
  );
}
