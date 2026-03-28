"use client";

import { useActionState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import {
  setBrokerStatusAction,
  updateBrokerAccountTypeCoverageAction,
  updateBrokerCommissionConfigAction,
  updateBrokerImportConfigAction,
  updateBrokerMappingRulesAction,
  type BrokerMutationState,
} from "@/app/admin/brokers/actions";
import type {
  BrokerAccountTypeCoverage,
  BrokerCommissionConfiguration,
  BrokerImportConfiguration,
  BrokerMappingRule,
} from "./_types";

const INITIAL_STATE: BrokerMutationState = {};

function ActionStateFeedback({ state }: { state: BrokerMutationState }) {
  if (state.error) {
    return (
      <p className="break-words text-sm text-rose-300" aria-live="polite">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="break-words text-sm text-emerald-300" aria-live="polite">
        {state.success}
      </p>
    );
  }

  return null;
}

export function BrokerOperationsPanel({
  brokerId,
  status,
  importConfig,
  commissionConfig,
  accountTypeCoverage,
  mappingRules,
}: {
  brokerId: string;
  status: "active" | "inactive";
  importConfig: BrokerImportConfiguration;
  commissionConfig: BrokerCommissionConfiguration;
  accountTypeCoverage: BrokerAccountTypeCoverage[];
  mappingRules: BrokerMappingRule[];
}) {
  const router = useRouter();
  const [statusState, statusAction, statusPending] = useActionState(
    setBrokerStatusAction,
    INITIAL_STATE
  );
  const [importState, importAction, importPending] = useActionState(
    updateBrokerImportConfigAction,
    INITIAL_STATE
  );
  const [commissionState, commissionAction, commissionPending] = useActionState(
    updateBrokerCommissionConfigAction,
    INITIAL_STATE
  );
  const [accountTypeState, accountTypeAction, accountTypePending] = useActionState(
    updateBrokerAccountTypeCoverageAction,
    INITIAL_STATE
  );
  const [mappingState, mappingAction, mappingPending] = useActionState(
    updateBrokerMappingRulesAction,
    INITIAL_STATE
  );

  const coverageJson = useMemo(
    () => JSON.stringify(accountTypeCoverage, null, 2),
    [accountTypeCoverage]
  );
  const mappingRulesJson = useMemo(() => JSON.stringify(mappingRules, null, 2), [mappingRules]);

  return (
    <div className="space-y-6">
      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Broker Controls</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            Toggle broker availability and update broker-side configurations from this route.
          </p>
        }
      >
        <form
          action={async (formData) => {
            await statusAction(formData);
            router.refresh();
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="broker_id" value={brokerId} />
          <input type="hidden" name="status" value={status === "active" ? "inactive" : "active"} />
          <AdminButton
            type="submit"
            variant={status === "active" ? "destructive" : "primary"}
            className="h-11 px-5"
            disabled={statusPending}
          >
            {statusPending
              ? "Updating..."
              : status === "active"
                ? "Disable Broker"
                : "Enable Broker"}
          </AdminButton>
        </form>
        <div className="mt-3">
          <ActionStateFeedback state={statusState} />
        </div>
      </DataPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataPanel title={<h2 className="text-xl font-semibold text-white">Import Rule Settings</h2>}>
          <form
            action={async (formData) => {
              await importAction(formData);
              router.refresh();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="broker_id" value={brokerId} />
            <BrokerField label="Source Format" name="source_format" defaultValue={importConfig.source_format} />
            <BrokerField label="Ingestion Mode" name="ingestion_mode" defaultValue={importConfig.ingestion_mode} />
            <BrokerField label="Timezone" name="timezone" defaultValue={importConfig.timezone} />
            <AdminButton type="submit" variant="primary" className="h-10 px-4" disabled={importPending}>
              {importPending ? "Saving..." : "Save Import Rules"}
            </AdminButton>
            <ActionStateFeedback state={importState} />
          </form>
        </DataPanel>

        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">Commission Configuration</h2>}
        >
          <form
            action={async (formData) => {
              await commissionAction(formData);
              router.refresh();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="broker_id" value={brokerId} />
            <BrokerField
              label="Calculation Model"
              name="calculation_model"
              defaultValue={commissionConfig.calculation_model}
            />
            <BrokerField
              label="Settlement Window"
              name="settlement_window"
              defaultValue={commissionConfig.settlement_window}
            />
            <BrokerField label="Rebate Depth" name="rebate_depth" defaultValue={commissionConfig.rebate_depth} />
            <BrokerField
              label="Admin Fee Floor"
              name="admin_fee_floor"
              defaultValue={commissionConfig.admin_fee_floor}
            />
            <AdminButton
              type="submit"
              variant="primary"
              className="h-10 px-4"
              disabled={commissionPending}
            >
              {commissionPending ? "Saving..." : "Save Commission Config"}
            </AdminButton>
            <ActionStateFeedback state={commissionState} />
          </form>
        </DataPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataPanel title={<h2 className="text-xl font-semibold text-white">Account Type Management</h2>}>
          <form
            action={async (formData) => {
              await accountTypeAction(formData);
              router.refresh();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="broker_id" value={brokerId} />
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Coverage JSON
              </span>
              <textarea
                name="account_type_coverage_json"
                defaultValue={coverageJson}
                rows={12}
                className="admin-control w-full rounded-xl px-4 py-3 font-mono text-xs text-zinc-200 outline-none"
              />
            </label>
            <AdminButton
              type="submit"
              variant="primary"
              className="h-10 px-4"
              disabled={accountTypePending}
            >
              {accountTypePending ? "Saving..." : "Save Account Type Coverage"}
            </AdminButton>
            <ActionStateFeedback state={accountTypeState} />
          </form>
        </DataPanel>

        <DataPanel title={<h2 className="text-xl font-semibold text-white">Mapping Rule Settings</h2>}>
          <form
            action={async (formData) => {
              await mappingAction(formData);
              router.refresh();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="broker_id" value={brokerId} />
            <label className="block space-y-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Mapping Rules JSON
              </span>
              <textarea
                name="mapping_rules_json"
                defaultValue={mappingRulesJson}
                rows={12}
                className="admin-control w-full rounded-xl px-4 py-3 font-mono text-xs text-zinc-200 outline-none"
              />
            </label>
            <AdminButton type="submit" variant="primary" className="h-10 px-4" disabled={mappingPending}>
              {mappingPending ? "Saving..." : "Save Mapping Rules"}
            </AdminButton>
            <ActionStateFeedback state={mappingState} />
          </form>
        </DataPanel>
      </div>
    </div>
  );
}

function BrokerField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
      />
    </label>
  );
}
