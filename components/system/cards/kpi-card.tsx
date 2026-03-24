type KpiCardProps = {
  title?: string;
  label?: string;
  value: string;
  change?: string;
};

export function KpiCard({ title, label, value, change }: KpiCardProps) {
  const resolvedTitle = title ?? label ?? "";

  return (
    <article className="admin-surface-soft p-5 transition-colors duration-150">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {resolvedTitle}
      </div>

      <div className="text-2xl font-semibold tabular-nums text-white md:text-[1.75rem]">
        {value}
      </div>

      {change ? (
        <div className="mt-2 text-sm text-emerald-400/90">
          {change} this week
        </div>
      ) : null}
    </article>
  );
}
