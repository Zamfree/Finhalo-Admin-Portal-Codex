import { DataPanel } from "@/components/system/data/data-panel";

const SETTINGS = [
  { label: "Platform timezone", value: "UTC" },
  { label: "Default currency", value: "USD" },
  { label: "Admin alerts", value: "Enabled" },
];

export default async function SettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Settings
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Settings<span className="ml-1.5 inline-block text-zinc-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Preview-mode system settings panel.
        </p>
      </div>

      <DataPanel>
        <div className="grid gap-4 md:grid-cols-3">
          {SETTINGS.map((item) => (
            <div
              key={item.label}
              className="admin-surface-soft p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {item.label}
              </p>
              <p className="mt-3 text-xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </DataPanel>
    </div>
  );
}
