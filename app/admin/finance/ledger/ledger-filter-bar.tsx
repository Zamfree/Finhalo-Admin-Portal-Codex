"use client";

import { FilterBar } from "@/components/system/data/filter-bar";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { LedgerFilterControls, LedgerViewerFilters } from "../_types";

const ALL_TRANSACTION_TYPE_OPTION = "__all_transactions__";

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </label>
  );
}

function FieldInput({
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  value: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
  type?: "text" | "date";
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
    />
  );
}

export function LedgerFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: LedgerFilterControls) {
  return (
    <FilterBar
      onApply={(event) => {
        event.preventDefault();
        applyFilters();
      }}
      onReset={clearFilters}
      search={
        <div>
          <FieldLabel>Search</FieldLabel>
          <FieldInput
            value={inputFilters.query}
            onChange={(value) => setInputFilter("query", value)}
            placeholder="Search ref/user/account/rebate/memo"
          />
        </div>
      }
      filters={
        <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <FieldLabel>User ID</FieldLabel>
            <FieldInput
              value={inputFilters.user_id}
              onChange={(value) => setInputFilter("user_id", value)}
              placeholder="USR-..."
            />
          </div>

          <div>
            <FieldLabel>Account ID</FieldLabel>
            <FieldInput
              value={inputFilters.account_id}
              onChange={(value) => setInputFilter("account_id", value)}
              placeholder="ACC-..."
            />
          </div>

          <div>
            <FieldLabel>Transaction Type</FieldLabel>
            <AdminSelect<LedgerViewerFilters["transaction_type"]>
              value={inputFilters.transaction_type || ALL_TRANSACTION_TYPE_OPTION}
              onValueChange={(value) =>
                setInputFilter(
                  "transaction_type",
                  value === ALL_TRANSACTION_TYPE_OPTION ? "" : value
                )
              }
              options={[
                { value: ALL_TRANSACTION_TYPE_OPTION, label: "All Transactions" },
                { value: "rebate_settlement", label: "Rebate Settlement" },
                { value: "withdrawal_request", label: "Withdrawal Request" },
                { value: "manual_adjustment", label: "Manual Adjustment" },
                { value: "reversal", label: "Reversal" },
              ]}
            />
          </div>

          <div>
            <FieldLabel>Direction</FieldLabel>
            <AdminSelect<LedgerViewerFilters["direction"]>
              value={inputFilters.direction}
              onValueChange={(value) => setInputFilter("direction", value)}
              options={[
                { value: "all", label: "All Directions" },
                { value: "credit", label: "Credit" },
                { value: "debit", label: "Debit" },
              ]}
            />
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <AdminSelect<LedgerViewerFilters["status"]>
              value={inputFilters.status}
              onValueChange={(value) => setInputFilter("status", value)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "posted", label: "Posted" },
                { value: "pending", label: "Pending" },
                { value: "reversed", label: "Reversed" },
              ]}
            />
          </div>

          <div>
            <FieldLabel>Reference Type</FieldLabel>
            <FieldInput
              value={inputFilters.reference_type}
              onChange={(value) => setInputFilter("reference_type", value)}
              placeholder="commission_batch_approval"
            />
          </div>

          <div>
            <FieldLabel>Reference ID</FieldLabel>
            <FieldInput
              value={inputFilters.reference_id}
              onChange={(value) => setInputFilter("reference_id", value)}
              placeholder="BATCH:COMM:ROLE"
            />
          </div>

          <div>
            <FieldLabel>Batch ID</FieldLabel>
            <FieldInput
              value={inputFilters.batch_id}
              onChange={(value) => setInputFilter("batch_id", value)}
              placeholder="BATCH-..."
            />
          </div>

          <div>
            <FieldLabel>Date From</FieldLabel>
            <FieldInput
              value={inputFilters.date_from}
              onChange={(value) => setInputFilter("date_from", value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          </div>

          <div>
            <FieldLabel>Date To</FieldLabel>
            <FieldInput
              value={inputFilters.date_to}
              onChange={(value) => setInputFilter("date_to", value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          </div>
        </div>
      }
    />
  );
}
