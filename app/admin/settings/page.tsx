import { DataPanel } from "@/components/system/data/data-panel";

const SETTINGS = [
  { label: "Platform timezone", value: "UTC" },
  { label: "Default currency", value: "USD" },
  { label: "Admin alerts", value: "Enabled" },
];

export default async function SettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      <DataPanel
        title={
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              System
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Settings
            </h1>
          </div>
        }
        description={
          <p className="text-sm text-zinc-400">
            Preview-mode system settings panel.
          </p>
        }
      >
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
