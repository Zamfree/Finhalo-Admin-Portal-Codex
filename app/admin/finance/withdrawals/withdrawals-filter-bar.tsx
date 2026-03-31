"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import { FilterBar } from "@/components/system/data/filter-bar";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { WithdrawalFilterControls, WithdrawalFilters } from "../_types";

type WithdrawalsFilterBarProps = WithdrawalFilterControls & {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  activeAdvancedCount: number;
};

export function WithdrawalsFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
  showAdvanced,
  onToggleAdvanced,
  activeAdvancedCount,
}: WithdrawalsFilterBarProps) {
  return (
    <div className="space-y-3">
      <FilterBar
        onApply={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        onReset={clearFilters}
        search={
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Search
            </label>
            <input
              value={inputFilters.query}
              onChange={(event) => setInputFilter("query", event.target.value)}
              placeholder="Withdrawal ID / user / account"
              className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>
        }
        filters={
          <>
            <div className="sm:w-[220px]">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Status
              </label>
              <AdminSelect<WithdrawalFilters["status"]>
                value={inputFilters.status}
                onValueChange={(value) => setInputFilter("status", value)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "requested", label: "Requested" },
                  { value: "under_review", label: "Under Review" },
                  { value: "approved", label: "Approved" },
                  { value: "processing", label: "Processing" },
                  { value: "completed", label: "Completed" },
                  { value: "rejected", label: "Rejected" },
                  { value: "failed", label: "Failed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>

            <AdminButton
              type="button"
              variant="ghost"
              onClick={onToggleAdvanced}
              className="h-11 px-4 text-xs normal-case tracking-normal"
            >
              {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
              {activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ""}
            </AdminButton>
          </>
        }
      />

      {showAdvanced ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Advanced Filters
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                User ID
              </label>
              <input
                value={inputFilters.user_id}
                onChange={(event) => setInputFilter("user_id", event.target.value)}
                placeholder="USER-123"
                className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Account ID
              </label>
              <input
                value={inputFilters.account_id}
                onChange={(event) => setInputFilter("account_id", event.target.value)}
                placeholder="ACC-10001"
                className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Currency
              </label>
              <input
                value={inputFilters.currency}
                onChange={(event) => setInputFilter("currency", event.target.value.toUpperCase())}
                placeholder="USD"
                className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Payout Method
              </label>
              <input
                value={inputFilters.payout_method}
                onChange={(event) => setInputFilter("payout_method", event.target.value)}
                placeholder="wallet_transfer"
                className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Date From
              </label>
              <input
                type="date"
                value={inputFilters.date_from}
                onChange={(event) => setInputFilter("date_from", event.target.value)}
                className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Date To
              </label>
              <input
                type="date"
                value={inputFilters.date_to}
                onChange={(event) => setInputFilter("date_to", event.target.value)}
                className="admin-control h-11 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}