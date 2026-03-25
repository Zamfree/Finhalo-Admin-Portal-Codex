export function DashboardSectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-400">{description}</p>
    </div>
  );
}
