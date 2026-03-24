"use client";

import { useMemo, useState } from "react";

import { AdminSelect } from "@/components/system/controls/admin-select";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";

import type { CampaignRecord } from "./_types";

function getStatusClass(status: CampaignRecord["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "scheduled") return "bg-blue-500/10 text-blue-300";
  return "bg-zinc-500/10 text-zinc-300";
}

export function CampaignPageClient({ rows }: { rows: CampaignRecord[] }) {
  const { t } = useAdminPreferences();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);

  const columns = useMemo<DataTableColumn<CampaignRecord>[]>(
    () => [
      {
        key: "name",
        header: t("campaign.campaignName"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="font-mono text-xs text-zinc-500">{row.campaign_id}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "type",
        header: t("campaign.type"),
        cell: (row) => (
          <span className="text-sm text-zinc-300">{t(`campaign.types.${row.type}`)}</span>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "status",
        header: t("common.labels.status"),
        cell: (row) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
              row.status
            )}`}
          >
            {t(`campaign.statuses.${row.status}`)}
          </span>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "reward_type",
        header: t("campaign.rewardType"),
        cell: (row) => row.reward_type,
        cellClassName: "py-3 pr-4 text-sm text-zinc-300",
      },
      {
        key: "participants",
        header: t("campaign.participants"),
        cell: (row) => row.participants,
        cellClassName: "py-3 pr-4 text-sm tabular-nums text-white",
      },
      {
        key: "start_end",
        header: t("campaign.startEnd"),
        cell: (row) => (
          <div className="space-y-1 text-sm text-zinc-400">
            <p>{new Date(row.start_at).toLocaleDateString()}</p>
            <p>{new Date(row.end_at).toLocaleDateString()}</p>
          </div>
        ),
        cellClassName: "py-3 pr-0",
      },
    ],
    [t]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.campaign_id.toLowerCase().includes(normalizedQuery) ||
        row.reward_type.toLowerCase().includes(normalizedQuery) ||
        row.type.toLowerCase().includes(normalizedQuery) ||
        row.status.toLowerCase().includes(normalizedQuery);

      const matchesStatus = status === "all" || row.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("campaign.searchPlaceholder")}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
        />
        <AdminSelect
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "all", label: t("common.filters.allStatuses") },
            ...(["active", "scheduled", "ended"] as const).map((value) => ({
              value,
              label: t(`campaign.statuses.${value}`),
            })),
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(row) => row.campaign_id}
        minWidthClassName="min-w-[980px]"
        emptyMessage={t("campaign.noCampaigns")}
        onRowClick={(row) => setSelectedCampaign(row)}
      />

      <AppDrawer
        open={Boolean(selectedCampaign)}
        onOpenChange={(open) => {
          if (!open) setSelectedCampaign(null);
        }}
        title={selectedCampaign?.name ?? t("campaign.title")}
        width="wide"
      >
        {selectedCampaign ? (
          <>
            <DrawerHeader
              title={selectedCampaign.name}
              description={`${t(`campaign.types.${selectedCampaign.type}`)} | ${t(
                `campaign.statuses.${selectedCampaign.status}`
              )}`}
              onClose={() => setSelectedCampaign(null)}
            />
            <DrawerDivider />
            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("common.labels.overview")}
                    </h3>
                  }
                >
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("campaign.campaignName")}
                      </dt>
                      <dd className="text-sm font-medium text-white">{selectedCampaign.name}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("campaign.type")}
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {t(`campaign.types.${selectedCampaign.type}`)}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.status")}
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {t(`campaign.statuses.${selectedCampaign.status}`)}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("campaign.rewardType")}
                      </dt>
                      <dd className="text-sm text-zinc-300">{selectedCampaign.reward_type}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm text-zinc-400">{selectedCampaign.overview}</p>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("campaign.participants")}
                    </h3>
                  }
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-semibold tabular-nums text-white">
                        {selectedCampaign.participants}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">{t("campaign.participantSummary")}</p>
                    </div>
                    <p className="text-sm text-zinc-300">{selectedCampaign.participant_summary}</p>
                  </div>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("campaign.rules")}
                    </h3>
                  }
                >
                  <ul className="space-y-3 text-sm text-zinc-300">
                    {selectedCampaign.rules.map((rule) => (
                      <li key={rule} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        {rule}
                      </li>
                    ))}
                  </ul>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("campaign.rewards")}
                    </h3>
                  }
                >
                  <ul className="space-y-3 text-sm text-zinc-300">
                    {selectedCampaign.rewards.map((reward) => (
                      <li key={reward} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        {reward}
                      </li>
                    ))}
                  </ul>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("campaign.payout")}
                    </h3>
                  }
                  className="lg:col-span-2"
                >
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("campaign.payoutStatus")}
                      </dt>
                      <dd className="text-sm text-zinc-300">{selectedCampaign.payout_status}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.createdAt")}
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {new Date(selectedCampaign.start_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.updatedAt")}
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {new Date(selectedCampaign.end_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>
              </div>
            </DrawerBody>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}
