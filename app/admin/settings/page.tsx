import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminSettingsWorkspace } from "@/services/admin/settings.service";

import { SettingsOperationActions } from "./settings-operation-actions";

export default async function SettingsPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.settings;
  const workspace = await getAdminSettingsWorkspace();

  return (
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Settings"
        title={t.title}
        description={t.description}
        accentClassName="bg-zinc-400"
      />

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.sectionsTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.sectionsDescription}</p>}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="grid gap-6">
            {workspace.sections.slice(0, 5).map((section) => (
              <DataPanel
                key={section.key}
                title={
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {t[section.key as keyof typeof t] as string}
                  </h3>
                }
              >
                <dl className="grid gap-4 md:grid-cols-3">
                  {section.items.map(([labelKey, value]) => (
                    <div
                      key={labelKey}
                      className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm"
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.fields[labelKey as keyof typeof t.fields]}
                      </dt>
                      <dd className="mt-2 text-zinc-200">{value}</dd>
                    </div>
                  ))}
                </dl>
              </DataPanel>
            ))}
          </div>

          <div className="grid gap-6">
            {workspace.sections.slice(5).map((section) => (
              <DataPanel
                key={section.key}
                title={
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {t[section.key as keyof typeof t] as string}
                  </h3>
                }
              >
                <dl className="space-y-4">
                  {section.items.map(([labelKey, value]) => (
                    <div key={labelKey} className="space-y-2 text-sm">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t.fields[labelKey as keyof typeof t.fields]}
                      </dt>
                      <dd className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-zinc-200">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </DataPanel>
            ))}

            <DataPanel
              title={
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Operational Actions
                </h3>
              }
              description={
                <p className="text-sm text-zinc-400">
                  Run guarded admin actions from here when downstream rebate or commission workflows
                  need controlled replay or reprocessing.
                </p>
              }
            >
              <SettingsOperationActions operations={workspace.operations} />
            </DataPanel>

            <DataPanel
              title={
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Admin Audit Trail
                </h3>
              }
              description={
                <p className="text-sm text-zinc-400">
                  Lightweight visibility into recent settings-related admin review activity.
                </p>
              }
            >
              <div className="space-y-3">
                {workspace.auditTrail.map((item) => (
                  <div key={item.id} className="rounded-xl bg-white/[0.03] px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.action}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-1 text-zinc-400">
                      {item.actor} | {item.scope}
                    </p>
                  </div>
                ))}
              </div>
            </DataPanel>
          </div>
        </div>
      </DataPanel>
    </div>
  );
}

