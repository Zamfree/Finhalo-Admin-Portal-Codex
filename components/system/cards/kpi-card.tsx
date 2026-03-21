type KpiCardProps = {
  title?: string;
  label?: string;
  value: string;
  change?: string;
};

export function KpiCard({ title, label, value, change }: KpiCardProps) {
  const resolvedTitle = title ?? label ?? "";

  return (
    <article className="admin-surface relative bg-zinc-900/60 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-lg transition-all duration-300 ease-out hover:scale-[1.015] hover:border-white/20 hover:shadow-lg hover:shadow-emerald-500/10 before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/5 before:to-transparent">
      <div className="mb-2 text-xs uppercase tracking-wide text-zinc-400">
        {resolvedTitle}
      </div>

      <div className="text-2xl font-semibold tabular-nums text-white">
        {value}
      </div>

      {change ? (
        <div className="mt-2 text-sm text-emerald-400">
          {change} this week
        </div>
      ) : null}
    </article>
  );
}
