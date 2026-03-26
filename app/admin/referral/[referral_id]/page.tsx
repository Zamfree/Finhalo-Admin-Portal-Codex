import { notFound } from "next/navigation";

import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminReferralById } from "@/services/admin/referral.service";
import { getReferralOperationalPosture } from "../_mappers";

type ReferralDetailPageProps = {
  params: Promise<{ referral_id: string }>;
};

export default async function ReferralDetailPage({ params }: ReferralDetailPageProps) {
  const { referral_id } = await params;
  const referral = await getAdminReferralById(referral_id);

  if (!referral) {
    notFound();
  }

  const posture = getReferralOperationalPosture(referral);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Referral"
        title={referral.name}
        description={referral.overview}
        accentClassName="bg-rose-400"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">Overview</h2>}
          description={
            <p className="max-w-2xl text-sm text-zinc-400">
              Referral detail stays focused on program status, rules, and participation context.
            </p>
          }
        >
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Referral ID</dt>
              <dd className="mt-2 break-all font-mono text-zinc-300">{referral.referral_id}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</dt>
              <dd className="mt-2 break-words capitalize text-zinc-300">{referral.status}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Reward Model</dt>
              <dd className="mt-2 break-words text-zinc-300">{referral.reward_model}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Participants</dt>
              <dd className="mt-2 break-words text-zinc-300">{referral.participants}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Start</dt>
              <dd className="mt-2 text-zinc-300">{new Date(referral.start_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">End</dt>
              <dd className="mt-2 text-zinc-300">{new Date(referral.end_at).toLocaleString()}</dd>
            </div>
          </dl>
        </DataPanel>

        <DataPanel title={<h2 className="text-xl font-semibold text-white">Performance</h2>}>
          <p className="text-3xl font-semibold text-white">{referral.participants}</p>
          <p className="mt-2 text-sm text-zinc-400">Current participant count</p>
          <p className="mt-4 break-words text-sm text-zinc-300">{referral.performance_summary}</p>
        </DataPanel>

        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">Operational Posture</h2>}
          description={<p className="max-w-2xl text-sm text-zinc-400">{posture.nextAction}</p>}
        >
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Current Stage</dt>
              <dd className="mt-2 break-words text-zinc-300">{posture.stageLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Recommended Module</dt>
              <dd className="mt-2 break-words text-zinc-300">{posture.linkedModuleLabel}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Review Note</dt>
              <dd className="mt-2 break-words text-zinc-300">{posture.reviewNote}</dd>
            </div>
          </dl>
        </DataPanel>
      </div>

      <DataPanel title={<h2 className="text-xl font-semibold text-white">Rules</h2>}>
        <ul className="space-y-2 text-sm text-zinc-300">
          {referral.rules.map((rule) => (
            <li key={rule} className="admin-surface-soft break-words rounded-xl px-4 py-3">
              {rule}
            </li>
          ))}
        </ul>
      </DataPanel>
    </div>
  );
}
