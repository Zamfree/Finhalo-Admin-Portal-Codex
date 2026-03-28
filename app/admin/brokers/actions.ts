"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type BrokerMutationState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: BrokerMutationState = {};

function normalizeStatus(rawStatus: string): "active" | "inactive" {
  return rawStatus.trim().toLowerCase() === "inactive" ? "inactive" : "active";
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function isUniqueViolation(message: string) {
  return /duplicate key|already exists|unique/i.test(message);
}

async function updateBrokerWithPayloadAttempts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  brokerId: string,
  payloadAttempts: Array<Record<string, unknown>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const keyAttempts = ["broker_id", "id"] as const;
  let lastErrorMessage = "Failed to update broker.";

  for (const key of keyAttempts) {
    for (const payload of payloadAttempts) {
      const { data, error } = await supabase
        .from("brokers")
        .update(payload)
        .eq(key, brokerId)
        .select(key)
        .maybeSingle();

      if (!error && data) {
        return { ok: true };
      }

      if (error) {
        lastErrorMessage = error.message;

        if (!isMissingColumnError(error.message)) {
          break;
        }
      }
    }
  }

  return { ok: false, error: lastErrorMessage };
}

export async function createBrokerAction(
  _prevState: BrokerMutationState = INITIAL_STATE,
  formData: FormData
): Promise<BrokerMutationState> {
  void _prevState;
  const brokerId = String(formData.get("broker_id") ?? "").trim();
  const brokerName = String(formData.get("broker_name") ?? "").trim();
  const status = normalizeStatus(String(formData.get("status") ?? "active"));

  if (!brokerId) {
    return { error: "Broker ID is required." };
  }

  if (!brokerName) {
    return { error: "Broker name is required." };
  }

  const supabase = await createClient();
  const payloadAttempts: Array<Record<string, string>> = [
    { broker_id: brokerId, broker_name: brokerName, status },
    { id: brokerId, broker_name: brokerName, status },
    { broker_id: brokerId, name: brokerName, status },
    { id: brokerId, name: brokerName, status },
  ];

  let lastErrorMessage = "Failed to create broker.";

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from("brokers").insert(payload);

    if (!error) {
      revalidatePath("/admin/brokers");
      revalidatePath("/admin/commission/upload");

      return {
        success: `Broker ${brokerId} created.`,
      };
    }

    if (isUniqueViolation(error.message)) {
      return { error: `Broker ${brokerId} already exists.` };
    }

    lastErrorMessage = error.message;

    if (!isMissingColumnError(error.message)) {
      break;
    }
  }

  return { error: lastErrorMessage };
}

export async function updateBrokerAction(
  _prevState: BrokerMutationState = INITIAL_STATE,
  formData: FormData
): Promise<BrokerMutationState> {
  void _prevState;
  const brokerId = String(formData.get("broker_id") ?? "").trim();
  const brokerName = String(formData.get("broker_name") ?? "").trim();
  const status = normalizeStatus(String(formData.get("status") ?? "active"));

  if (!brokerId) {
    return { error: "Broker ID is required." };
  }

  if (!brokerName) {
    return { error: "Broker name is required." };
  }

  const supabase = await createClient();
  const payloadAttempts: Array<Record<string, unknown>> = [
    { broker_name: brokerName, status },
    { name: brokerName, status },
  ];

  const updated = await updateBrokerWithPayloadAttempts(supabase, brokerId, payloadAttempts);

  if (updated.ok) {
    revalidatePath("/admin/brokers");
    revalidatePath(`/admin/brokers/${brokerId}`);
    revalidatePath("/admin/commission/upload");

    return {
      success: `Broker ${brokerId} updated.`,
    };
  }

  if (isUniqueViolation(updated.error)) {
    return { error: `Broker name "${brokerName}" conflicts with an existing record.` };
  }

  return { error: updated.error };
}

export async function setBrokerStatusAction(
  _prevState: BrokerMutationState = INITIAL_STATE,
  formData: FormData
): Promise<BrokerMutationState> {
  void _prevState;
  const brokerId = String(formData.get("broker_id") ?? "").trim();
  const status = normalizeStatus(String(formData.get("status") ?? "active"));

  if (!brokerId) {
    return { error: "Broker ID is required." };
  }

  const supabase = await createClient();
  const updated = await updateBrokerWithPayloadAttempts(supabase, brokerId, [{ status }]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidatePath("/admin/brokers");
  revalidatePath(`/admin/brokers/${brokerId}`);
  revalidatePath("/admin/commission/upload");

  return {
    success: `Broker ${brokerId} is now ${status}.`,
  };
}

export async function updateBrokerImportConfigAction(
  _prevState: BrokerMutationState = INITIAL_STATE,
  formData: FormData
): Promise<BrokerMutationState> {
  void _prevState;
  const brokerId = String(formData.get("broker_id") ?? "").trim();
  const sourceFormat = String(formData.get("source_format") ?? "").trim();
  const ingestionMode = String(formData.get("ingestion_mode") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!brokerId) {
    return { error: "Broker ID is required." };
  }

  const importConfig = {
    source_format: sourceFormat || "CSV / XLSX",
    ingestion_mode: ingestionMode || "Batch import with pre-validation",
    timezone: timezone || "UTC+8",
    latest_import_at: new Date().toISOString(),
  };
  const supabase = await createClient();
  const updated = await updateBrokerWithPayloadAttempts(supabase, brokerId, [
    { import_config: importConfig },
    { import_configuration: importConfig },
    { ingestion_config: importConfig },
  ]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidatePath(`/admin/brokers/${brokerId}`);

  return {
    success: `Import rule settings saved for ${brokerId}.`,
  };
}

export async function updateBrokerCommissionConfigAction(
  _prevState: BrokerMutationState = INITIAL_STATE,
  formData: FormData
): Promise<BrokerMutationState> {
  void _prevState;
  const brokerId = String(formData.get("broker_id") ?? "").trim();
  const calculationModel = String(formData.get("calculation_model") ?? "").trim();
  const settlementWindow = String(formData.get("settlement_window") ?? "").trim();
  const rebateDepth = String(formData.get("rebate_depth") ?? "").trim();
  const adminFeeFloor = String(formData.get("admin_fee_floor") ?? "").trim();

  if (!brokerId) {
    return { error: "Broker ID is required." };
  }

  const commissionConfig = {
    calculation_model: calculationModel || "Batch-derived commission allocation",
    settlement_window: settlementWindow || "T+1 operational review",
    rebate_depth: rebateDepth || "L1 / L2",
    admin_fee_floor: adminFeeFloor || "10%",
  };
  const supabase = await createClient();
  const updated = await updateBrokerWithPayloadAttempts(supabase, brokerId, [
    { commission_config: commissionConfig },
    { commission_configuration: commissionConfig },
  ]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidatePath(`/admin/brokers/${brokerId}`);

  return {
    success: `Commission config saved for ${brokerId}.`,
  };
}

function parseJsonArray(rawValue: string, fieldName: string) {
  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return {
        error: `${fieldName} must be a JSON array.`,
      };
    }

    return {
      data: parsed,
    };
  } catch {
    return {
      error: `${fieldName} JSON is invalid.`,
    };
  }
}

export async function updateBrokerAccountTypeCoverageAction(
  _prevState: BrokerMutationState = INITIAL_STATE,
  formData: FormData
): Promise<BrokerMutationState> {
  void _prevState;
  const brokerId = String(formData.get("broker_id") ?? "").trim();
  const rawCoverage = String(formData.get("account_type_coverage_json") ?? "").trim();

  if (!brokerId) {
    return { error: "Broker ID is required." };
  }

  const parsedCoverage = parseJsonArray(rawCoverage, "Account type coverage");

  if ("error" in parsedCoverage) {
    return { error: parsedCoverage.error };
  }

  const supabase = await createClient();
  const updated = await updateBrokerWithPayloadAttempts(supabase, brokerId, [
    { account_type_coverage: parsedCoverage.data },
    { account_types: parsedCoverage.data },
    { account_type_config: parsedCoverage.data },
  ]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidatePath(`/admin/brokers/${brokerId}`);

  return {
    success: `Account type coverage saved for ${brokerId}.`,
  };
}

export async function updateBrokerMappingRulesAction(
  _prevState: BrokerMutationState = INITIAL_STATE,
  formData: FormData
): Promise<BrokerMutationState> {
  void _prevState;
  const brokerId = String(formData.get("broker_id") ?? "").trim();
  const rawRules = String(formData.get("mapping_rules_json") ?? "").trim();

  if (!brokerId) {
    return { error: "Broker ID is required." };
  }

  const parsedRules = parseJsonArray(rawRules, "Mapping rules");

  if ("error" in parsedRules) {
    return { error: parsedRules.error };
  }

  const supabase = await createClient();
  const updated = await updateBrokerWithPayloadAttempts(supabase, brokerId, [
    { mapping_rules: parsedRules.data },
    { import_mapping_rules: parsedRules.data },
    { import_rules: parsedRules.data },
  ]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidatePath(`/admin/brokers/${brokerId}`);

  return {
    success: `Import mapping rules saved for ${brokerId}.`,
  };
}
