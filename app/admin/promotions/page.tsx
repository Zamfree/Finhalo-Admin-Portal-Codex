import { DataPanel } from "@/components/system/data/data-panel";

const PROMOTIONS = [
  { name: "Welcome Cashback", status: "Draft" },
  { name: "March Volume Bonus", status: "Active" },
  { name: "IB Referral Sprint", status: "Scheduled" },
];

export default async function PromotionsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Promotions
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Promotions<span className="ml-1.5 inline-block text-rose-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Preview-mode promotions center with static campaign cards.
        </p>
      </div>

      <DataPanel>
        <div className="grid gap-4 md:grid-cols-3">
          {PROMOTIONS.map((promotion) => (
            <article
              key={promotion.name}
              className="admin-surface-soft p-5 text-sm"
            >
              <p className="text-base font-semibold text-white">{promotion.name}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                Status
              </p>
              <p className="mt-2 text-sm text-zinc-300">{promotion.status}</p>
            </article>
          ))}
        </div>
      </DataPanel>
    </div>
  );
}
