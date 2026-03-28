"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: string;
  batchId?: string;
};

type ParsedCsvRecord = {
  user_id: string;
  account_number: string;
  symbol: string;
  volume: number;
  commission_amount: number;
  commission_date: string;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("Uploaded file contains invalid numeric values.");
  }

  return parsed;
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

export async function uploadCommissionCsv(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const broker = String(formData.get("broker") ?? "").trim();
  const parsedCsv = String(formData.get("parsed_csv") ?? "");
  const sourceFile = String(formData.get("source_file") ?? "").trim();

  if (!broker) {
    return { error: "Broker is required." };
  }

  if (!parsedCsv) {
    return { error: "Parsed upload payload is required." };
  }

  let rows: ParsedCsvRecord[];

  try {
    const rawRows = JSON.parse(parsedCsv) as Array<Record<string, unknown>>;

    rows = rawRows.map((row) => ({
      user_id: String(row.user_id ?? "").trim(),
      account_number: String(row.account_number ?? "").trim(),
      symbol: String(row.symbol ?? "").trim(),
      volume: toNumber(row.volume),
      commission_amount: toNumber(row.commission_amount),
      commission_date: String(row.commission_date ?? "").trim(),
    }));
  } catch {
    return { error: "Failed to parse upload payload." };
  }

  if (rows.length === 0) {
    return { error: "No records found in upload payload." };
  }

  const hasInvalid = rows.some(
    (row) =>
      !row.user_id ||
      !row.account_number ||
      !row.symbol ||
      !row.commission_date ||
      !Number.isFinite(row.volume) ||
      !Number.isFinite(row.commission_amount)
  );

  if (hasInvalid) {
    return { error: "Upload payload contains missing or invalid fields." };
  }

  const duplicateKeys = rows.reduce<Map<string, number>>((accumulator, row) => {
    const key = `${row.account_number}__${row.symbol}__${row.commission_date}`;
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map());

  const duplicateCount = [...duplicateKeys.values()].filter((count) => count > 1).length;

  if (duplicateCount > 0) {
    return {
      error: `Duplicate review required. ${duplicateCount} duplicate row groups detected in this upload.`,
    };
  }

  const basePayload = {
    broker,
    import_date: new Date().toISOString(),
    record_count: rows.length,
    status: "validated",
    environment: "test" as const,
    ...(sourceFile ? { source_file: sourceFile } : {}),
  };
  let batchData: { batch_id: string } | null = null;
  let batchError: { message: string } | null = null;

  {
    const insertResult = await supabase
      .from("commission_batches")
      .insert({
        ...basePayload,
        simulation_status: "pending",
        simulation_completed_at: null,
      })
      .select("batch_id")
      .single();

    batchData = insertResult.data as { batch_id: string } | null;
    batchError = insertResult.error as { message: string } | null;
  }

  if (batchError && isMissingColumnError(batchError.message)) {
    const fallbackInsertResult = await supabase
      .from("commission_batches")
      .insert(basePayload)
      .select("batch_id")
      .single();

    batchData = fallbackInsertResult.data as { batch_id: string } | null;
    batchError = fallbackInsertResult.error as { message: string } | null;
  }

  if (batchError || !batchData) {
    return { error: batchError?.message ?? "Failed to create commission batch." };
  }

  const records = rows.map((row) => ({
    batch_id: batchData.batch_id,
    user_id: row.user_id,
    account_number: row.account_number,
    symbol: row.symbol,
    volume: row.volume,
    commission_amount: row.commission_amount,
    commission_date: row.commission_date,
  }));

  const { error: recordsError } = await supabase.from("commission_records").insert(records);

  if (recordsError) {
    return { error: recordsError.message };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");

  return {
    success: `Batch ${batchData.batch_id} uploaded successfully.`,
    batchId: batchData.batch_id,
  };
}
