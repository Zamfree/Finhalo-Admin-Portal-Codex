"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import { WITHDRAWAL_DRAWER_QUERY_CONFIG } from "../_config";
import { WITHDRAWAL_DEFAULT_FILTERS, WITHDRAWAL_DRAWER_TABS } from "../_constants";
import { filterWithdrawalRows } from "../_mappers";
import { formatAmount } from "../_shared";
import { bulkApproveSelectedWithdrawalsAction, bulkRejectSelectedWithdrawalsAction } from "./actions";
import { WithdrawalsFilterBar } from "./withdrawals-filter-bar";
import { WithdrawalDrawer } from "./drawer/withdrawal-drawer";
import type { WithdrawalFilters, WithdrawalRow } from "../_types";

type WithdrawalFilterPreset = {
  id: string;
  name: string;
  filters: WithdrawalFilters;
  last_used_at: number;
};

type WithdrawalSystemPreset = {
  key: string;
  label: string;
  filters: WithdrawalFilters;
};

const PRESET_STORAGE_KEY = "finhalo.admin.withdrawals.filter-presets.v1";
const ACTION_INITIAL_STATE: BulkActionState = {};
const WITHDRAWAL_SYSTEM_PRESETS: WithdrawalSystemPreset[] = [
  {
    key: "open",
    label: "Open (Requested)",
    filters: {
      ...WITHDRAWAL_DEFAULT_FILTERS,
      status: "requested",
    },
  },
  {
    key: "review_queue",
    label: "Review Queue",
    filters: {
      ...WITHDRAWAL_DEFAULT_FILTERS,
      status: "under_review",
    },
  },
  {
    key: "failed",
    label: "Failed",
    filters: {
      ...WITHDRAWAL_DEFAULT_FILTERS,
      status: "failed",
    },
  },
];

type BulkActionState = {
  error?: string;
  success?: string;
};

function getStatusClass(status: WithdrawalRow["status"]) {
  if (status === "requested") return "bg-amber-500/10 text-amber-300";
  if (status === "under_review") return "bg-sky-500/10 text-sky-300";
  if (status === "approved") return "bg-emerald-500/10 text-emerald-300";
  if (status === "processing") return "bg-indigo-500/10 text-indigo-300";
  if (status === "completed") return "bg-emerald-500/15 text-emerald-200";
  if (status === "failed") return "bg-rose-500/10 text-rose-300";
  if (status === "cancelled") return "bg-zinc-500/10 text-zinc-300";
  return "bg-rose-500/10 text-rose-300";
}

function getNextActionHint(status: WithdrawalRow["status"]) {
  if (status === "requested") return "Move to under review";
  if (status === "under_review") return "Approve or reject";
  if (status === "approved") return "Mark processing or completed";
  if (status === "processing") return "Complete or fail";
  if (status === "failed") return "Check release and retry plan";
  if (status === "rejected") return "No further action";
  if (status === "cancelled") return "No further action";
  return "Completed";
}

function getWithdrawalColumns(params: {
  selectedIds: Set<string>;
  onToggleSelect: (withdrawalId: string) => void;
}): DataTableColumn<WithdrawalRow>[] {
  return [
    {
      key: "select",
      header: "Select",
      cell: (row) => (
        <input
          type="checkbox"
          checked={params.selectedIds.has(row.withdrawal_id)}
          onChange={() => params.onToggleSelect(row.withdrawal_id)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Select withdrawal ${row.withdrawal_id}`}
          className="h-4 w-4 rounded border-white/20 bg-transparent accent-sky-400"
        />
      ),
      cellClassName: "py-3 pr-4",
      width: "72px",
    },
    {
      key: "withdrawal_id",
      header: "Withdrawal ID",
      cell: (row) => row.withdrawal_id,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "beneficiary",
      header: "User",
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="block truncate font-medium text-white">{row.beneficiary}</span>
          <span className="block truncate font-mono text-[11px] text-zinc-500">{row.user_id}</span>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "account_id",
      header: "Account",
      cell: (row) => row.account_id,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "request_amount",
      header: "Request",
      cell: (row) => formatAmount(row.request_amount, "neutral"),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "fee_amount",
      header: "Fee",
      cell: (row) => formatAmount(row.fee_amount, "negative"),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-300",
    },
    {
      key: "net_amount",
      header: "Net",
      cell: (row) => formatAmount(row.net_amount, "positive"),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-emerald-200",
    },
    {
      key: "currency",
      header: "Currency",
      cell: (row) => row.currency,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "destination",
      header: "Destination",
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="block truncate font-mono text-xs text-zinc-300">{row.destination}</span>
          <span className="block truncate text-[11px] text-zinc-500">{row.payout_method}</span>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge size="default" toneClassName={getStatusClass(row.status)}>
          {row.status}
        </StatusBadge>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "next_action",
      header: "Next Action",
      cell: (row) => <span className="text-xs text-zinc-400">{getNextActionHint(row.status)}</span>,
      cellClassName: "py-3 pr-4",
    },
    {
      key: "requested_at",
      header: "Requested At",
      cell: (row) => new Date(row.requested_at).toLocaleString(),
      cellClassName: "py-3 pr-4 text-sm text-zinc-400",
    },
    {
      key: "review_process",
      header: "Reviewed / Processed",
      cell: (row) => (
        <div className="space-y-0.5 text-[11px] text-zinc-500">
          <p>
            reviewed: {row.reviewed_by ?? "-"} {row.reviewed_at ? `@ ${new Date(row.reviewed_at).toLocaleString()}` : ""}
          </p>
          <p>
            processed: {row.processed_by ?? "-"} {row.processed_at ? `@ ${new Date(row.processed_at).toLocaleString()}` : ""}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
  ];
}

function createPresetId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `preset-${Date.now()}`;
}

function sortPresetsByRecentUse(presets: WithdrawalFilterPreset[]) {
  return [...presets].sort((left, right) => {
    if (left.last_used_at !== right.last_used_at) {
      return right.last_used_at - left.last_used_at;
    }

    return left.name.localeCompare(right.name);
  });
}

function formatLastUsed(lastUsedAt: number) {
  if (!Number.isFinite(lastUsedAt) || lastUsedAt <= 0) {
    return "Never";
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - lastUsedAt);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(lastUsedAt).toLocaleDateString();
}

function isSameFilters(left: WithdrawalFilters, right: WithdrawalFilters) {
  return (
    left.query === right.query &&
    left.status === right.status &&
    left.user_id === right.user_id &&
    left.account_id === right.account_id &&
    left.currency === right.currency &&
    left.payout_method === right.payout_method &&
    left.date_from === right.date_from &&
    left.date_to === right.date_to
  );
}

export function WithdrawalsPageClient({
  rows,
}: {
  rows: WithdrawalRow[];
}) {
  const PAGE_SIZE = 25;
  const filters = useAdminFilters<WithdrawalFilters>({
    defaultFilters: WITHDRAWAL_DEFAULT_FILTERS,
  });
  const currentPage = filters.currentPage;
  const setCurrentPage = filters.setCurrentPage;
  const [presets, setPresets] = useState<WithdrawalFilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");
  const [selectedWithdrawalIds, setSelectedWithdrawalIds] = useState<string[]>([]);
  const [bulkRejectReason, setBulkRejectReason] = useState("Rejected by admin bulk review.");
  const [bulkTransitionNotes, setBulkTransitionNotes] = useState("");
  const [bulkApproveState, bulkApproveAction, bulkApprovePending] = useActionState(
    bulkApproveSelectedWithdrawalsAction,
    ACTION_INITIAL_STATE
  );
  const [bulkRejectState, bulkRejectAction, bulkRejectPending] = useActionState(
    bulkRejectSelectedWithdrawalsAction,
    ACTION_INITIAL_STATE
  );

  const drawerState = useDrawerQueryState({
    detailKey: WITHDRAWAL_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: WITHDRAWAL_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.withdrawal_id,
    defaultTab: "overview",
    validTabs: WITHDRAWAL_DRAWER_TABS,
  });

  const filteredRows = filterWithdrawalRows(rows, filters.appliedFilters);
  const systemPresetCounts = useMemo(() => {
    return WITHDRAWAL_SYSTEM_PRESETS.reduce<Record<string, number>>((accumulator, preset) => {
      accumulator[preset.key] = filterWithdrawalRows(rows, preset.filters).length;
      return accumulator;
    }, {});
  }, [rows]);
  const canSavePreset = useMemo(
    () => !isSameFilters(filters.appliedFilters, WITHDRAWAL_DEFAULT_FILTERS),
    [filters.appliedFilters]
  );
  const statusCounts = {
    requested: filteredRows.filter((row) => row.status === "requested").length,
    under_review: filteredRows.filter((row) => row.status === "under_review").length,
    approved: filteredRows.filter((row) => row.status === "approved").length,
    processing: filteredRows.filter((row) => row.status === "processing").length,
    completed: filteredRows.filter((row) => row.status === "completed").length,
  };
  const actionRequiredCount =
    statusCounts.requested + statusCounts.under_review + statusCounts.approved + statusCounts.processing;
  const reviewQueueCount = statusCounts.requested + statusCounts.under_review;
  const totalRows = filteredRows.length;
  const filteredRowIds = filteredRows.map((row) => row.withdrawal_id);
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);
  const paginatedRowIds = paginatedRows.map((row) => row.withdrawal_id);
  const selectedIdSet = useMemo(() => new Set(selectedWithdrawalIds), [selectedWithdrawalIds]);
  const visibleFrom = totalRows === 0 ? 0 : startIndex + 1;
  const visibleTo = totalRows === 0 ? 0 : Math.min(endIndex, totalRows);
  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < totalPages;
  const selectedCount = selectedWithdrawalIds.length;
  const selectedOnPageCount = paginatedRowIds.filter((id) => selectedIdSet.has(id)).length;
  const selectedOnFilterCount = filteredRowIds.filter((id) => selectedIdSet.has(id)).length;
  const selectedRows = useMemo(() => {
    const byId = new Map(rows.map((row) => [row.withdrawal_id, row]));
    return selectedWithdrawalIds
      .map((withdrawalId) => byId.get(withdrawalId))
      .filter((row): row is WithdrawalRow => Boolean(row));
  }, [rows, selectedWithdrawalIds]);
  const approvableFilteredIds = useMemo(
    () =>
      filteredRows
        .filter((row) => row.status === "requested" || row.status === "under_review")
        .map((row) => row.withdrawal_id),
    [filteredRows]
  );
  const rejectableFilteredIds = useMemo(
    () =>
      filteredRows
        .filter((row) => row.status === "requested" || row.status === "under_review")
        .map((row) => row.withdrawal_id),
    [filteredRows]
  );
  const approvableSelectedIds = useMemo(
    () =>
      selectedRows
        .filter((row) => row.status === "requested" || row.status === "under_review")
        .map((row) => row.withdrawal_id),
    [selectedRows]
  );
  const rejectableSelectedIds = useMemo(
    () =>
      selectedRows
        .filter((row) => row.status === "requested" || row.status === "under_review")
        .map((row) => row.withdrawal_id),
    [selectedRows]
  );
  const encodedApprovableSelectedIds = useMemo(
    () => JSON.stringify(approvableSelectedIds),
    [approvableSelectedIds]
  );
  const encodedRejectableSelectedIds = useMemo(
    () => JSON.stringify(rejectableSelectedIds),
    [rejectableSelectedIds]
  );
  const encodedApprovableFilteredIds = useMemo(
    () => JSON.stringify(approvableFilteredIds),
    [approvableFilteredIds]
  );
  const encodedRejectableFilteredIds = useMemo(
    () => JSON.stringify(rejectableFilteredIds),
    [rejectableFilteredIds]
  );

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage, setCurrentPage]);

  useEffect(() => {
    const availableIds = new Set(rows.map((row) => row.withdrawal_id));
    setSelectedWithdrawalIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [rows]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
      if (!raw) {
        setPresets([]);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setPresets([]);
        return;
      }

      const safePresets = parsed
        .filter((item): item is WithdrawalFilterPreset => {
          if (!item || typeof item !== "object") return false;
          const record = item as Record<string, unknown>;
          return (
            typeof record.id === "string" &&
            typeof record.name === "string" &&
            record.filters !== null &&
            typeof record.filters === "object"
          );
        })
        .map((item) => ({
          id: item.id,
          name: item.name,
          filters: {
            ...WITHDRAWAL_DEFAULT_FILTERS,
            ...item.filters,
          },
          last_used_at:
            typeof (item as unknown as Record<string, unknown>).last_used_at === "number"
              ? ((item as unknown as Record<string, unknown>).last_used_at as number)
              : 0,
        }));

      setPresets(sortPresetsByRecentUse(safePresets));
    } catch {
      setPresets([]);
    }
  }, []);

  function persistPresets(nextPresets: WithdrawalFilterPreset[]) {
    const sorted = sortPresetsByRecentUse(nextPresets);
    setPresets(sorted);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(sorted));
    }
  }

  function saveCurrentPreset() {
    if (!canSavePreset) {
      setPresetMessage("Apply at least one filter before saving a preset.");
      return;
    }

    const normalizedName = presetName.trim() || `Preset ${presets.length + 1}`;
    const nextPreset: WithdrawalFilterPreset = {
      id: createPresetId(),
      name: normalizedName,
      filters: { ...filters.appliedFilters },
      last_used_at: Date.now(),
    };
    const nextPresets = [nextPreset, ...presets].slice(0, 12);
    persistPresets(nextPresets);
    setPresetName("");
    setPresetMessage(`Saved preset "${normalizedName}".`);
  }

  function applyPreset(preset: WithdrawalFilterPreset) {
    filters.applyNextFilters({
      ...WITHDRAWAL_DEFAULT_FILTERS,
      ...preset.filters,
    });

    if (!preset.id.startsWith("system:")) {
      const nextPresets = presets.map((candidate) =>
        candidate.id === preset.id
          ? {
              ...candidate,
              last_used_at: Date.now(),
            }
          : candidate
      );
      persistPresets(nextPresets);
    }

    setPresetMessage(`Applied preset "${preset.name}".`);
  }

  function removePreset(presetId: string) {
    const nextPresets = presets.filter((preset) => preset.id !== presetId);
    persistPresets(nextPresets);
    setPresetMessage("Preset removed.");
  }

  function startRenamePreset(preset: WithdrawalFilterPreset) {
    setEditingPresetId(preset.id);
    setEditingPresetName(preset.name);
    setPresetMessage(null);
  }

  function cancelRenamePreset() {
    setEditingPresetId(null);
    setEditingPresetName("");
  }

  function confirmRenamePreset(presetId: string) {
    const nextName = editingPresetName.trim();
    if (!nextName) {
      setPresetMessage("Preset name cannot be empty.");
      return;
    }

    const nextPresets = presets.map((preset) =>
      preset.id === presetId
        ? {
            ...preset,
            name: nextName,
          }
        : preset
    );

    persistPresets(nextPresets);
    setEditingPresetId(null);
    setEditingPresetName("");
    setPresetMessage(`Preset renamed to "${nextName}".`);
  }

  function toggleSelectWithdrawal(withdrawalId: string) {
    setSelectedWithdrawalIds((prev) => {
      if (prev.includes(withdrawalId)) {
        return prev.filter((id) => id !== withdrawalId);
      }

      return [...prev, withdrawalId];
    });
  }

  function selectCurrentPage() {
    if (paginatedRowIds.length === 0) {
      return;
    }

    setSelectedWithdrawalIds((prev) => {
      const next = new Set(prev);
      for (const rowId of paginatedRowIds) {
        next.add(rowId);
      }
      return Array.from(next);
    });
  }

  function deselectCurrentPage() {
    if (paginatedRowIds.length === 0) {
      return;
    }

    const pageSet = new Set(paginatedRowIds);
    setSelectedWithdrawalIds((prev) => prev.filter((id) => !pageSet.has(id)));
  }

  function selectFilteredRows() {
    if (filteredRowIds.length === 0) {
      return;
    }

    setSelectedWithdrawalIds((prev) => {
      const next = new Set(prev);
      for (const rowId of filteredRowIds) {
        next.add(rowId);
      }
      return Array.from(next);
    });
  }

  function deselectFilteredRows() {
    if (filteredRowIds.length === 0) {
      return;
    }

    const filteredSet = new Set(filteredRowIds);
    setSelectedWithdrawalIds((prev) => prev.filter((id) => !filteredSet.has(id)));
  }

  function clearAllSelection() {
    setSelectedWithdrawalIds([]);
  }

  function removeSelectedWithdrawal(withdrawalId: string) {
    setSelectedWithdrawalIds((prev) => prev.filter((id) => id !== withdrawalId));
  }

  function openSelectedWithdrawal(withdrawalId: string) {
    const row = rows.find((item) => item.withdrawal_id === withdrawalId);
    if (!row) {
      return;
    }

    drawerState.openDrawer(row);
  }

  function openFirstSelected() {
    for (const id of selectedWithdrawalIds) {
      const row = filteredRows.find((item) => item.withdrawal_id === id);
      if (row) {
        drawerState.openDrawer(row);
        return;
      }
    }
  }

  function openNextSelected() {
    if (selectedWithdrawalIds.length === 0) {
      return;
    }

    const currentId = drawerState.selectedItem?.withdrawal_id ?? "";
    const currentIndex = selectedWithdrawalIds.findIndex((id) => id === currentId);
    const searchStartIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

    for (let i = searchStartIndex; i < selectedWithdrawalIds.length; i += 1) {
      const row = filteredRows.find((item) => item.withdrawal_id === selectedWithdrawalIds[i]);
      if (row) {
        drawerState.openDrawer(row);
        return;
      }
    }

    openFirstSelected();
  }

  return (
    <div className="space-y-4">
      <WithdrawalsFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />
      <FilterStateSummary filters={filters.appliedFilters} />
      <FilterPresetBar
        presetName={presetName}
        setPresetName={setPresetName}
        presets={presets}
        systemPresets={WITHDRAWAL_SYSTEM_PRESETS}
        systemPresetCounts={systemPresetCounts}
        canSavePreset={canSavePreset}
        onSavePreset={saveCurrentPreset}
        onApplyPreset={applyPreset}
        onRemovePreset={removePreset}
        onStartRenamePreset={startRenamePreset}
        onCancelRenamePreset={cancelRenamePreset}
        onConfirmRenamePreset={confirmRenamePreset}
        editingPresetId={editingPresetId}
        editingPresetName={editingPresetName}
        setEditingPresetName={setEditingPresetName}
        message={presetMessage}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusSummaryCard label="Action Required" value={actionRequiredCount} tone="amber" />
        <StatusSummaryCard label="Review Queue" value={reviewQueueCount} tone="sky" />
        <StatusSummaryCard label="Processing" value={statusCounts.processing} tone="indigo" />
        <StatusSummaryCard label="Completed" value={statusCounts.completed} tone="emerald" />
      </div>
      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Selection Actions
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400">
            Selected {selectedCount} | In filter {selectedOnFilterCount}/{filteredRows.length} | On page {selectedOnPageCount}/{paginatedRows.length}
          </span>
          <button
            type="button"
            onClick={selectFilteredRows}
            disabled={filteredRows.length === 0}
            className="h-8 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Select Filtered
          </button>
          <button
            type="button"
            onClick={deselectFilteredRows}
            disabled={selectedOnFilterCount === 0}
            className="h-8 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Deselect Filtered
          </button>
          <button
            type="button"
            onClick={selectCurrentPage}
            disabled={paginatedRows.length === 0}
            className="h-8 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Select Page
          </button>
          <button
            type="button"
            onClick={deselectCurrentPage}
            disabled={selectedOnPageCount === 0}
            className="h-8 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Deselect Page
          </button>
          <button
            type="button"
            onClick={clearAllSelection}
            disabled={selectedCount === 0}
            className="h-8 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={openFirstSelected}
            disabled={selectedCount === 0}
            className="h-8 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Open First Selected
          </button>
          <button
            type="button"
            onClick={openNextSelected}
            disabled={selectedCount === 0}
            className="h-8 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Open Next Selected
          </button>
        </div>
        <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Bulk Transition
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Applies server-side workflow transitions to selected rows. Requested reason is mandatory for rejection.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <input
              value={bulkRejectReason}
              onChange={(event) => setBulkRejectReason(event.target.value)}
              placeholder="Bulk reject reason"
              className="admin-control h-9 rounded-xl px-3 text-xs text-zinc-200 outline-none"
            />
            <input
              value={bulkTransitionNotes}
              onChange={(event) => setBulkTransitionNotes(event.target.value)}
              placeholder="Optional notes for audit trail"
              className="admin-control h-9 rounded-xl px-3 text-xs text-zinc-200 outline-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={bulkApproveAction}>
              <input type="hidden" name="withdrawal_ids_json" value={encodedApprovableFilteredIds} />
              <input type="hidden" name="notes" value={bulkTransitionNotes} />
              <button
                type="submit"
                disabled={approvableFilteredIds.length === 0 || bulkApprovePending || bulkRejectPending}
                className="h-9 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkApprovePending ? "Approving..." : `Approve Filtered (${approvableFilteredIds.length})`}
              </button>
            </form>
            <form action={bulkRejectAction}>
              <input type="hidden" name="withdrawal_ids_json" value={encodedRejectableFilteredIds} />
              <input type="hidden" name="reason" value={bulkRejectReason} />
              <input type="hidden" name="notes" value={bulkTransitionNotes} />
              <button
                type="submit"
                disabled={
                  rejectableFilteredIds.length === 0 ||
                  bulkApprovePending ||
                  bulkRejectPending ||
                  bulkRejectReason.trim().length === 0
                }
                className="h-9 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkRejectPending ? "Rejecting..." : `Reject Filtered (${rejectableFilteredIds.length})`}
              </button>
            </form>
            <form action={bulkApproveAction}>
              <input type="hidden" name="withdrawal_ids_json" value={encodedApprovableSelectedIds} />
              <input type="hidden" name="notes" value={bulkTransitionNotes} />
              <button
                type="submit"
                disabled={approvableSelectedIds.length === 0 || bulkApprovePending || bulkRejectPending}
                className="h-9 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkApprovePending ? "Approving..." : `Approve Selected (${approvableSelectedIds.length})`}
              </button>
            </form>
            <form action={bulkRejectAction}>
              <input type="hidden" name="withdrawal_ids_json" value={encodedRejectableSelectedIds} />
              <input type="hidden" name="reason" value={bulkRejectReason} />
              <input type="hidden" name="notes" value={bulkTransitionNotes} />
              <button
                type="submit"
                disabled={
                  rejectableSelectedIds.length === 0 ||
                  bulkApprovePending ||
                  bulkRejectPending ||
                  bulkRejectReason.trim().length === 0
                }
                className="h-9 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkRejectPending ? "Rejecting..." : `Reject Selected (${rejectableSelectedIds.length})`}
              </button>
            </form>
          </div>
          {bulkApproveState.success ? (
            <p className="mt-2 text-xs text-emerald-300">{bulkApproveState.success}</p>
          ) : null}
          {bulkApproveState.error ? <p className="mt-2 text-xs text-rose-300">{bulkApproveState.error}</p> : null}
          {bulkRejectState.success ? (
            <p className="mt-2 text-xs text-emerald-300">{bulkRejectState.success}</p>
          ) : null}
          {bulkRejectState.error ? <p className="mt-2 text-xs text-rose-300">{bulkRejectState.error}</p> : null}
        </div>
      </div>
      <SelectedQueuePanel
        rows={selectedRows}
        activeWithdrawalId={drawerState.selectedItem?.withdrawal_id ?? null}
        onOpenWithdrawal={openSelectedWithdrawal}
        onRemoveWithdrawal={removeSelectedWithdrawal}
      />

      <DataTable
        columns={getWithdrawalColumns({
          selectedIds: selectedIdSet,
          onToggleSelect: toggleSelectWithdrawal,
        })}
        rows={paginatedRows}
        getRowKey={(row) => row.withdrawal_id}
        getRowAriaLabel={(row) => `Open withdrawal ${row.withdrawal_id}`}
        minWidthClassName="min-w-[1940px]"
        onRowClick={(row) => drawerState.openDrawer(row)}
        emptyMessage="No withdrawal requests found."
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-zinc-400">
          Showing {visibleFrom}-{visibleTo} of {totalRows} withdrawals
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
            disabled={!hasPreviousPage}
            className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            Page {safeCurrentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
            disabled={!hasNextPage}
            className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <WithdrawalDrawer
        withdrawal={drawerState.selectedItem}
        open={drawerState.isOpen}
        activeTab={drawerState.activeTab}
        onChangeTab={drawerState.changeTab}
        onClose={drawerState.closeDrawer}
        onOpenChange={(open) => {
          if (!open) drawerState.closeDrawer();
        }}
      />
    </div>
  );
}

function FilterPresetBar({
  presetName,
  setPresetName,
  presets,
  systemPresets,
  systemPresetCounts,
  canSavePreset,
  onSavePreset,
  onApplyPreset,
  onRemovePreset,
  onStartRenamePreset,
  onCancelRenamePreset,
  onConfirmRenamePreset,
  editingPresetId,
  editingPresetName,
  setEditingPresetName,
  message,
}: {
  presetName: string;
  setPresetName: (value: string) => void;
  presets: WithdrawalFilterPreset[];
  systemPresets: WithdrawalSystemPreset[];
  systemPresetCounts: Record<string, number>;
  canSavePreset: boolean;
  onSavePreset: () => void;
  onApplyPreset: (preset: WithdrawalFilterPreset) => void;
  onRemovePreset: (presetId: string) => void;
  onStartRenamePreset: (preset: WithdrawalFilterPreset) => void;
  onCancelRenamePreset: () => void;
  onConfirmRenamePreset: (presetId: string) => void;
  editingPresetId: string | null;
  editingPresetName: string;
  setEditingPresetName: (value: string) => void;
  message: string | null;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        System Presets
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {systemPresets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() =>
              onApplyPreset({
                id: `system:${preset.key}`,
                name: preset.label,
                filters: preset.filters,
              })
            }
            className="h-8 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200 hover:bg-sky-500/20"
          >
            {preset.label} ({systemPresetCounts[preset.key] ?? 0})
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <p className="w-full text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Your Presets (Recent First)
        </p>
        <input
          value={presetName}
          onChange={(event) => setPresetName(event.target.value)}
          placeholder="Preset name"
          className="admin-control h-9 min-w-[180px] rounded-xl px-3 text-xs text-zinc-200 outline-none"
        />
        <button
          type="button"
          onClick={onSavePreset}
          disabled={!canSavePreset}
          className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save Current
        </button>
      </div>
      {presets.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1"
            >
              {editingPresetId === preset.id ? (
                <>
                  <input
                    value={editingPresetName}
                    onChange={(event) => setEditingPresetName(event.target.value)}
                    className="admin-control h-7 min-w-[120px] rounded-lg px-2 text-[10px] text-zinc-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onConfirmRenamePreset(preset.id)}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300 hover:text-emerald-200"
                  >
                    save
                  </button>
                  <button
                    type="button"
                    onClick={onCancelRenamePreset}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-zinc-300"
                  >
                    cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onApplyPreset(preset)}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300 hover:text-zinc-100"
                  >
                    {preset.name}
                  </button>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    {formatLastUsed(preset.last_used_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStartRenamePreset(preset)}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-sky-300"
                    aria-label={`Rename preset ${preset.name}`}
                  >
                    rename
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemovePreset(preset.id)}
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-rose-300"
                aria-label={`Remove preset ${preset.name}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {presets.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">No local presets saved yet.</p>
      ) : null}
      {message ? <p className="mt-2 text-xs text-zinc-500">{message}</p> : null}
    </div>
  );
}

function FilterStateSummary({ filters }: { filters: WithdrawalFilters }) {
  const activePairs = [
    ["status", filters.status !== "all" ? filters.status : ""],
    ["user", filters.user_id],
    ["account", filters.account_id],
    ["currency", filters.currency],
    ["payout_method", filters.payout_method],
    ["date_from", filters.date_from],
    ["date_to", filters.date_to],
    ["query", filters.query],
  ].filter(([, value]) => Boolean(value));

  if (activePairs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No active filters. URL and table are showing the full withdrawal queue.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Active Filters (URL Synced)
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {activePairs.map(([key, value]) => (
          <span
            key={`${key}:${value}`}
            className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400"
          >
            {key}: {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "sky" | "indigo" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-300"
      : tone === "sky"
      ? "text-sky-300"
      : tone === "indigo"
      ? "text-indigo-300"
      : "text-emerald-300";

  return (
    <div className="admin-surface-soft rounded-2xl px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function SelectedQueuePanel({
  rows,
  activeWithdrawalId,
  onOpenWithdrawal,
  onRemoveWithdrawal,
}: {
  rows: WithdrawalRow[];
  activeWithdrawalId: string | null;
  onOpenWithdrawal: (withdrawalId: string) => void;
  onRemoveWithdrawal: (withdrawalId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Selected Queue
        </p>
        <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{rows.length} selected</span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          No withdrawals selected yet. Use the table checkboxes to create a quick review queue.
        </p>
      ) : (
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => {
            const isActive = activeWithdrawalId === row.withdrawal_id;
            return (
              <div
                key={row.withdrawal_id}
                className={`flex items-center justify-between gap-2 rounded-xl border px-2 py-1.5 ${
                  isActive
                    ? "border-sky-400/30 bg-sky-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpenWithdrawal(row.withdrawal_id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-mono text-xs text-zinc-200">{row.withdrawal_id}</p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {row.beneficiary} | {formatAmount(row.net_amount, "positive")}
                  </p>
                </button>
                <StatusBadge size="sm" toneClassName={getStatusClass(row.status)}>
                  {row.status}
                </StatusBadge>
                <button
                  type="button"
                  onClick={() => onRemoveWithdrawal(row.withdrawal_id)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 hover:text-rose-300"
                >
                  remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
