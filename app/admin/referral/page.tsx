import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

const REFERRAL_PROGRAMS = [
  { name: "Welcome Cashback", status: "Draft" },
  { name: "March Volume Bonus", status: "Active" },
  { name: "IB Referral Sprint", status: "Scheduled" },
];

export default async function ReferralPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.referral;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Referral
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-rose-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          {t.description}
        </p>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.listTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.listDescription}</p>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {REFERRAL_PROGRAMS.map((program) => (
            <article
              key={program.name}
              className="admin-surface-soft p-5 text-sm"
            >
              <p className="text-base font-semibold text-white">{program.name}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                {t.status}
              </p>
              <p className="mt-2 text-sm text-zinc-300">{program.status}</p>
            </article>
          ))}
        </div>
      </DataPanel>
    </div>
  );
}
