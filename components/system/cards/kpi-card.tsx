type KpiCardProps = {
  title?: string;
  label?: string;
  value: string;
  change?: string;
};

export function KpiCard({ title, label, value, change }: KpiCardProps) {
  const resolvedTitle = title ?? label ?? "";

  return (
    <article className="admin-surface-soft h-full p-5 transition-colors duration-150 md:p-6">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
        {resolvedTitle}
      </div>

      <div className="text-[1.75rem] font-semibold tabular-nums tracking-[-0.025em] text-white md:text-[1.9rem]">
        {value}
      </div>

      {change ? (
        <div className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-emerald-300">
          {change} this week
        </div>
      ) : null}
    </article>
  );
}
