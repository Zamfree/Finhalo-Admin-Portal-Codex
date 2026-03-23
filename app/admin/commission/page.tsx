"use client";

import * as React from "react";
import Link from "next/link";
import { AdminTabs } from "@/components/system/navigation/admin-tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { DataPanel } from "@/components/system/data/data-panel";
import { FilterBar } from "@/components/system/data/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { AdminButton } from "@/components/system/actions/admin-button";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { SummaryCard, formatAmount } from "./_shared";
import { MOCK_COMMISSION_RECORDS, MOCK_REBATE_RECORDS } from "./_mock-data";
import type { CommissionRecord, RebateRecord } from "./_types";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "processed":
    case "posted":
      return "bg-emerald-500/10 text-emerald-300";
    case "validated":
    case "pending":
      return "bg-amber-500/10 text-amber-300";
    case "imported":
      return "bg-blue-500/10 text-blue-300";
    default:
      return "bg-zinc-500/10 text-zinc-300";
  }
}

export default function CommissionPage() {
  const { t } = useAdminPreferences();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const accountIdFromUrl = searchParams.get("account_id") ?? "";
  const initialTab =
    tabFromUrl === "inputs" ? "inputs" : tabFromUrl === "rebates" ? "rebates" : "allocation";

  const [activeTab, setActiveTab] = React.useState<"inputs" | "allocation" | "rebates">(initialTab);
  const [queryInput, setQueryInput] = React.useState(accountIdFromUrl);
  const [appliedQuery, setAppliedQuery] = React.useState(accountIdFromUrl);
  const [selectedRecord, setSelectedRecord] = React.useState<CommissionRecord | null>(null);

  React.useEffect(() => {
    const nextTabParam = searchParams.get("tab");
    const nextTab =
      nextTabParam === "inputs"
        ? "inputs"
        : nextTabParam === "rebates"
          ? "rebates"
          : "allocation";
    const nextAccountId = searchParams.get("account_id") ?? "";

    setActiveTab(nextTab);
    setQueryInput(nextAccountId);
    setAppliedQuery(nextAccountId);
  }, [searchParams]);

  const filteredCommissions = React.useMemo(() => {
    const keyword = appliedQuery.trim().toLowerCase();

    return MOCK_COMMISSION_RECORDS.filter((record) => {
      if (!keyword) {
        return true;
      }

      return (
        record.commission_id.toLowerCase().includes(keyword) ||
        record.batch_id.toLowerCase().includes(keyword) ||
        record.trader_user_id.toLowerCase().includes(keyword) ||
        record.trader_email.toLowerCase().includes(keyword) ||
        record.broker.toLowerCase().includes(keyword) ||
        record.account_id.toLowerCase().includes(keyword)
      );
    });
  }, [appliedQuery]);

  const filteredRebates = React.useMemo(() => {
    const keyword = appliedQuery.trim().toLowerCase();

    return MOCK_REBATE_RECORDS.filter((record) => {
      if (!keyword) {
        return true;
      }

      return (
        record.rebate_id.toLowerCase().includes(keyword) ||
        record.beneficiary.toLowerCase().includes(keyword) ||
        record.account_id.toLowerCase().includes(keyword)
      );
    });
  }, [appliedQuery]);

  function closeDrawer() {
    setSelectedRecord(null);
  }

  function openFinanceReference(record: CommissionRecord) {
    if (record.ledger_ref) {
      router.push(`/admin/finance/ledger?ledger_ref=${encodeURIComponent(record.ledger_ref)}`);
      return;
    }

    if (record.rebate_record_id) {
      router.push(
        `/admin/finance/ledger?rebate_record_id=${encodeURIComponent(record.rebate_record_id)}`
      );
    }
  }

  function openAccountReference(record: CommissionRecord) {
    router.push(`/admin/accounts/${encodeURIComponent(record.account_id)}`);
  }

  function getNetworkSnapshotHref(record: CommissionRecord) {
    const params = new URLSearchParams({
      detail_account_id: record.account_id,
      tab: "overview",
    });

    // Future navigation should prefer the exact historical relationship snapshot when available.
    if (record.relationship_snapshot_id) {
      params.set("snapshot_id", record.relationship_snapshot_id);
    }

    return `/admin/network?${params.toString()}`;
  }

  function clearAccountFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("account_id");
    router.push(params.toString() ? `/admin/commission?${params.toString()}` : "/admin/commission");
  }

  const brokerInputColumns: DataTableColumn<CommissionRecord>[] = [
    {
      key: "commission_id",
      header: "Commission ID",
      sortable: true,
      sortAccessor: (row) => row.commission_id,
      cell: (row) => row.commission_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "batch_id",
      header: "Batch",
      sortable: true,
      sortAccessor: (row) => row.batch_id,
      cell: (row) => row.batch_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "broker",
      header: "Broker",
      sortable: true,
      sortAccessor: (row) => row.broker,
      cell: (row) => row.broker,
      cellClassName: "py-4 pr-4 text-zinc-300",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "gross_commission",
      header: "Gross Commission",
      cell: (row) => formatAmount(row.gross_commission, "neutral"),
      headerClassName: "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-4 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "imported_at",
      header: "Imported At",
      sortable: true,
      sortAccessor: (row) => new Date(row.imported_at).getTime(),
      cell: (row) => {
        const date = new Date(row.imported_at);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      },
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];

  const allocationColumns: DataTableColumn<CommissionRecord>[] = [
    {
      key: "trader_email",
      header: "Trader Email",
      sortable: true,
      sortAccessor: (row) => row.trader_email,
      cell: (row) => <span className="font-medium text-white">{row.trader_email}</span>,
      cellClassName: "py-4 pr-4",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "broker",
      header: "Broker",
      sortable: true,
      sortAccessor: (row) => row.broker,
      cell: (row) => row.broker,
      cellClassName: "py-4 pr-4 text-zinc-300",
    },
    {
      key: "rebate_type",
      header: "Rebate Type",
      sortable: true,
      sortAccessor: (row) => row.rebate_type,
      cell: (row) => (
        <span className="inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
          {row.rebate_type}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "amount_breakdown",
      header: "Amount Breakdown",
      sortable: true,
      sortAccessor: (row) => row.gross_commission,
      cell: (row) => (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold tabular-nums text-white">
            Gross Commission {formatAmount(row.gross_commission, "neutral")}
          </p>
          <p className="text-xs tabular-nums text-zinc-400">
            Platform Retained {formatAmount(row.platform_amount, "negative")}
          </p>
          <p className="text-xs tabular-nums text-zinc-400">
            L2 Commission {formatAmount(row.l2_amount, row.l2_amount > 0 ? "negative" : "neutral")}
          </p>
          <p className="text-xs tabular-nums text-zinc-500">
            Remaining Pool {formatAmount(row.pool_amount, "neutral")}
          </p>
          <p className="text-xs tabular-nums text-zinc-300">
            Trader + L1 Distribution {formatAmount(row.trader_amount + row.l1_amount, "positive")}
          </p>
        </div>
      ),
      cellClassName: "py-4 pr-4",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "settled_at",
      header: "Settled At",
      sortable: true,
      sortAccessor: (row) => new Date(row.settled_at).getTime(),
      cell: (row) => {
        const date = new Date(row.settled_at);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      },
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];

  const rebateRecordColumns: DataTableColumn<RebateRecord>[] = [
    {
      key: "rebate_id",
      header: "Rebate ID",
      cell: (row) => row.rebate_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "beneficiary",
      header: "Beneficiary",
      sortable: true,
      sortAccessor: (row) => row.beneficiary,
      cell: (row) => <span className="font-medium text-white">{row.beneficiary}</span>,
      cellClassName: "py-4 pr-4",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatAmount(row.amount, row.status === "reversed" ? "negative" : "positive"),
      headerClassName: "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-4 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "rebate_type",
      header: "Type",
      cell: (row) => (
        <span className="inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
          {row.rebate_type}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "created_at",
      header: "Created At",
      cell: (row) => {
        const date = new Date(row.created_at);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      },
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];

  const totalInputCommission = filteredCommissions.reduce((sum, row) => sum + row.gross_commission, 0);
  const importedCount = filteredCommissions.filter((row) => row.status === "imported").length;
  const validatedCount = filteredCommissions.filter((row) => row.status === "validated").length;
  const processedCount = filteredCommissions.filter((row) => row.status === "processed").length;

  const totalAllocatedRebate = filteredCommissions.reduce((sum, row) => sum + row.rebate_amount, 0);
  const totalPlatformShare = filteredCommissions.reduce((sum, row) => sum + row.platform_amount, 0);
  const allocationRecordCount = filteredCommissions.length;

  const totalPaid = filteredRebates
    .filter((row) => row.status === "posted")
    .reduce((sum, row) => sum + row.amount, 0);
  const pendingRebates = filteredRebates.filter((row) => row.status === "pending").length;
  const settledRebates = filteredRebates.filter((row) => row.status === "posted").length;
  const rebateRecordCount = filteredRebates.length;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Commission
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t("commission.title")}<span className="ml-1.5 inline-block text-amber-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          {t("commission.description")}
        </p>
      </div>
      <DataPanel
        title={
          <h2 className="text-xl font-semibold text-white">
            {activeTab === "inputs"
              ? t("commission.brokerInputs")
              : activeTab === "allocation"
                ? t("commission.commissionBreakdown")
                : t("commission.rebateRecords")}
          </h2>
        }
        description={
          activeTab === "inputs" ? (
            <p className="max-w-2xl text-sm text-zinc-400">
              Review imported broker inputs before validation and downstream breakdown.
            </p>
          ) : activeTab === "allocation" ? (
            <p className="max-w-2xl text-sm text-zinc-400">
              Inspect commission split outputs and use the drawer for waterfall detail, relationship context, and finance handoff.
            </p>
          ) : (
            <p className="max-w-2xl text-sm text-zinc-400">
              Review finalized rebate entries generated from the commission breakdown pipeline.
            </p>
          )
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/commission/upload">
              <AdminButton variant="primary" className="h-11 px-5">
                {t("commission.uploadCommission")}
              </AdminButton>
            </Link>
            <Link href="/admin/commission/batches">
              <AdminButton variant="secondary" className="h-11 px-5">
                {t("commission.batchManagement")}
              </AdminButton>
            </Link>
            <Link href="/admin/commission/simulate">
              <AdminButton variant="ghost" className="h-11 px-5">
                {t("commission.simulation")}
              </AdminButton>
            </Link>
          </div>
        }
        filters={
          <FilterBar
            onApply={(event) => {
              event.preventDefault();
              setAppliedQuery(queryInput);
            }}
            onReset={() => {
              setQueryInput("");
              setAppliedQuery("");
            }}
            search={
              <div>
                <label
                  htmlFor="commission_query"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                >
                  {t("common.labels.search")}
                </label>
                <input
                  id="commission_query"
                  name="commission_query"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder={t("commission.searchPlaceholder")}
                  className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                />
              </div>
            }
            filters={<div className="hidden sm:block" />}
          />
        }
        tabs={
          <AdminTabs
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            options={[
              { value: "inputs", label: t("commission.brokerInputs") },
              { value: "allocation", label: t("commission.commissionBreakdown") },
              { value: "rebates", label: t("commission.rebateRecords") },
            ]}
          />
        }
        summary={
          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {activeTab === "inputs" ? (
              <>
                <SummaryCard
                  label={t("commission.summary.totalCommission")}
                  value={formatAmount(totalInputCommission, "neutral")}
                  emphasis="strong"
                />
                <SummaryCard label={t("commission.summary.imported")} value={importedCount} />
                <SummaryCard label={t("commission.summary.validated")} value={validatedCount} />
                <SummaryCard label={t("commission.summary.processed")} value={processedCount} />
              </>
            ) : activeTab === "allocation" ? (
              <>
                <SummaryCard
                  label={t("commission.summary.totalGross")}
                  value={formatAmount(totalInputCommission, "neutral")}
                  emphasis="strong"
                />
                <SummaryCard
                  label={t("commission.summary.totalRebate")}
                  value={formatAmount(totalAllocatedRebate, "neutral")}
                />
                <SummaryCard
                  label={t("commission.summary.totalPlatformShare")}
                  value={formatAmount(totalPlatformShare, "neutral")}
                />
                <SummaryCard label={t("commission.summary.records")} value={allocationRecordCount} />
              </>
            ) : (
              <>
                <SummaryCard
                  label={t("commission.summary.totalPaid")}
                  value={formatAmount(totalPaid, "positive")}
                  emphasis="strong"
                />
                <SummaryCard label={t("commission.summary.pending")} value={pendingRebates} />
                <SummaryCard label={t("commission.summary.settled")} value={settledRebates} />
                <SummaryCard label={t("commission.summary.records")} value={rebateRecordCount} />
              </>
            )}
          </div>
        }
      >
        {accountIdFromUrl ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <span className="text-zinc-400">{t("commission.filteredByAccount")}:</span>
            <span className="font-mono text-white">{accountIdFromUrl}</span>
            <AdminButton variant="ghost" onClick={clearAccountFilter} className="px-3 py-2">
              {t("common.actions.clear")}
            </AdminButton>
          </div>
        ) : null}

        {activeTab === "inputs" ? (
          <>
            <p className="text-sm text-zinc-500">
              {t("commission.helper.inputStages")}
            </p>
            <DataTable
              columns={brokerInputColumns}
              rows={filteredCommissions}
              getRowKey={(row) => row.commission_id}
              minWidthClassName="min-w-[920px]"
              emptyMessage="No commission records found."
              onRowClick={(row) => setSelectedRecord(row)}
            />
          </>
        ) : activeTab === "allocation" ? (
          <>
            <p className="text-sm text-zinc-400">
              {t("commission.helper.allocationStages")}
            </p>
            <DataTable
              columns={allocationColumns}
              rows={filteredCommissions}
              getRowKey={(row) => row.commission_id}
              minWidthClassName="min-w-[980px]"
              emptyMessage="No allocation records found."
              onRowClick={(row) => setSelectedRecord(row)}
            />
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-400">
              {t("commission.helper.rebatePipeline")}
            </p>
            <p className="text-sm text-zinc-500">
              {t("commission.helper.rebateStates")}
            </p>
            <DataTable
              columns={rebateRecordColumns}
              rows={filteredRebates}
              getRowKey={(row) => row.rebate_id}
              minWidthClassName="min-w-[920px]"
              emptyMessage="No rebate records found."
            />
          </>
        )}
      </DataPanel>

      <AppDrawer
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null);
        }}
        title={selectedRecord?.commission_id ?? "Commission Detail"}
        width="wide"
      >
        {selectedRecord ? (
          <>
            <DrawerHeader
              title={selectedRecord.commission_id}
              description={`${selectedRecord.trader_email} | ${selectedRecord.broker}`}
              onClose={closeDrawer}
            />

            <DrawerDivider />

            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-2">
                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}>
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Commission ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedRecord.commission_id}</dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Trader
                      </dt>
                      <dd className="text-sm font-medium text-white">{selectedRecord.trader_email}</dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Trader User ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedRecord.trader_user_id}</dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Broker
                      </dt>
                      <dd className="text-sm text-zinc-300">{selectedRecord.broker}</dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Account ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedRecord.account_id}</dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Rebate Type
                      </dt>
                      <dd className="text-sm uppercase text-zinc-300">{selectedRecord.rebate_type}</dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Status
                      </dt>
                      <dd className="text-sm capitalize text-zinc-300">{selectedRecord.status}</dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Settled At
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {new Date(selectedRecord.settled_at).toLocaleString()}
                      </dd>
                    </div>
                    <div className="space-y-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Batch ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedRecord.batch_id ?? "-"}</dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel
                  title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context / Relationship</h3>}
                  className="lg:col-span-2"
                >
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Source Amount
                      </p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                        Gross Commission
                      </p>
                      <p className="mt-3 text-3xl font-semibold tabular-nums text-white">
                        {formatAmount(selectedRecord.gross_commission, "neutral")}
                      </p>
                    </div>

                    <div className="relative space-y-3 pl-5 before:absolute before:bottom-4 before:left-[9px] before:top-4 before:w-px before:bg-white/[0.06]">
                      <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-4 before:absolute before:left-[-19px] before:top-6 before:h-2.5 before:w-2.5 before:rounded-full before:border before:border-white/10 before:bg-zinc-800">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              Step 1 - Deduction
                            </p>
                            <p
                              className="text-base font-semibold text-white"
                              title="Finhalo portion retained from the broker commission before downstream allocation."
                            >
                              Platform Retained
                            </p>
                            <p className="text-sm text-zinc-400">
                              Rule: retained before downstream allocation
                            </p>
                          </div>
                          <p className="text-xl font-semibold tabular-nums text-rose-100">
                            {formatAmount(selectedRecord.platform_amount, "negative")}
                          </p>
                        </div>
                      </div>

                      <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-4 before:absolute before:left-[-19px] before:top-6 before:h-2.5 before:w-2.5 before:rounded-full before:border before:border-white/10 before:bg-zinc-800">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              Step 2 - Deduction
                            </p>
                            <p
                              className="text-base font-semibold text-white"
                              title="Commission allocated to the L2 IB for this trading account, if applicable."
                            >
                              L2 Commission
                            </p>
                            <p className="text-sm text-zinc-400">
                              Beneficiary:{" "}
                              {selectedRecord.l2_amount > 0
                                ? selectedRecord.l2_ib_id ?? "—"
                                : "No L2 applicable"}
                            </p>
                          </div>
                          <p className="text-xl font-semibold tabular-nums text-rose-100">
                            {formatAmount(
                              selectedRecord.l2_amount,
                              selectedRecord.l2_amount > 0 ? "negative" : "neutral"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 before:absolute before:left-[-19px] before:top-6 before:h-2.5 before:w-2.5 before:rounded-full before:border before:border-white/10 before:bg-zinc-700">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              Step 3 - Remaining
                            </p>
                            <p
                              className="text-base font-semibold text-white"
                              title="Commission amount remaining after platform and L2 deductions."
                            >
                              Remaining Pool (after deductions)
                            </p>
                            <p className="text-sm text-zinc-400">Formula: Gross - Platform - L2</p>
                          </div>
                          <p className="text-2xl font-semibold tabular-nums text-white">
                            {formatAmount(selectedRecord.pool_amount, "neutral")}
                          </p>
                        </div>
                      </div>

                      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 before:absolute before:left-[-19px] before:top-6 before:h-2.5 before:w-2.5 before:rounded-full before:border before:border-white/10 before:bg-zinc-700">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              Step 4 - Distribution
                            </p>
                            <p className="text-base font-semibold text-white">
                              Trader + L1 Distribution (from Pool)
                            </p>
                            <div className="grid gap-2 pt-1 sm:grid-cols-2">
                              <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                  Trader Cashback
                                </p>
                                <p className="mt-1 text-sm font-semibold tabular-nums text-white">
                                  {formatAmount(selectedRecord.trader_amount, "positive")}
                                </p>
                              </div>
                              <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                  L1 Commission
                                </p>
                                <p className="mt-1 text-sm font-semibold tabular-nums text-white">
                                  {formatAmount(selectedRecord.l1_amount, "positive")}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                              Total Distributed
                            </p>
                            <p className="text-lg font-semibold tabular-nums text-white">
                              {formatAmount(selectedRecord.trader_amount + selectedRecord.l1_amount, "neutral")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DataPanel>

                <DataPanel
                  title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Related Activity / References</h3>}
                  className="lg:col-span-2"
                >
                  <div className="space-y-5">
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
                      {t("commission.helper.relationshipNote")}
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Relationship Chain
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {selectedRecord.trader_user_id} -&gt; {selectedRecord.l1_ib_id ?? "-"} -&gt;{" "}
                        {selectedRecord.l2_ib_id ?? "-"}
                      </p>
                      <p className="mt-2 font-mono text-xs text-zinc-500">
                        Snapshot {selectedRecord.relationship_snapshot_id ?? "-"}
                      </p>
                    </div>
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Trader Account User ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedRecord.trader_user_id}</dd>
                      </div>
                      <div className="space-y-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L1 IB on Account
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedRecord.l1_ib_id ?? "—"}</dd>
                      </div>
                      <div className="space-y-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          L2 IB on Account
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedRecord.l2_ib_id ?? "—"}</dd>
                      </div>
                      <div className="space-y-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Relationship Snapshot ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedRecord.relationship_snapshot_id ?? "-"}
                        </dd>
                      </div>
                      <div className="space-y-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Rebate Record ID
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedRecord.rebate_record_id ?? "—"}
                        </dd>
                      </div>
                      <div className="space-y-3">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Ledger Ref
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">{selectedRecord.ledger_ref ?? "—"}</dd>
                      </div>
                    </dl>
                  </div>
                </DataPanel>
              </div>
            </DrawerBody>

            <DrawerDivider />

            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Handoff
              </p>
              <AdminButton
                variant="ghost"
                onClick={() => openAccountReference(selectedRecord)}
              >
                View Account
              </AdminButton>
              <Link href={getNetworkSnapshotHref(selectedRecord)}>
                <AdminButton variant="ghost">View Network Snapshot</AdminButton>
              </Link>
              <AdminButton
                variant="secondary"
                onClick={() => openFinanceReference(selectedRecord)}
              >
                View Finance
              </AdminButton>
              <AdminButton variant="primary">Post Adjustment</AdminButton>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}
