import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  accentClassName?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  accentClassName = "bg-sky-400",
  actions,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0 max-w-4xl">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          {eyebrow}
        </p>
        <div className="flex items-end gap-2">
          <h1 className="break-words text-[2rem] font-semibold tracking-[-0.03em] text-white md:text-[2.5rem]">
            {title}
          </h1>
          <span
            className={`admin-accent-dot mb-2 inline-block h-2 w-2 rounded-full opacity-80 ${accentClassName}`}
          />
        </div>
        <div className="mt-4 max-w-[62ch] break-words text-sm leading-6 text-zinc-500">
          {description}
        </div>
      </div>

      {actions ? <div className="shrink-0 self-start xl:self-auto">{actions}</div> : null}
    </section>
  );
}
