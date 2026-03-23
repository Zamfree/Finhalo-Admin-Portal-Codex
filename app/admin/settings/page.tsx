import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

const SETTINGS_SECTIONS = [
  {
    key: "general",
    items: [
      ["platformTimezone", "UTC"],
      ["defaultCurrency", "USD"],
      ["adminLocaleFallback", "English"],
    ],
  },
  {
    key: "commissionRules",
    items: [
      ["adminFeeFloor", "10% minimum"],
      ["l2Priority", "Calculated before trader and L1 split"],
      ["batchApprovalMode", "Manual review required"],
    ],
  },
  {
    key: "ibConfiguration",
    items: [
      ["maxReferralDepth", "2 levels"],
      ["traderModel", "Account-level only"],
      ["snapshotBehavior", "Future-only relationship updates"],
    ],
  },
  {
    key: "dataImport",
    items: [
      ["commissionFormats", "CSV, XLSX"],
      ["columnMapping", "Required before import"],
      ["validationMode", "Preview before batch creation"],
    ],
  },
  {
    key: "financeSettings",
    items: [
      ["ledgerPosting", "Derived from approved downstream records"],
      ["withdrawalReview", "Manual approval queue"],
      ["reconciliationWindow", "Daily operational review"],
    ],
  },
  {
    key: "notifications",
    items: [
      ["adminAlerts", "Enabled"],
      ["batchReviewNotices", "Enabled"],
      ["financeExceptionNotices", "Enabled"],
    ],
  },
  {
    key: "security",
    items: [
      ["adminSessions", "Managed by platform auth"],
      ["auditVisibility", "Enabled"],
      ["sensitiveActions", "Protected by review workflow"],
    ],
  },
] as const;

export default async function SettingsPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.settings;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Settings
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-zinc-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.description}</p>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.sectionsTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.sectionsDescription}</p>}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="grid gap-6">
            {SETTINGS_SECTIONS.slice(0, 5).map((section) => (
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
            {SETTINGS_SECTIONS.slice(5).map((section) => (
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
          </div>
        </div>
      </DataPanel>
    </div>
  );
}
