type KpiCardProps = {
  label: string;
  value: string;
};

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f0f] p-6 transition-all hover:bg-[#141414]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 blur-2xl transition-opacity group-hover:opacity-100" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">{value}</p>
    </article>
  );
}
