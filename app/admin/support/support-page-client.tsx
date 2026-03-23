"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";

import type { SupportTicket } from "./_types";

function getPriorityClass(priority: SupportTicket["priority"]) {
  if (priority === "urgent") return "bg-rose-500/10 text-rose-300";
  if (priority === "high") return "bg-amber-500/10 text-amber-300";
  if (priority === "medium") return "bg-blue-500/10 text-blue-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function getStatusClass(status: SupportTicket["status"]) {
  if (status === "open") return "bg-white/[0.08] text-zinc-200";
  if (status === "in_progress") return "bg-white/[0.07] text-zinc-300";
  if (status === "waiting_user") return "bg-white/[0.06] text-zinc-300";
  if (status === "resolved") return "bg-white/[0.06] text-zinc-300";
  return "bg-white/[0.05] text-zinc-400";
}

export function SupportPageClient({ rows }: { rows: SupportTicket[] }) {
  const { t } = useAdminPreferences();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const ticketColumns = useMemo<DataTableColumn<SupportTicket>[]>(
    () => [
      {
        key: "ticket_id",
        header: t("support.ticketId"),
        cell: (row) => row.ticket_id,
        cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
      },
      {
        key: "subject",
        header: t("support.subject"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-medium text-white">{row.subject}</p>
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
              {t(`support.categoryOptions.${row.category}`)}
            </p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "priority",
        header: t("support.priority"),
        cell: (row) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getPriorityClass(
              row.priority
            )}`}
          >
            {row.priority}
          </span>
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
            {t(`support.statusOptions.${row.status}`)}
          </span>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "requester",
        header: t("support.requester"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm text-zinc-200">{row.user_email}</p>
            <p className="font-mono text-xs text-zinc-500">{row.user_id}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "account_id",
        header: t("common.labels.accountId"),
        cell: (row) =>
          row.account_id ? (
            <div className="space-y-1">
              <p className="font-mono text-sm text-zinc-200">{row.account_id}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                {t("common.actions.viewAccount")}
              </p>
            </div>
          ) : (
            <span className="text-sm text-zinc-500">{t("support.noAccount")}</span>
          ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "related_module",
        header: t("support.relatedModule"),
        cell: (row) => (
          <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            {row.related_module ?? t("common.empty.dash")}
          </span>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "updated_at",
        header: t("common.labels.updatedAt"),
        cell: (row) => new Date(row.updated_at).toLocaleString(),
        cellClassName: "py-3 pr-4 text-sm text-zinc-400",
      },
    ],
    [t]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.ticket_id.toLowerCase().includes(normalizedQuery) ||
        row.subject.toLowerCase().includes(normalizedQuery) ||
        row.user_email.toLowerCase().includes(normalizedQuery) ||
        row.user_id.toLowerCase().includes(normalizedQuery) ||
        row.account_id?.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "all" || row.status === status;
      const matchesCategory = category === "all" || row.category === category;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [category, query, rows, status]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("support.searchPlaceholder")}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 focus:outline-none"
        >
          <option value="all" className="bg-zinc-950 text-zinc-200">
            {t("common.filters.allStatuses")}
          </option>
          {(["open", "in_progress", "waiting_user", "resolved", "closed"] as const).map((value) => (
            <option key={value} value={value} className="bg-zinc-950 text-zinc-200">
              {t(`support.statusOptions.${value}`)}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="admin-control h-11 rounded-xl border border-white/10 px-4 text-sm text-zinc-300 focus:outline-none"
        >
          <option value="all" className="bg-zinc-950 text-zinc-200">
            {t("common.filters.allCategories")}
          </option>
          {(
            ["account", "commission", "rebate", "withdrawal", "finance", "technical", "verification", "general"] as const
          ).map((value) => (
            <option key={value} value={value} className="bg-zinc-950 text-zinc-200">
              {t(`support.categoryOptions.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={ticketColumns}
        rows={filteredRows}
        getRowKey={(row) => row.ticket_id}
        minWidthClassName="min-w-[1140px]"
        emptyMessage={t("support.noTickets")}
        onRowClick={(row) => setSelectedTicket(row)}
      />

      <AppDrawer
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
        title={selectedTicket?.ticket_id ?? t("support.ticketId")}
        width="wide"
      >
        {selectedTicket ? (
          <>
            <DrawerHeader
              title={selectedTicket.subject}
              description={`${selectedTicket.ticket_id} | ${selectedTicket.related_module ?? "support"}`}
              onClose={() => setSelectedTicket(null)}
            />
            <DrawerDivider />
            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("support.overviewTitle")}
                    </h3>
                  }
                >
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("support.ticketId")}
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedTicket.ticket_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("support.subject")}
                      </dt>
                      <dd className="text-sm font-medium text-white">{selectedTicket.subject}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.category")}
                      </dt>
                      <dd className="text-sm uppercase text-zinc-300">
                        {t(`support.categoryOptions.${selectedTicket.category}`)}
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("support.priority")}
                      </dt>
                      <dd>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getPriorityClass(
                            selectedTicket.priority
                          )}`}
                        >
                          {selectedTicket.priority}
                        </span>
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.status")}
                      </dt>
                      <dd>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                            selectedTicket.status
                          )}`}
                        >
                          {t(`support.statusOptions.${selectedTicket.status}`)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("common.labels.contextRelationship")}
                    </h3>
                  }
                >
                  <dl className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("support.requesterLabel")}
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedTicket.user_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("support.email")}
                      </dt>
                      <dd className="text-sm text-white">{selectedTicket.user_email}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {t("common.labels.accountId")}
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">
                        {selectedTicket.account_id ?? t("common.empty.dash")}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel
                  title={
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {t("support.relatedContextTitle")}
                    </h3>
                  }
                  className="lg:col-span-2"
                >
                  <div className="space-y-5">
                    <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("support.relatedModule")}
                        </dt>
                        <dd className="text-sm uppercase text-zinc-300">
                          {selectedTicket.related_module ?? t("common.empty.dash")}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.accountId")}
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedTicket.account_id ?? t("common.empty.dash")}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("support.commissionId")}
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedTicket.commission_id ?? t("common.empty.dash")}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("support.rebateRecordId")}
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedTicket.rebate_record_id ?? t("common.empty.dash")}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("support.ledgerRef")}
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedTicket.ledger_ref ?? t("common.empty.dash")}
                        </dd>
                      </div>
                      <div className="space-y-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("support.withdrawalId")}
                        </dt>
                        <dd className="font-mono text-sm text-zinc-300">
                          {selectedTicket.withdrawal_id ?? t("common.empty.dash")}
                        </dd>
                      </div>
                    </dl>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="admin-surface-soft rounded-xl p-4 text-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.timelinePreview")}
                        </p>
                        <p className="mt-2 text-zinc-300">{selectedTicket.subject}</p>
                      </div>
                      <div className="admin-surface-soft rounded-xl p-4 text-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {t("common.labels.updatedAt")}
                        </p>
                        <p className="mt-2 text-zinc-300">
                          {t("support.updatedAtNote")}{" "}
                          {new Date(selectedTicket.updated_at).toLocaleString()}.
                        </p>
                      </div>
                    </div>
                  </div>
                </DataPanel>
              </div>
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {t("common.labels.handoff")}
              </p>
              <Link href={`/admin/users/${selectedTicket.user_id}`}>
                <AdminButton variant="ghost">{t("common.actions.viewUser")}</AdminButton>
              </Link>
              {selectedTicket.account_id ? (
                <Link href={`/admin/accounts/${selectedTicket.account_id}`}>
                  <AdminButton variant="secondary">{t("common.actions.viewAccount")}</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="secondary" disabled>
                  {t("common.actions.viewAccount")}
                </AdminButton>
              )}
              {selectedTicket.account_id ? (
                <Link href={`/admin/commission?account_id=${encodeURIComponent(selectedTicket.account_id)}`}>
                  <AdminButton variant="ghost">{t("common.actions.viewCommission")}</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="ghost" disabled>
                  {t("common.actions.viewCommission")}
                </AdminButton>
              )}
              {selectedTicket.account_id ? (
                <Link href={`/admin/finance/ledger?account_id=${encodeURIComponent(selectedTicket.account_id)}`}>
                  <AdminButton variant="primary">{t("common.actions.viewFinance")}</AdminButton>
                </Link>
              ) : (
                <AdminButton variant="primary" disabled>
                  {t("common.actions.viewFinance")}
                </AdminButton>
              )}
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </div>
  );
}
