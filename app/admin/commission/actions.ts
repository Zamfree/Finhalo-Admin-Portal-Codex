"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { read, utils } from "xlsx";

import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_IDENTIFIER_MAPPING_FIELDS,
  type CommissionCanonicalField,
  COMMISSION_CANONICAL_FIELDS,
  type CommissionUploadMapping,
  REQUIRED_MAPPING_FIELDS,
} from "./upload/_mapping";

type UploadTemplateOption = {
  template_id: string;
  template_name: string;
  broker: string;
  mappings: CommissionUploadMapping;
  is_default: boolean;
};

type UploadActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  duplicateBatchId?: string;
  uploadedFileName?: string;
  rowCount?: number;
  sourceColumns?: string[];
  uploadFingerprint?: string;
  availableTemplates?: UploadTemplateOption[];
};

type MappingActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  mappedRows?: number;
  failedRows?: number;
  mappingStatus?: "mapped" | "failed";
  templateId?: string;
};

type ParsedCsvRow = {
  rowNumber: number;
  raw: Record<string, string>;
};

type ParsedCsvResult = {
  headers: string[];
  rows: ParsedCsvRow[];
};

type StagingRow = {
  row_number: number;
  raw_row: Record<string, string>;
};

type MappingUpdateRow = {
  batch_id: string;
  row_number: number;
  raw_row: Record<string, string>;
  broker: string;
  account_id: string | null;
  account_number: string | null;
  commission_amount: number | null;
  commission_date: string | null;
  volume: number | null;
  symbol: string | null;
  currency: string | null;
  account_type: string | null;
  mapping_status: "mapped" | "failed";
  mapping_error: string | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CANONICAL_FIELD_SET = new Set<CommissionCanonicalField>(
  COMMISSION_CANONICAL_FIELDS.map((field) => field.key)
);
const SUPPORTED_COMMISSION_UPLOAD_EXTENSIONS = new Set([".csv", ".xlsx", ".xls"]);

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot < 0 || lastDot === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDot).toLowerCase();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result.map((value) => value.replace(/\uFEFF/g, ""));
}

function toUniqueHeaders(headers: string[]) {
  const seen = new Map<string, number>();

  return headers.map((header, index) => {
    const normalized = header.trim() || `column_${index + 1}`;
    const count = (seen.get(normalized) ?? 0) + 1;
    seen.set(normalized, count);

    if (count === 1) {
      return normalized;
    }

    return `${normalized}_${count}`;
  });
}

function parseCsvContent(csvText: string): ParsedCsvResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.replace(/\uFEFF/g, ""))
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV file must include a header row and at least one data row.");
  }

  const headers = toUniqueHeaders(parseCsvLine(lines[0]));
  const rows: ParsedCsvRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const cells = parseCsvLine(lines[index]);
    const row: Record<string, string> = {};

    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      row[headers[headerIndex]] = (cells[headerIndex] ?? "").trim();
    }

    const hasData = Object.values(row).some((value) => value.trim().length > 0);
    if (!hasData) {
      continue;
    }

    rows.push({
      rowNumber: index + 1,
      raw: row,
    });
  }

  if (rows.length === 0) {
    throw new Error("CSV file does not contain any non-empty data rows.");
  }

  return { headers, rows };
}

function normalizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value).trim();
  }

  return String(value).trim();
}

function parseWorkbookContent(fileBuffer: Buffer): ParsedCsvResult {
  const workbook = read(fileBuffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Spreadsheet file must include at least one worksheet.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error("Unable to read the first worksheet in the uploaded file.");
  }

  const matrix = utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });

  if (matrix.length < 2) {
    throw new Error("Spreadsheet file must include a header row and at least one data row.");
  }

  const headerRow = Array.isArray(matrix[0]) ? matrix[0] : [];
  const headers = toUniqueHeaders(headerRow.map((cell) => normalizeSpreadsheetCell(cell)));
  const rows: ParsedCsvRow[] = [];

  for (let index = 1; index < matrix.length; index += 1) {
    const cells = Array.isArray(matrix[index]) ? matrix[index] : [];
    const row: Record<string, string> = {};

    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      row[headers[headerIndex]] = normalizeSpreadsheetCell(cells[headerIndex]);
    }

    const hasData = Object.values(row).some((value) => value.trim().length > 0);
    if (!hasData) {
      continue;
    }

    rows.push({
      rowNumber: index + 1,
      raw: row,
    });
  }

  if (rows.length === 0) {
    throw new Error("Spreadsheet file does not contain any non-empty data rows.");
  }

  return { headers, rows };
}

function parseCommissionUploadContent(fileName: string, fileBuffer: Buffer): ParsedCsvResult {
  const extension = getFileExtension(fileName);

  if (extension === ".csv") {
    return parseCsvContent(fileBuffer.toString("utf8"));
  }

  if (extension === ".xlsx" || extension === ".xls") {
    return parseWorkbookContent(fileBuffer);
  }

  throw new Error("Unsupported file format. Use CSV, XLSX, or XLS files.");
}

function normalizeMapping(raw: unknown): CommissionUploadMapping {
  if (!isRecord(raw)) {
    return {};
  }

  const mapping: CommissionUploadMapping = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!CANONICAL_FIELD_SET.has(key as CommissionCanonicalField)) {
      continue;
    }

    if (typeof value !== "string") {
      continue;
    }

    const normalized = value.trim();
    if (!normalized) {
      continue;
    }

    mapping[key as CommissionCanonicalField] = normalized;
  }

  return mapping;
}

function parseDecimal(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parseIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

function hasRequiredMapping(mapping: CommissionUploadMapping) {
  const missing = REQUIRED_MAPPING_FIELDS.filter((field) => !mapping[field]);
  const hasAccountIdentifier = ACCOUNT_IDENTIFIER_MAPPING_FIELDS.some(
    (field) => Boolean(mapping[field])
  );

  if (!hasAccountIdentifier) {
    missing.push("account_number");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

function mapTemplateRows(rows: Record<string, unknown>[] | null): UploadTemplateOption[] {
  if (!rows) {
    return [];
  }

  return rows
    .map((row) => {
      const templateId = String(row.template_id ?? "").trim();
      const templateName = String(row.template_name ?? "").trim();
      const broker = String(row.broker ?? "").trim();

      if (!templateId || !templateName || !broker) {
        return null;
      }

      return {
        template_id: templateId,
        template_name: templateName,
        broker,
        mappings: normalizeMapping(row.mappings),
        is_default: Boolean(row.is_default),
      } satisfies UploadTemplateOption;
    })
    .filter((item): item is UploadTemplateOption => Boolean(item));
}

async function loadBrokerTemplates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  broker: string
) {
  const { data, error } = await supabase
    .from("commission_import_templates")
    .select("template_id,template_name,broker,mappings,is_default,updated_at")
    .eq("broker", broker)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingColumnError(error.message)) {
      return [];
    }

    return [];
  }

  return mapTemplateRows((data as Record<string, unknown>[] | null) ?? null);
}

async function findDuplicateUploadBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  broker: string,
  fingerprint: string
) {
  const { data, error } = await supabase
    .from("commission_batches")
    .select("batch_id,status")
    .eq("broker", broker)
    .eq("upload_fingerprint", fingerprint)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error.message)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    batchId: String((data as Record<string, unknown>).batch_id ?? "").trim(),
    status: String((data as Record<string, unknown>).status ?? "").trim().toLowerCase(),
  };
}

async function createCommissionUploadBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    broker: string;
    sourceFile: string;
    rowCount: number;
    sourceColumns: string[];
    fingerprint: string;
  }
) {
  const nowIso = new Date().toISOString();
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      broker: params.broker,
      source_file: params.sourceFile,
      import_date: nowIso,
      imported_at: nowIso,
      record_count: params.rowCount,
      status: "imported",
      validation_result: "review",
      duplicate_result: "review",
      simulation_status: "pending",
      simulation_completed_at: null,
      environment: "test",
      upload_fingerprint: params.fingerprint,
      upload_row_count: params.rowCount,
      source_columns: params.sourceColumns,
      mapping_status: "pending",
      mapping_template_id: null,
      mapping_completed_at: null,
      total_commission: 0,
      success_rows: 0,
      failed_rows: 0,
      error_count: 0,
    },
    {
      broker: params.broker,
      source_file: params.sourceFile,
      import_date: nowIso,
      imported_at: nowIso,
      record_count: params.rowCount,
      status: "imported",
      environment: "test",
      total_commission: 0,
      success_rows: 0,
      failed_rows: 0,
      error_count: 0,
    },
  ];

  let lastError = "Unable to create commission upload batch.";

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .insert(payload)
      .select("batch_id")
      .single();

    if (!error && data) {
      return String((data as Record<string, unknown>).batch_id ?? "").trim();
    }

    if (error) {
      lastError = error.message;

      if (!isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  throw new Error(lastError);
}

async function insertStagingRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string,
  broker: string,
  rows: ParsedCsvRow[]
) {
  const stagedRows: Array<Record<string, unknown>> = rows.map((row) => ({
    batch_id: batchId,
    row_number: row.rowNumber,
    raw_row: row.raw,
    broker,
    mapping_status: "pending",
    mapping_error: null,
  }));

  for (const chunk of chunkArray(stagedRows, 500)) {
    const { error } = await supabase.from("commission_batch_staging_rows").insert(chunk);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function uploadCommissionCsv(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const broker = String(formData.get("broker") ?? "").trim();
  const source = formData.get("commission_file");

  if (!broker) {
    return { error: "Broker is required." };
  }

  if (!(source instanceof File)) {
    return { error: "Commission file is required." };
  }

  const fileName = source.name.trim();
  if (!fileName) {
    return { error: "Commission file name is invalid." };
  }

  const fileExtension = getFileExtension(fileName);
  if (!SUPPORTED_COMMISSION_UPLOAD_EXTENSIONS.has(fileExtension)) {
    return { error: "Unsupported file format. Please upload CSV, XLSX, or XLS files." };
  }

  let parsed: ParsedCsvResult;
  let fingerprint: string;

  try {
    const fileBuffer = Buffer.from(await source.arrayBuffer());
    parsed = parseCommissionUploadContent(fileName, fileBuffer);
    fingerprint = createHash("sha256").update(fileBuffer).digest("hex");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to parse uploaded file.",
    };
  }

  const supabase = await createClient();

  try {
    const duplicateBatch = await findDuplicateUploadBatch(supabase, broker, fingerprint);
    if (duplicateBatch?.batchId) {
      return {
        error: `Duplicate file detected. Existing batch ${duplicateBatch.batchId} is already registered for this broker.`,
        duplicateBatchId: duplicateBatch.batchId,
      };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Unable to verify duplicate upload fingerprint: ${error.message}`
          : "Unable to verify duplicate upload fingerprint.",
    };
  }

  let batchId = "";

  try {
    batchId = await createCommissionUploadBatch(supabase, {
      broker,
      sourceFile: fileName,
      rowCount: parsed.rows.length,
      sourceColumns: parsed.headers,
      fingerprint,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create commission upload batch.",
    };
  }

  try {
    await insertStagingRows(supabase, batchId, broker, parsed.rows);
  } catch (error) {
    await supabase.from("commission_batches").delete().eq("batch_id", batchId);
    return {
      error:
        error instanceof Error
          ? `Failed to stage uploaded rows: ${error.message}`
          : "Failed to stage uploaded rows.",
    };
  }

  const templates = await loadBrokerTemplates(supabase, broker);

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");

  return {
    success: `Batch ${batchId} uploaded into staging. Continue with template mapping before validation.`,
    batchId,
    uploadedFileName: fileName,
    rowCount: parsed.rows.length,
    sourceColumns: parsed.headers,
    uploadFingerprint: fingerprint,
    availableTemplates: templates,
  };
}

function getMappedValue(rawRow: Record<string, string>, sourceColumn: string | undefined) {
  if (!sourceColumn) {
    return null;
  }

  const value = rawRow[sourceColumn];
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function buildMappingUpdateRows(params: {
  batchId: string;
  broker: string;
  stagingRows: StagingRow[];
  mapping: CommissionUploadMapping;
}) {
  const updates: MappingUpdateRow[] = [];
  let mappedRows = 0;
  let failedRows = 0;

  for (const stagingRow of params.stagingRows) {
    const rawRow = stagingRow.raw_row;
    const errors: string[] = [];

    const accountId = getMappedValue(rawRow, params.mapping.account_id);
    const accountNumber = getMappedValue(rawRow, params.mapping.account_number);
    const commissionAmountRaw = getMappedValue(rawRow, params.mapping.commission_amount);
    const commissionDateRaw = getMappedValue(rawRow, params.mapping.commission_date);
    const volumeRaw = getMappedValue(rawRow, params.mapping.volume);
    const symbol = getMappedValue(rawRow, params.mapping.symbol);
    const currency = getMappedValue(rawRow, params.mapping.currency);
    const accountType = getMappedValue(rawRow, params.mapping.account_type);

    if (!accountId && !accountNumber) {
      errors.push("Missing account_id/account_number");
    }

    const commissionAmount = parseDecimal(commissionAmountRaw);
    if (commissionAmountRaw === null || commissionAmount === null) {
      errors.push("Invalid commission_amount");
    }

    const commissionDate = parseIsoDate(commissionDateRaw);
    if (commissionDateRaw === null || commissionDate === null) {
      errors.push("Invalid commission_date");
    }

    const volume = parseDecimal(volumeRaw);
    if (volumeRaw !== null && volume === null) {
      errors.push("Invalid volume");
    }

    const mappingStatus: "mapped" | "failed" = errors.length > 0 ? "failed" : "mapped";
    if (mappingStatus === "mapped") {
      mappedRows += 1;
    } else {
      failedRows += 1;
    }

    updates.push({
      batch_id: params.batchId,
      row_number: stagingRow.row_number,
      raw_row: rawRow,
      broker: params.broker,
      account_id: accountId,
      account_number: accountNumber,
      commission_amount: commissionAmount,
      commission_date: commissionDate,
      volume,
      symbol,
      currency,
      account_type: accountType,
      mapping_status: mappingStatus,
      mapping_error: errors.length > 0 ? errors.join(" | ") : null,
    });
  }

  return { updates, mappedRows, failedRows };
}

async function upsertStagingMappingRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: MappingUpdateRow[]
) {
  for (const chunk of chunkArray(rows, 500)) {
    const payload = chunk.map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("commission_batch_staging_rows")
      .upsert(payload, { onConflict: "batch_id,row_number" });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function maybeSaveMappingTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    broker: string;
    mapping: CommissionUploadMapping;
    saveTemplate: boolean;
    templateName: string;
    setDefault: boolean;
  }
) {
  if (!params.saveTemplate) {
    return null;
  }

  const normalizedTemplateName = params.templateName.trim();
  if (!normalizedTemplateName) {
    throw new Error("Template name is required when saving mapping template.");
  }

  if (params.setDefault) {
    await supabase
      .from("commission_import_templates")
      .update({ is_default: false })
      .eq("broker", params.broker);
  }

  const { data, error } = await supabase
    .from("commission_import_templates")
    .upsert(
      {
        broker: params.broker,
        template_name: normalizedTemplateName,
        mappings: params.mapping,
        required_fields: [...REQUIRED_MAPPING_FIELDS, "account_number"],
        is_default: params.setDefault,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "broker,template_name" }
    )
    .select("template_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return String((data as Record<string, unknown>).template_id ?? "").trim() || null;
}

export async function applyCommissionMappingTemplateAction(
  _prevState: MappingActionState,
  formData: FormData
): Promise<MappingActionState> {
  const batchId = String(formData.get("batch_id") ?? "").trim();
  const broker = String(formData.get("broker") ?? "").trim();
  const selectedTemplateId = String(formData.get("template_id") ?? "").trim();
  const mappingJson = String(formData.get("mapping_json") ?? "").trim();
  const templateName = String(formData.get("template_name") ?? "").trim();
  const saveTemplate = String(formData.get("save_template") ?? "").trim().toLowerCase() === "true";
  const setDefaultTemplate =
    String(formData.get("set_default_template") ?? "").trim().toLowerCase() === "true";

  if (!batchId) {
    return { error: "Batch ID is required for mapping.", batchId };
  }

  if (!broker) {
    return { error: "Broker is required for mapping.", batchId };
  }

  if (!mappingJson) {
    return { error: "Mapping payload is required.", batchId };
  }

  let mapping: CommissionUploadMapping;

  try {
    mapping = normalizeMapping(JSON.parse(mappingJson) as unknown);
  } catch {
    return { error: "Mapping payload JSON is invalid.", batchId };
  }

  const mappingValidation = hasRequiredMapping(mapping);
  if (!mappingValidation.valid) {
    return {
      error: `Required mapping is incomplete. Missing: ${mappingValidation.missing.join(", ")}.`,
      batchId,
    };
  }

  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("batch_id,broker,status")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (batchError) {
    return { error: `Unable to load batch ${batchId}: ${batchError.message}`, batchId };
  }

  if (!batch) {
    return { error: `Batch ${batchId} not found.`, batchId };
  }

  const currentStatus = String((batch as Record<string, unknown>).status ?? "")
    .trim()
    .toLowerCase();
  if (currentStatus === "confirmed" || currentStatus === "locked") {
    return {
      error: `Batch ${batchId} is ${currentStatus} and cannot be remapped.`,
      batchId,
    };
  }

  const { data: stagingRows, error: stagingError } = await supabase
    .from("commission_batch_staging_rows")
    .select("row_number,raw_row")
    .eq("batch_id", batchId)
    .order("row_number", { ascending: true });

  if (stagingError) {
    return {
      error: `Unable to load staging rows for batch ${batchId}: ${stagingError.message}`,
      batchId,
    };
  }

  const normalizedStagingRows: StagingRow[] = ((stagingRows ?? []) as Record<string, unknown>[])
    .map((row) => {
      const rowNumber = Number(row.row_number);
      const rawRow = row.raw_row;

      if (!Number.isFinite(rowNumber) || !isRecord(rawRow)) {
        return null;
      }

      const normalizedRawRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        normalizedRawRow[key] = String(value ?? "");
      }

      return {
        row_number: rowNumber,
        raw_row: normalizedRawRow,
      } satisfies StagingRow;
    })
    .filter((row): row is StagingRow => Boolean(row));

  if (normalizedStagingRows.length === 0) {
    return {
      error: `Batch ${batchId} has no staging rows to map.`,
      batchId,
    };
  }

  const mapped = buildMappingUpdateRows({
    batchId,
    broker,
    stagingRows: normalizedStagingRows,
    mapping,
  });

  try {
    await upsertStagingMappingRows(supabase, mapped.updates);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Failed to persist mapped staging rows: ${error.message}`
          : "Failed to persist mapped staging rows.",
      batchId,
    };
  }

  let persistedTemplateId: string | null = null;

  try {
    persistedTemplateId = await maybeSaveMappingTemplate(supabase, {
      broker,
      mapping,
      saveTemplate,
      templateName,
      setDefault: setDefaultTemplate,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Mapped rows saved, but template save failed: ${error.message}`
          : "Mapped rows saved, but template save failed.",
      batchId,
      mappedRows: mapped.mappedRows,
      failedRows: mapped.failedRows,
      mappingStatus: mapped.failedRows > 0 ? "failed" : "mapped",
    };
  }

  const templateIdForBatch =
    persistedTemplateId ||
    (UUID_REGEX.test(selectedTemplateId) ? selectedTemplateId : null);

  const { error: batchUpdateError } = await supabase
    .from("commission_batches")
    .update({
      mapping_status: mapped.failedRows > 0 ? "failed" : "mapped",
      mapping_template_id: templateIdForBatch,
      mapping_completed_at: new Date().toISOString(),
      status: "imported",
    })
    .eq("batch_id", batchId);

  if (batchUpdateError && !isMissingColumnError(batchUpdateError.message)) {
    return {
      error: `Mapped rows saved, but batch mapping status update failed: ${batchUpdateError.message}`,
      batchId,
      mappedRows: mapped.mappedRows,
      failedRows: mapped.failedRows,
      mappingStatus: mapped.failedRows > 0 ? "failed" : "mapped",
    };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${batchId}`);

  return {
    success:
      mapped.failedRows > 0
        ? `Mapping applied to batch ${batchId}. ${mapped.mappedRows} rows mapped, ${mapped.failedRows} rows flagged for validation fixes.`
        : `Mapping applied to batch ${batchId}. ${mapped.mappedRows} rows mapped and ready for validation step.`,
    batchId,
    mappedRows: mapped.mappedRows,
    failedRows: mapped.failedRows,
    mappingStatus: mapped.failedRows > 0 ? "failed" : "mapped",
    templateId: templateIdForBatch ?? undefined,
  };
}

type ValidationIssueLevel = "warning" | "error";
type ValidationLevel = "pending" | "valid" | "warning" | "error";

type ValidationIssue = {
  code: string;
  level: ValidationIssueLevel;
  field: string | null;
  message: string;
};

type ValidationCategoryCount = {
  code: string;
  count: number;
};

type ValidationSummary = {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  excludedRows: number;
  duplicateRows: number;
  topErrorCategories: ValidationCategoryCount[];
  topWarningCategories: ValidationCategoryCount[];
};

type ValidationActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  summary?: ValidationSummary;
};

type ValidationStagingRow = {
  row_number: number;
  raw_row: Record<string, string>;
  mapping_status: string;
  mapping_error: string | null;
  broker: string | null;
  account_id: string | null;
  account_number: string | null;
  commission_amount: number | null;
  commission_date: string | null;
  volume: number | null;
  symbol: string | null;
  currency: string | null;
  account_type: string | null;
  excluded_from_downstream: boolean;
  resolution_status: string;
  resolution_notes: string | null;
  override_payload: Record<string, unknown>;
  resolved_by: string | null;
  resolved_at: string | null;
};

type TradingAccountLookupRow = {
  account_id: string;
  account_number: string | null;
  user_id: string | null;
  broker: string | null;
};

type ValidationComputedRow = ValidationStagingRow & {
  batch_id: string;
  validation_level: ValidationLevel;
  validation_issues: ValidationIssue[];
  resolved_account_id: string | null;
  resolved_trader_user_id: string | null;
  duplicate_key: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeOptionalText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeNumeric(value: unknown) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeIsoDate(value: unknown) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

function normalizeCurrency(value: string | null) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return { currency: null, issue: null as ValidationIssue | null };
  }

  const upper = normalized.toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) {
    return {
      currency: upper,
      issue: {
        code: "currency_format_unrecognized",
        level: "warning" as const,
        field: "currency",
        message: "Currency should be a 3-letter ISO code.",
      },
    };
  }

  return { currency: upper, issue: null as ValidationIssue | null };
}

function normalizeAccountType(value: string | null) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return { accountType: null, issue: null as ValidationIssue | null };
  }

  const lower = normalized.toLowerCase();
  const mapped =
    lower === "std" || lower === "standard"
      ? "standard"
      : lower === "raw" || lower === "ecn"
      ? "raw"
      : lower === "pro" || lower === "professional"
      ? "pro"
      : lower;

  if (!["standard", "raw", "pro"].includes(mapped)) {
    return {
      accountType: mapped,
      issue: {
        code: "account_type_unrecognized",
        level: "warning" as const,
        field: "account_type",
        message: "Account type is outside the normalized known set.",
      },
    };
  }

  return { accountType: mapped, issue: null as ValidationIssue | null };
}

function buildValidationIssue(
  code: string,
  level: ValidationIssueLevel,
  message: string,
  field: string | null = null
): ValidationIssue {
  return {
    code,
    level,
    field,
    message,
  };
}

function parseValidationIssues(value: unknown): ValidationIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const code = normalizeText(item.code);
      const level = normalizeText(item.level).toLowerCase();
      const message = normalizeText(item.message);
      const field = normalizeOptionalText(item.field);

      if (!code || !message || (level !== "warning" && level !== "error")) {
        return null;
      }

      return {
        code,
        level: level as ValidationIssueLevel,
        message,
        field,
      } satisfies ValidationIssue;
    })
    .filter((item): item is ValidationIssue => Boolean(item));
}

function determineValidationLevel(issues: ValidationIssue[]): ValidationLevel {
  if (issues.some((issue) => issue.level === "error")) {
    return "error";
  }

  if (issues.some((issue) => issue.level === "warning")) {
    return "warning";
  }

  return "valid";
}

function mapValidationStagingRows(rows: Record<string, unknown>[] | null): ValidationStagingRow[] {
  if (!rows) {
    return [];
  }

  return rows
    .map((row) => {
      const rowNumber = Number(row.row_number);
      const rawRow = row.raw_row;

      if (!Number.isFinite(rowNumber) || !isRecord(rawRow)) {
        return null;
      }

      const normalizedRawRow: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        normalizedRawRow[key] = String(value ?? "");
      }

      return {
        row_number: rowNumber,
        raw_row: normalizedRawRow,
        mapping_status: normalizeText(row.mapping_status).toLowerCase() || "pending",
        mapping_error: normalizeOptionalText(row.mapping_error),
        broker: normalizeOptionalText(row.broker),
        account_id: normalizeOptionalText(row.account_id),
        account_number: normalizeOptionalText(row.account_number),
        commission_amount: normalizeNumeric(row.commission_amount),
        commission_date: normalizeOptionalText(row.commission_date),
        volume: normalizeNumeric(row.volume),
        symbol: normalizeOptionalText(row.symbol),
        currency: normalizeOptionalText(row.currency),
        account_type: normalizeOptionalText(row.account_type),
        excluded_from_downstream: Boolean(row.excluded_from_downstream),
        resolution_status: normalizeText(row.resolution_status).toLowerCase() || "pending",
        resolution_notes: normalizeOptionalText(row.resolution_notes),
        override_payload: isRecord(row.override_payload) ? row.override_payload : {},
        resolved_by: normalizeOptionalText(row.resolved_by),
        resolved_at: normalizeOptionalText(row.resolved_at),
      } satisfies ValidationStagingRow;
    })
    .filter((row): row is ValidationStagingRow => Boolean(row));
}

function pushLookupRow(
  map: Map<string, TradingAccountLookupRow[]>,
  key: string,
  row: TradingAccountLookupRow
) {
  const bucket = map.get(key) ?? [];
  bucket.push(row);
  map.set(key, bucket);
}

function dedupeTradingAccountRows(rows: TradingAccountLookupRow[]) {
  const seen = new Set<string>();
  const deduped: TradingAccountLookupRow[] = [];

  for (const row of rows) {
    const dedupeKey = [
      row.account_id.toLowerCase(),
      (row.account_number ?? "").toLowerCase(),
      (row.user_id ?? "").toLowerCase(),
      (row.broker ?? "").toLowerCase(),
    ].join("|");

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    deduped.push(row);
  }

  return deduped;
}

async function loadTradingAccountLookup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ValidationStagingRow[]
) {
  const accountIdSet = new Set<string>();
  const accountNumberSet = new Set<string>();

  for (const row of rows) {
    if (row.account_id) {
      accountIdSet.add(row.account_id);
    }

    if (row.account_number) {
      accountNumberSet.add(row.account_number);
    }
  }

  const accountIds = [...accountIdSet];
  const accountNumbers = [...accountNumberSet];
  let fetchedRows: TradingAccountLookupRow[] = [];

  if (accountIds.length > 0) {
    const { data, error } = await supabase
      .from("trading_accounts")
      .select("account_id,account_number,user_id,broker")
      .in("account_id", accountIds);

    if (error) {
      throw new Error(error.message);
    }

    fetchedRows = fetchedRows.concat(
      ((data as Record<string, unknown>[] | null) ?? [])
        .map((row) => {
          const accountId = normalizeOptionalText(row.account_id);
          if (!accountId) {
            return null;
          }

          return {
            account_id: accountId,
            account_number: normalizeOptionalText(row.account_number),
            user_id: normalizeOptionalText(row.user_id),
            broker: normalizeOptionalText(row.broker),
          } satisfies TradingAccountLookupRow;
        })
        .filter((row): row is TradingAccountLookupRow => Boolean(row))
    );
  }

  if (accountNumbers.length > 0) {
    const { data, error } = await supabase
      .from("trading_accounts")
      .select("account_id,account_number,user_id,broker")
      .in("account_number", accountNumbers);

    if (error) {
      throw new Error(error.message);
    }

    fetchedRows = fetchedRows.concat(
      ((data as Record<string, unknown>[] | null) ?? [])
        .map((row) => {
          const accountId = normalizeOptionalText(row.account_id);
          if (!accountId) {
            return null;
          }

          return {
            account_id: accountId,
            account_number: normalizeOptionalText(row.account_number),
            user_id: normalizeOptionalText(row.user_id),
            broker: normalizeOptionalText(row.broker),
          } satisfies TradingAccountLookupRow;
        })
        .filter((row): row is TradingAccountLookupRow => Boolean(row))
    );
  }

  const dedupedRows = dedupeTradingAccountRows(fetchedRows);
  const byAccountId = new Map<string, TradingAccountLookupRow[]>();
  const byAccountNumber = new Map<string, TradingAccountLookupRow[]>();

  for (const row of dedupedRows) {
    pushLookupRow(byAccountId, row.account_id.toLowerCase(), row);
    if (row.account_number) {
      pushLookupRow(byAccountNumber, row.account_number.toLowerCase(), row);
    }
  }

  return {
    byAccountId,
    byAccountNumber,
  };
}

function resolveTradingAccount(params: {
  row: ValidationStagingRow;
  broker: string | null;
  byAccountId: Map<string, TradingAccountLookupRow[]>;
  byAccountNumber: Map<string, TradingAccountLookupRow[]>;
}) {
  const issues: ValidationIssue[] = [];
  const accountId = params.row.account_id?.toLowerCase() ?? "";
  const accountNumber = params.row.account_number?.toLowerCase() ?? "";
  const brokerLower = params.broker?.toLowerCase() ?? "";

  const accountIdMatches = accountId ? params.byAccountId.get(accountId) ?? [] : [];
  const accountNumberMatches = accountNumber
    ? params.byAccountNumber.get(accountNumber) ?? []
    : [];

  if (!accountId && !accountNumber) {
    issues.push(
      buildValidationIssue(
        "missing_account_identifier",
        "error",
        "Account identifier is required.",
        "account_number"
      )
    );
    return {
      resolvedAccount: null,
      issues,
    };
  }

  let candidateRows: TradingAccountLookupRow[] = [];

  if (accountIdMatches.length > 0 && accountNumberMatches.length > 0) {
    const idSet = new Set(accountIdMatches.map((row) => row.account_id.toLowerCase()));
    const overlap = accountNumberMatches.filter((row) => idSet.has(row.account_id.toLowerCase()));

    if (overlap.length === 0) {
      issues.push(
        buildValidationIssue(
          "account_identifier_mismatch",
          "error",
          "account_id and account_number point to different trading accounts.",
          "account_id"
        )
      );
      return {
        resolvedAccount: null,
        issues,
      };
    }

    candidateRows = overlap;
  } else if (accountIdMatches.length > 0) {
    candidateRows = accountIdMatches;
  } else if (accountNumberMatches.length > 0) {
    candidateRows = accountNumberMatches;
  }

  if (candidateRows.length === 0) {
    issues.push(
      buildValidationIssue(
        "account_not_found",
        "error",
        "Trading account could not be resolved from the mapped identifier.",
        "account_number"
      )
    );
    return {
      resolvedAccount: null,
      issues,
    };
  }

  if (brokerLower) {
    const brokerMatched = candidateRows.filter(
      (row) => normalizeText(row.broker).toLowerCase() === brokerLower
    );

    if (brokerMatched.length === 1) {
      return {
        resolvedAccount: brokerMatched[0],
        issues,
      };
    }

    if (brokerMatched.length > 1) {
      issues.push(
        buildValidationIssue(
          "ambiguous_account_resolution",
          "error",
          "Multiple trading accounts matched this broker + account combination.",
          "account_number"
        )
      );
      return {
        resolvedAccount: null,
        issues,
      };
    }

    if (candidateRows.length === 1) {
      issues.push(
        buildValidationIssue(
          "broker_account_mismatch",
          "error",
          "Mapped broker does not match the resolved trading account broker.",
          "broker"
        )
      );
      return {
        resolvedAccount: null,
        issues,
      };
    }
  }

  if (candidateRows.length === 1) {
    return {
      resolvedAccount: candidateRows[0],
      issues,
    };
  }

  issues.push(
    buildValidationIssue(
      "ambiguous_account_resolution",
      "error",
      "Multiple trading accounts matched; add broker/account precision before simulation.",
      "account_number"
    )
  );

  return {
    resolvedAccount: null,
    issues,
  };
}

function buildDuplicateKey(params: {
  broker: string | null;
  resolvedAccountId: string | null;
  row: ValidationStagingRow;
}) {
  const brokerKey = normalizeText(params.broker).toLowerCase();
  const accountKey = normalizeText(
    params.resolvedAccountId ?? params.row.account_id ?? params.row.account_number
  ).toLowerCase();
  const commissionAmount = params.row.commission_amount;
  const commissionDateIso = normalizeIsoDate(params.row.commission_date);

  if (!brokerKey || !accountKey || commissionAmount === null || !commissionDateIso) {
    return null;
  }

  const symbolKey = normalizeText(params.row.symbol).toUpperCase();
  const currencyKey = normalizeText(params.row.currency).toUpperCase();

  return [
    brokerKey,
    accountKey,
    commissionDateIso,
    commissionAmount.toFixed(8),
    symbolKey,
    currencyKey,
  ].join("|");
}

function countIssueCategories(issuesByRow: ValidationIssue[][], level: ValidationIssueLevel) {
  const counts = new Map<string, number>();

  for (const rowIssues of issuesByRow) {
    for (const issue of rowIssues) {
      if (issue.level !== level) {
        continue;
      }

      counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

async function upsertValidationRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: ValidationComputedRow[]
) {
  const timestamp = new Date().toISOString();

  for (const chunk of chunkArray(rows, 500)) {
    const payload = chunk.map((row) => ({
      batch_id: row.batch_id,
      row_number: row.row_number,
      raw_row: row.raw_row,
      mapping_status: row.mapping_status,
      mapping_error: row.mapping_error,
      broker: row.broker,
      account_id: row.account_id,
      account_number: row.account_number,
      commission_amount: row.commission_amount,
      commission_date: row.commission_date,
      volume: row.volume,
      symbol: row.symbol,
      currency: row.currency,
      account_type: row.account_type,
      excluded_from_downstream: row.excluded_from_downstream,
      resolution_status: row.resolution_status,
      resolution_notes: row.resolution_notes,
      override_payload: row.override_payload,
      resolved_by: row.resolved_by,
      resolved_at: row.resolved_at,
      validation_level: row.validation_level,
      validation_issues: row.validation_issues,
      resolved_account_id: row.resolved_account_id,
      resolved_trader_user_id: row.resolved_trader_user_id,
      duplicate_key: row.duplicate_key,
      validation_run_at: timestamp,
      updated_at: timestamp,
    }));

    const { error } = await supabase
      .from("commission_batch_staging_rows")
      .upsert(payload, { onConflict: "batch_id,row_number" });

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function persistBatchValidationSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    batchId: string;
    summary: ValidationSummary;
  }
) {
  const nowIso = new Date().toISOString();

  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      validation_summary: {
        total_rows: params.summary.totalRows,
        valid_rows: params.summary.validRows,
        warning_rows: params.summary.warningRows,
        error_rows: params.summary.errorRows,
        excluded_rows: params.summary.excludedRows,
        duplicate_rows: params.summary.duplicateRows,
        top_error_categories: params.summary.topErrorCategories,
        top_warning_categories: params.summary.topWarningCategories,
      },
      validation_completed_at: nowIso,
      validation_result: params.summary.errorRows > 0 ? "failed" : "passed",
      duplicate_result: params.summary.duplicateRows > 0 ? "review" : "clear",
      resolution_status: params.summary.errorRows > 0 ? "in_progress" : "completed",
      resolution_summary: {
        unresolved_error_rows: params.summary.errorRows,
        excluded_rows: params.summary.excludedRows,
      },
      success_rows: params.summary.validRows + params.summary.warningRows,
      failed_rows: params.summary.errorRows,
      error_count: params.summary.errorRows,
      simulation_status: "pending",
      simulation_completed_at: null,
      updated_at: nowIso,
    },
    {
      validation_result: params.summary.errorRows > 0 ? "failed" : "passed",
      duplicate_result: params.summary.duplicateRows > 0 ? "review" : "clear",
      resolution_status: params.summary.errorRows > 0 ? "in_progress" : "completed",
      success_rows: params.summary.validRows + params.summary.warningRows,
      failed_rows: params.summary.errorRows,
      error_count: params.summary.errorRows,
      simulation_status: "pending",
      simulation_completed_at: null,
      updated_at: nowIso,
    },
    {
      validation_result: params.summary.errorRows > 0 ? "failed" : "passed",
      duplicate_result: params.summary.duplicateRows > 0 ? "review" : "clear",
      resolution_status: params.summary.errorRows > 0 ? "in_progress" : "completed",
    },
  ];

  let lastError = `Unable to persist validation summary for batch ${params.batchId}.`;

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", params.batchId)
      .select("batch_id")
      .maybeSingle();

    if (!error && data) {
      return;
    }

    if (error) {
      lastError = error.message;
      if (!isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  throw new Error(lastError);
}

export async function runCommissionBatchValidationAction(
  _prevState: ValidationActionState,
  formData: FormData
): Promise<ValidationActionState> {
  const batchId = normalizeText(formData.get("batch_id"));

  if (!batchId) {
    return { error: "Batch ID is required for validation." };
  }

  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("batch_id,broker,status,mapping_status")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (batchError) {
    return { error: `Unable to load batch ${batchId}: ${batchError.message}`, batchId };
  }

  if (!batch) {
    return { error: `Batch ${batchId} not found.`, batchId };
  }

  const batchStatus = normalizeText((batch as Record<string, unknown>).status).toLowerCase();
  if (["confirmed", "locked", "cancelled", "rolled_back"].includes(batchStatus)) {
    return {
      error: `Batch ${batchId} is ${batchStatus} and cannot run staging validation.`,
      batchId,
    };
  }

  const batchBroker = normalizeOptionalText((batch as Record<string, unknown>).broker);
  const mappingStatus = normalizeText((batch as Record<string, unknown>).mapping_status).toLowerCase();
  if (mappingStatus === "pending") {
    return {
      error: `Batch ${batchId} mapping is still pending. Apply template mapping before validation.`,
      batchId,
    };
  }

  const { data: stagingRowsRaw, error: stagingRowsError } = await supabase
    .from("commission_batch_staging_rows")
    .select(
      "row_number,raw_row,mapping_status,mapping_error,broker,account_id,account_number,commission_amount,commission_date,volume,symbol,currency,account_type,excluded_from_downstream,resolution_status,resolution_notes,override_payload,resolved_by,resolved_at"
    )
    .eq("batch_id", batchId)
    .order("row_number", { ascending: true });

  if (stagingRowsError) {
    return {
      error: isMissingColumnError(stagingRowsError.message)
        ? "Validation/resolution columns are missing. Run migrations: 20260328_commission_staging_validation_engine.sql and 20260328_commission_resolution_simulation_staging.sql."
        : `Unable to load staging rows for ${batchId}: ${stagingRowsError.message}`,
      batchId,
    };
  }

  const stagingRows = mapValidationStagingRows(
    (stagingRowsRaw as Record<string, unknown>[] | null) ?? null
  );

  if (stagingRows.length === 0) {
    return { error: `Batch ${batchId} has no staging rows for validation.`, batchId };
  }

  let accountLookup:
    | {
        byAccountId: Map<string, TradingAccountLookupRow[]>;
        byAccountNumber: Map<string, TradingAccountLookupRow[]>;
      }
    | null = null;

  try {
    accountLookup = await loadTradingAccountLookup(supabase, stagingRows);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Unable to load trading account references for validation: ${error.message}`
          : "Unable to load trading account references for validation.",
      batchId,
    };
  }

  const computedRows: ValidationComputedRow[] = stagingRows.map((row) => {
    const issues: ValidationIssue[] = [];
    const normalizedBroker = normalizeOptionalText(row.broker) ?? batchBroker;

    if (row.excluded_from_downstream) {
      const excludedIssue = buildValidationIssue(
        "excluded_from_downstream",
        "warning",
        "Row is intentionally excluded from downstream simulation/approval.",
        "excluded_from_downstream"
      );

      return {
        ...row,
        batch_id: batchId,
        broker: normalizedBroker,
        commission_date: normalizeIsoDate(row.commission_date),
        currency: normalizeCurrency(row.currency).currency,
        account_type: normalizeAccountType(row.account_type).accountType,
        resolved_account_id: null,
        resolved_trader_user_id: null,
        duplicate_key: null,
        validation_issues: [excludedIssue],
        validation_level: "warning",
      } satisfies ValidationComputedRow;
    }

    if (!normalizedBroker) {
      issues.push(buildValidationIssue("missing_broker", "error", "Broker is required.", "broker"));
    }

    if (row.mapping_status !== "mapped") {
      issues.push(
        buildValidationIssue(
          "mapping_incomplete",
          "error",
          row.mapping_error ??
            "Row is not fully mapped. Complete source mapping before validation.",
          "mapping_status"
        )
      );
    }

    if (row.commission_amount === null) {
      issues.push(
        buildValidationIssue(
          "invalid_commission_amount",
          "error",
          "commission_amount must be numeric.",
          "commission_amount"
        )
      );
    }

    const commissionDateIso = normalizeIsoDate(row.commission_date);
    if (!commissionDateIso) {
      issues.push(
        buildValidationIssue(
          "invalid_commission_date",
          "error",
          "commission_date must be parseable.",
          "commission_date"
        )
      );
    }

    if (row.volume !== null && !Number.isFinite(row.volume)) {
      issues.push(
        buildValidationIssue("invalid_volume", "error", "volume must be numeric.", "volume")
      );
    }

    const normalizedCurrency = normalizeCurrency(row.currency);
    if (normalizedCurrency.issue) {
      issues.push(normalizedCurrency.issue);
    }

    const normalizedAccountType = normalizeAccountType(row.account_type);
    if (normalizedAccountType.issue) {
      issues.push(normalizedAccountType.issue);
    }

    const accountResolution = resolveTradingAccount({
      row,
      broker: normalizedBroker,
      byAccountId: accountLookup.byAccountId,
      byAccountNumber: accountLookup.byAccountNumber,
    });
    issues.push(...accountResolution.issues);

    return {
      ...row,
      batch_id: batchId,
      broker: normalizedBroker,
      commission_date: commissionDateIso,
      currency: normalizedCurrency.currency,
      account_type: normalizedAccountType.accountType,
      resolved_account_id: accountResolution.resolvedAccount?.account_id ?? null,
      resolved_trader_user_id: accountResolution.resolvedAccount?.user_id ?? null,
      duplicate_key: buildDuplicateKey({
        broker: normalizedBroker,
        resolvedAccountId: accountResolution.resolvedAccount?.account_id ?? null,
        row: {
          ...row,
          commission_date: commissionDateIso,
          currency: normalizedCurrency.currency,
        },
      }),
      validation_issues: issues,
      validation_level: determineValidationLevel(issues),
    } satisfies ValidationComputedRow;
  });

  const duplicateCountByKey = new Map<string, number>();
  for (const row of computedRows) {
    if (!row.duplicate_key) {
      continue;
    }

    duplicateCountByKey.set(row.duplicate_key, (duplicateCountByKey.get(row.duplicate_key) ?? 0) + 1);
  }

  const duplicatedKeys = new Set(
    [...duplicateCountByKey.entries()]
      .filter(([, count]) => count > 1)
      .map(([key]) => key)
  );

  const finalizedRows = computedRows.map((row) => {
    if (!row.duplicate_key || !duplicatedKeys.has(row.duplicate_key)) {
      return row;
    }

    const duplicateIssue = buildValidationIssue(
      "duplicate_business_key",
      "warning",
      "Likely duplicate business event within this upload batch.",
      "duplicate_key"
    );
    const nextIssues = [...row.validation_issues, duplicateIssue];

    return {
      ...row,
      validation_issues: nextIssues,
      validation_level: determineValidationLevel(nextIssues),
    };
  });

  const summary: ValidationSummary = {
    totalRows: finalizedRows.length,
    validRows: finalizedRows.filter((row) => row.validation_level === "valid").length,
    warningRows: finalizedRows.filter((row) => row.validation_level === "warning").length,
    errorRows: finalizedRows.filter((row) => row.validation_level === "error").length,
    excludedRows: finalizedRows.filter((row) =>
      row.validation_issues.some((issue) => issue.code === "excluded_from_downstream")
    ).length,
    duplicateRows: finalizedRows.filter((row) =>
      row.validation_issues.some((issue) => issue.code === "duplicate_business_key")
    ).length,
    topErrorCategories: countIssueCategories(
      finalizedRows.map((row) => row.validation_issues),
      "error"
    ),
    topWarningCategories: countIssueCategories(
      finalizedRows.map((row) => row.validation_issues),
      "warning"
    ),
  };

  try {
    await upsertValidationRows(supabase, finalizedRows);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to persist row-level validation results.";

    return {
      error: isMissingColumnError(message)
        ? `Validation storage columns are missing. Run migration supabase/migrations/20260328_commission_staging_validation_engine.sql first.`
        : `Failed to persist row-level validation results: ${message}`,
      batchId,
      summary,
    };
  }

  try {
    await persistBatchValidationSummary(supabase, { batchId, summary });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Row validation persisted, but batch summary update failed: ${error.message}`
          : "Row validation persisted, but batch summary update failed.",
      batchId,
      summary,
    };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${batchId}`);

  if (summary.errorRows > 0) {
    return {
      error: `Validation completed for batch ${batchId}: ${summary.errorRows} rows in error state, ${summary.warningRows} rows in warning state.`,
      batchId,
      summary,
    };
  }

  if (summary.warningRows > 0) {
    return {
      success: `Validation completed for batch ${batchId}: ${summary.validRows} valid rows, ${summary.warningRows} warning rows.`,
      batchId,
      summary,
    };
  }

  return {
    success: `Validation completed for batch ${batchId}: all ${summary.validRows} rows are valid for simulation preparation.`,
    batchId,
    summary,
  };
}

type ResolutionIssueGroup = {
  code: string;
  level: ValidationIssueLevel;
  count: number;
  rowNumbers: number[];
};

type ResolutionRowItem = {
  rowNumber: number;
  validationLevel: ValidationLevel;
  issues: ValidationIssue[];
  excludedFromDownstream: boolean;
  resolutionStatus: string;
  resolutionNotes: string | null;
  accountId: string | null;
  accountNumber: string | null;
  commissionAmount: number | null;
  commissionDate: string | null;
  volume: number | null;
  symbol: string | null;
  currency: string | null;
  accountType: string | null;
  resolvedAccountId: string | null;
  resolvedTraderUserId: string | null;
};

type ResolutionSnapshot = {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  excludedRows: number;
  resolvedRows: number;
  groups: ResolutionIssueGroup[];
  rows: ResolutionRowItem[];
};

type ResolutionLoadActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  snapshot?: ResolutionSnapshot;
};

type ResolutionSaveActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  rowNumber?: number;
};

type SimulationSummary = {
  totalRows: number;
  mappedRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  resolvedRows: number;
  eligibleRows: number;
  blockedRows: number;
  excludedRows: number;
  estimatedGrossCommission: number;
  estimatedPlatformTotal: number;
  estimatedL2Total: number;
  estimatedTraderTotal: number;
  estimatedL1Total: number;
  simulationBasisVersion: string;
  nextRequiredAction: string;
  topBlockers: ValidationCategoryCount[];
};

type SimulationActionState = {
  error?: string;
  success?: string;
  batchId?: string;
  summary?: SimulationSummary;
};

type SimulationStagingRow = {
  row_number: number;
  broker: string | null;
  account_id: string | null;
  account_number: string | null;
  commission_amount: number | null;
  commission_date: string | null;
  mapping_status: string;
  validation_level: ValidationLevel;
  validation_issues: ValidationIssue[];
  excluded_from_downstream: boolean;
  resolution_status: string;
  resolved_account_id: string | null;
  resolved_trader_user_id: string | null;
};

type SimulationRelationshipRow = Record<string, unknown>;

function roundFinancial(value: number) {
  return Math.round(value * 100_000_000) / 100_000_000;
}

function parseRateCandidate(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  if (parsed <= 1) {
    return parsed;
  }

  if (parsed <= 100) {
    return parsed / 100;
  }

  return null;
}

function parseDateMsSafe(value: unknown) {
  const parsed = Date.parse(normalizeText(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toResolutionRowItems(rows: Record<string, unknown>[] | null): ResolutionRowItem[] {
  if (!rows) {
    return [];
  }

  return rows
    .map((row) => {
      const rowNumber = Number(row.row_number);
      if (!Number.isFinite(rowNumber)) {
        return null;
      }

      const validationLevel = normalizeText(row.validation_level).toLowerCase() as ValidationLevel;
      const normalizedValidationLevel: ValidationLevel =
        validationLevel === "valid" ||
        validationLevel === "warning" ||
        validationLevel === "error" ||
        validationLevel === "pending"
          ? validationLevel
          : "pending";

      return {
        rowNumber,
        validationLevel: normalizedValidationLevel,
        issues: parseValidationIssues(row.validation_issues),
        excludedFromDownstream: Boolean(row.excluded_from_downstream),
        resolutionStatus: normalizeText(row.resolution_status).toLowerCase() || "pending",
        resolutionNotes: normalizeOptionalText(row.resolution_notes),
        accountId: normalizeOptionalText(row.account_id),
        accountNumber: normalizeOptionalText(row.account_number),
        commissionAmount: normalizeNumeric(row.commission_amount),
        commissionDate: normalizeOptionalText(row.commission_date),
        volume: normalizeNumeric(row.volume),
        symbol: normalizeOptionalText(row.symbol),
        currency: normalizeOptionalText(row.currency),
        accountType: normalizeOptionalText(row.account_type),
        resolvedAccountId: normalizeOptionalText(row.resolved_account_id),
        resolvedTraderUserId: normalizeOptionalText(row.resolved_trader_user_id),
      } satisfies ResolutionRowItem;
    })
    .filter((row): row is ResolutionRowItem => Boolean(row));
}

function buildResolutionSnapshot(rows: ResolutionRowItem[]): ResolutionSnapshot {
  const grouped = new Map<string, { level: ValidationIssueLevel; rowNumbers: number[] }>();

  for (const row of rows) {
    for (const issue of row.issues) {
      const entry = grouped.get(issue.code);
      if (!entry) {
        grouped.set(issue.code, {
          level: issue.level,
          rowNumbers: [row.rowNumber],
        });
        continue;
      }

      entry.rowNumbers.push(row.rowNumber);
      if (entry.level !== "error" && issue.level === "error") {
        entry.level = "error";
      }
    }
  }

  const groups: ResolutionIssueGroup[] = [...grouped.entries()]
    .map(([code, value]) => ({
      code,
      level: value.level,
      count: value.rowNumbers.length,
      rowNumbers: [...new Set(value.rowNumbers)].sort((a, b) => a - b),
    }))
    .sort((left, right) => {
      if (left.level !== right.level) {
        return left.level === "error" ? -1 : 1;
      }

      return right.count - left.count;
    });

  return {
    totalRows: rows.length,
    validRows: rows.filter((row) => row.validationLevel === "valid").length,
    warningRows: rows.filter((row) => row.validationLevel === "warning").length,
    errorRows: rows.filter((row) => row.validationLevel === "error").length,
    excludedRows: rows.filter((row) => row.excludedFromDownstream).length,
    resolvedRows: rows.filter((row) => row.resolutionStatus === "resolved").length,
    groups,
    rows,
  };
}

async function getCurrentOperatorId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return "admin";
  }

  return data.user?.id ?? "admin";
}

async function setBatchResolutionInProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
) {
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      resolution_status: "in_progress",
      resolution_completed_at: null,
      simulation_status: "pending",
      simulation_completed_at: null,
      updated_at: new Date().toISOString(),
    },
    {
      resolution_status: "in_progress",
      simulation_status: "pending",
      simulation_completed_at: null,
      updated_at: new Date().toISOString(),
    },
    {
      resolution_status: "in_progress",
    },
  ];

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", batchId)
      .select("batch_id")
      .maybeSingle();

    if (!error && data) {
      return;
    }

    if (error && !isMissingColumnError(error.message)) {
      throw new Error(error.message);
    }
  }
}

type ResolutionFieldChange = {
  old: string | number | boolean | null;
  new: string | number | boolean | null;
};

type ResolutionFieldChanges = Record<string, ResolutionFieldChange>;

function normalizeAuditValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  return String(value);
}

function areAuditValuesEqual(
  left: string | number | boolean | null,
  right: string | number | boolean | null
) {
  return left === right;
}

function buildResolutionFieldChanges(
  existingRow: Record<string, unknown> | null,
  nextValues: Record<string, unknown>
) {
  const changes: ResolutionFieldChanges = {};
  const safeExistingRow = existingRow ?? {};

  for (const [field, nextRawValue] of Object.entries(nextValues)) {
    const oldValue = normalizeAuditValue(safeExistingRow[field]);
    const nextValue = normalizeAuditValue(nextRawValue);

    if (areAuditValuesEqual(oldValue, nextValue)) {
      continue;
    }

    changes[field] = {
      old: oldValue,
      new: nextValue,
    };
  }

  return changes;
}

function mergeResolutionOverridePayload(params: {
  base: Record<string, unknown>;
  fieldChanges: ResolutionFieldChanges;
  operatorId: string;
  changedAtIso: string;
  actionType: string;
  compatibilityFields: Record<string, unknown>;
}) {
  const previousFieldChanges = isRecord(params.base.field_changes)
    ? (params.base.field_changes as Record<string, unknown>)
    : {};

  return {
    ...params.base,
    ...params.compatibilityFields,
    field_changes: {
      ...previousFieldChanges,
      ...params.fieldChanges,
    },
    last_action: params.actionType,
    changed_by: params.operatorId,
    changed_at: params.changedAtIso,
  } satisfies Record<string, unknown>;
}

export async function loadCommissionBatchResolutionAction(
  _prevState: ResolutionLoadActionState,
  formData: FormData
): Promise<ResolutionLoadActionState> {
  const batchId = normalizeText(formData.get("batch_id"));

  if (!batchId) {
    return { error: "Batch ID is required to load resolution issues." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commission_batch_staging_rows")
    .select(
      "row_number,validation_level,validation_issues,excluded_from_downstream,resolution_status,resolution_notes,account_id,account_number,commission_amount,commission_date,volume,symbol,currency,account_type,resolved_account_id,resolved_trader_user_id"
    )
    .eq("batch_id", batchId)
    .order("row_number", { ascending: true });

  if (error) {
    return {
      error: isMissingColumnError(error.message)
        ? "Resolution columns are missing. Run migration supabase/migrations/20260328_commission_resolution_simulation_staging.sql first."
        : `Unable to load resolution data for ${batchId}: ${error.message}`,
      batchId,
    };
  }

  const rows = toResolutionRowItems((data as Record<string, unknown>[] | null) ?? null);
  const snapshot = buildResolutionSnapshot(rows);

  return {
    success: `Resolution snapshot loaded for batch ${batchId}.`,
    batchId,
    snapshot,
  };
}

export async function saveCommissionStagingResolutionAction(
  _prevState: ResolutionSaveActionState,
  formData: FormData
): Promise<ResolutionSaveActionState> {
  const batchId = normalizeText(formData.get("batch_id"));
  const rowNumber = Number(formData.get("row_number"));

  if (!batchId || !Number.isFinite(rowNumber)) {
    return { error: "Batch ID and row number are required." };
  }

  const updates = {
    account_id: normalizeOptionalText(formData.get("account_id")),
    account_number: normalizeOptionalText(formData.get("account_number")),
    commission_amount: normalizeNumeric(formData.get("commission_amount")),
    commission_date: normalizeIsoDate(formData.get("commission_date")),
    volume: normalizeNumeric(formData.get("volume")),
    symbol: normalizeOptionalText(formData.get("symbol")),
    currency: normalizeOptionalText(formData.get("currency")),
    account_type: normalizeOptionalText(formData.get("account_type")),
    resolved_account_id: normalizeOptionalText(formData.get("resolved_account_id")),
    resolution_notes: normalizeOptionalText(formData.get("resolution_notes")),
    excluded_from_downstream:
      normalizeText(formData.get("excluded_from_downstream")).toLowerCase() === "true",
  };

  const supabase = await createClient();
  const operatorId = await getCurrentOperatorId(supabase);
  const nowIso = new Date().toISOString();

  const { data: existingRow, error: existingError } = await supabase
    .from("commission_batch_staging_rows")
    .select(
      "account_id,account_number,commission_amount,commission_date,volume,symbol,currency,account_type,resolved_account_id,excluded_from_downstream,resolution_notes,override_payload"
    )
    .eq("batch_id", batchId)
    .eq("row_number", rowNumber)
    .maybeSingle();

  if (existingError) {
    return { error: `Unable to load staging row ${rowNumber}: ${existingError.message}`, batchId, rowNumber };
  }

  const existingOverride =
    existingRow && isRecord((existingRow as Record<string, unknown>).override_payload)
      ? ((existingRow as Record<string, unknown>).override_payload as Record<string, unknown>)
      : {};

  const resolvedAccountForMapping = updates.resolved_account_id ?? updates.account_id;
  const fieldChanges = buildResolutionFieldChanges(
    (existingRow as Record<string, unknown> | null) ?? null,
    {
      account_id: resolvedAccountForMapping,
      account_number: updates.account_number,
      commission_amount: updates.commission_amount,
      commission_date: updates.commission_date,
      volume: updates.volume,
      symbol: updates.symbol,
      currency: updates.currency,
      account_type: updates.account_type,
      resolved_account_id: updates.resolved_account_id,
      excluded_from_downstream: updates.excluded_from_downstream,
      resolution_notes: updates.resolution_notes,
    }
  );

  const overridePayload = mergeResolutionOverridePayload({
    base: existingOverride,
    fieldChanges,
    operatorId,
    changedAtIso: nowIso,
    actionType: "row_fix",
    compatibilityFields: {
      account_id: updates.account_id,
      account_number: updates.account_number,
      commission_amount: updates.commission_amount,
      commission_date: updates.commission_date,
      volume: updates.volume,
      symbol: updates.symbol,
      currency: updates.currency,
      account_type: updates.account_type,
      resolved_account_id: updates.resolved_account_id,
      excluded_from_downstream: updates.excluded_from_downstream,
      resolution_notes: updates.resolution_notes,
    },
  });

  const { error: updateError } = await supabase
    .from("commission_batch_staging_rows")
    .update({
      account_id: resolvedAccountForMapping,
      account_number: updates.account_number,
      commission_amount: updates.commission_amount,
      commission_date: updates.commission_date,
      volume: updates.volume,
      symbol: updates.symbol,
      currency: updates.currency,
      account_type: updates.account_type,
      resolved_account_id: updates.resolved_account_id,
      excluded_from_downstream: updates.excluded_from_downstream,
      resolution_status: updates.excluded_from_downstream ? "ignored" : "resolved",
      resolution_notes: updates.resolution_notes,
      override_payload: overridePayload,
      resolved_by: operatorId,
      resolved_at: nowIso,
      updated_at: nowIso,
    })
    .eq("batch_id", batchId)
    .eq("row_number", rowNumber);

  if (updateError) {
    return {
      error: isMissingColumnError(updateError.message)
        ? "Resolution columns are missing. Run migration supabase/migrations/20260328_commission_resolution_simulation_staging.sql first."
        : `Failed to save row ${rowNumber} resolution: ${updateError.message}`,
      batchId,
      rowNumber,
    };
  }

  try {
    await setBatchResolutionInProgress(supabase, batchId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Row saved but batch resolution status update failed: ${error.message}`
          : "Row saved but batch resolution status update failed.",
      batchId,
      rowNumber,
    };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${batchId}`);

  return {
    success: `Resolution saved for row ${rowNumber}. Rerun validation to clear issues.`,
    batchId,
    rowNumber,
  };
}

export async function applyCommissionResolutionBulkAction(
  _prevState: ResolutionSaveActionState,
  formData: FormData
): Promise<ResolutionSaveActionState> {
  const batchId = normalizeText(formData.get("batch_id"));
  const issueCode = normalizeText(formData.get("issue_code"));
  const actionType = normalizeText(formData.get("bulk_action")).toLowerCase();
  const resolvedAccountId = normalizeOptionalText(formData.get("resolved_account_id"));
  const resolutionNotes = normalizeOptionalText(formData.get("resolution_notes"));

  if (!batchId || !issueCode || !actionType) {
    return { error: "Batch ID, issue code, and bulk action are required.", batchId };
  }

  if (actionType === "set_resolved_account" && !resolvedAccountId) {
    return { error: "resolved_account_id is required for this bulk action.", batchId };
  }

  const supabase = await createClient();
  const operatorId = await getCurrentOperatorId(supabase);

  const { data: rows, error: rowsError } = await supabase
    .from("commission_batch_staging_rows")
    .select(
      "row_number,validation_issues,account_id,resolved_account_id,excluded_from_downstream,resolution_notes,override_payload"
    )
    .eq("batch_id", batchId);

  if (rowsError) {
    return { error: `Unable to load rows for bulk resolution: ${rowsError.message}`, batchId };
  }

  const targetRows = ((rows as Record<string, unknown>[] | null) ?? []).filter((row) =>
    parseValidationIssues(row.validation_issues).some((issue) => issue.code === issueCode)
  );

  if (targetRows.length === 0) {
    return { error: `No rows found for issue code ${issueCode}.`, batchId };
  }

  const nowIso = new Date().toISOString();
  for (const chunk of chunkArray(targetRows, 200)) {
    const payload = chunk.map((row) => {
      const baseOverride = isRecord(row.override_payload)
        ? (row.override_payload as Record<string, unknown>)
        : {};
      const nextResolvedAccountId = actionType === "set_resolved_account" ? resolvedAccountId : null;
      const nextExcludedFromDownstream = actionType === "exclude";
      const nextAccountId =
        actionType === "set_resolved_account"
          ? resolvedAccountId
          : normalizeOptionalText(row.account_id);
      const fieldChanges = buildResolutionFieldChanges(row as Record<string, unknown>, {
        account_id: nextAccountId,
        resolved_account_id:
          actionType === "set_resolved_account"
            ? nextResolvedAccountId
            : normalizeOptionalText(row.resolved_account_id),
        excluded_from_downstream: nextExcludedFromDownstream,
        resolution_notes: resolutionNotes,
      });
      const nextOverride = mergeResolutionOverridePayload({
        base: baseOverride,
        fieldChanges,
        operatorId,
        changedAtIso: nowIso,
        actionType,
        compatibilityFields: {
          bulk_issue_code: issueCode,
          account_id: nextAccountId,
          resolved_account_id:
            actionType === "set_resolved_account"
              ? nextResolvedAccountId
              : normalizeOptionalText(row.resolved_account_id),
          excluded_from_downstream: nextExcludedFromDownstream,
          resolution_notes: resolutionNotes,
        },
      });

      return {
        batch_id: batchId,
        row_number: Number(row.row_number),
        excluded_from_downstream: nextExcludedFromDownstream,
        resolution_status: nextExcludedFromDownstream ? "ignored" : "resolved",
        resolution_notes: resolutionNotes,
        override_payload: nextOverride,
        resolved_by: operatorId,
        resolved_at: nowIso,
        updated_at: nowIso,
        ...(actionType === "set_resolved_account"
          ? {
              account_id: resolvedAccountId,
              resolved_account_id: resolvedAccountId,
            }
          : {}),
      };
    });

    const { error } = await supabase
      .from("commission_batch_staging_rows")
      .upsert(payload, { onConflict: "batch_id,row_number" });

    if (error) {
      return {
        error: `Failed to apply bulk resolution updates: ${error.message}`,
        batchId,
      };
    }
  }

  try {
    await setBatchResolutionInProgress(supabase, batchId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Bulk updates saved but batch resolution status update failed: ${error.message}`
          : "Bulk updates saved but batch resolution status update failed.",
      batchId,
    };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${batchId}`);

  return {
    success: `Bulk resolution action "${actionType}" applied to ${targetRows.length} rows for ${issueCode}. Rerun validation next.`,
    batchId,
  };
}

function toSimulationStagingRows(rows: Record<string, unknown>[] | null): SimulationStagingRow[] {
  if (!rows) {
    return [];
  }

  return rows
    .map((row) => {
      const rowNumber = Number(row.row_number);
      if (!Number.isFinite(rowNumber)) {
        return null;
      }

      const level = normalizeText(row.validation_level).toLowerCase();
      const validationLevel: ValidationLevel =
        level === "valid" || level === "warning" || level === "error" || level === "pending"
          ? (level as ValidationLevel)
          : "pending";

      return {
        row_number: rowNumber,
        broker: normalizeOptionalText(row.broker),
        account_id: normalizeOptionalText(row.account_id),
        account_number: normalizeOptionalText(row.account_number),
        commission_amount: normalizeNumeric(row.commission_amount),
        commission_date: normalizeOptionalText(row.commission_date),
        mapping_status: normalizeText(row.mapping_status).toLowerCase() || "pending",
        validation_level: validationLevel,
        validation_issues: parseValidationIssues(row.validation_issues),
        excluded_from_downstream: Boolean(row.excluded_from_downstream),
        resolution_status: normalizeText(row.resolution_status).toLowerCase() || "pending",
        resolved_account_id: normalizeOptionalText(row.resolved_account_id),
        resolved_trader_user_id: normalizeOptionalText(row.resolved_trader_user_id),
      } satisfies SimulationStagingRow;
    })
    .filter((row): row is SimulationStagingRow => Boolean(row));
}

function pickEffectiveRelationshipRow(
  rows: SimulationRelationshipRow[],
  commissionDateIso: string
): SimulationRelationshipRow | null {
  const commissionMs = parseDateMsSafe(commissionDateIso);
  if (commissionMs === null) {
    return null;
  }

  const candidates = rows
    .map((row) => {
      const startMs = parseDateMsSafe(row.effective_from) ?? parseDateMsSafe(row.created_at);
      const endMs = parseDateMsSafe(row.effective_to);

      return {
        row,
        startMs,
        endMs,
      };
    })
    .filter((entry) => entry.startMs !== null) as Array<{
    row: SimulationRelationshipRow;
    startMs: number;
    endMs: number | null;
  }>;

  if (candidates.length === 0) {
    return null;
  }

  return (
    candidates.find(
      (entry) => entry.startMs <= commissionMs && (entry.endMs === null || entry.endMs > commissionMs)
    )?.row ?? null
  );
}

function isSimulationEligibleRow(row: SimulationStagingRow) {
  const validationPasses = row.validation_level === "valid" || row.validation_level === "warning";

  return (
    row.mapping_status === "mapped" &&
    !row.excluded_from_downstream &&
    validationPasses
  );
}

function isSimulationBlockingValidationRow(row: SimulationStagingRow) {
  if (row.excluded_from_downstream) {
    return false;
  }

  if (row.mapping_status !== "mapped") {
    return true;
  }

  return row.validation_level === "error";
}

function pushBlocker(map: Map<string, number>, code: string) {
  map.set(code, (map.get(code) ?? 0) + 1);
}

async function persistBatchSimulationSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    batchId: string;
    summary: SimulationSummary;
  }
) {
  const nowIso = new Date().toISOString();
  const hasBlockingRows = params.summary.blockedRows > 0;

  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      simulation_summary: {
        total_rows: params.summary.totalRows,
        mapped_rows: params.summary.mappedRows,
        valid_rows: params.summary.validRows,
        warning_rows: params.summary.warningRows,
        error_rows: params.summary.errorRows,
        resolved_rows: params.summary.resolvedRows,
        eligible_rows: params.summary.eligibleRows,
        downstream_eligible_rows: params.summary.eligibleRows,
        blocked_rows: params.summary.blockedRows,
        excluded_rows: params.summary.excludedRows,
        simulation_basis_version: params.summary.simulationBasisVersion,
        next_required_action: params.summary.nextRequiredAction,
        estimated_gross_commission: params.summary.estimatedGrossCommission,
        estimated_platform_total: params.summary.estimatedPlatformTotal,
        estimated_l2_total: params.summary.estimatedL2Total,
        estimated_trader_total: params.summary.estimatedTraderTotal,
        estimated_l1_total: params.summary.estimatedL1Total,
      },
      simulation_error_summary: {
        blocked_rows: params.summary.blockedRows,
        error_rows: params.summary.errorRows,
        top_blockers: params.summary.topBlockers,
      },
      simulation_status: hasBlockingRows ? "failed" : "completed",
      simulation_completed_at: hasBlockingRows ? null : nowIso,
      updated_at: nowIso,
    },
    {
      simulation_status: hasBlockingRows ? "failed" : "completed",
      simulation_completed_at: hasBlockingRows ? null : nowIso,
      updated_at: nowIso,
    },
    {
      simulation_status: hasBlockingRows ? "failed" : "completed",
    },
  ];

  let lastError = `Unable to persist simulation summary for batch ${params.batchId}.`;

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", params.batchId)
      .select("batch_id")
      .maybeSingle();

    if (!error && data) {
      return;
    }

    if (error) {
      lastError = error.message;
      if (!isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  throw new Error(lastError);
}

export async function runCommissionBatchSimulationAction(
  _prevState: SimulationActionState,
  formData: FormData
): Promise<SimulationActionState> {
  const batchId = normalizeText(formData.get("batch_id"));
  if (!batchId) {
    return { error: "Batch ID is required for simulation." };
  }

  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("batch_id,status,mapping_status,validation_result")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (batchError) {
    return { error: `Unable to load batch ${batchId}: ${batchError.message}`, batchId };
  }

  if (!batch) {
    return { error: `Batch ${batchId} not found.`, batchId };
  }

  const mappingStatus = normalizeText((batch as Record<string, unknown>).mapping_status).toLowerCase();
  if (mappingStatus !== "mapped") {
    return {
      error: `Batch ${batchId} mapping is not completed.`,
      batchId,
    };
  }

  const { data: stagingRowsRaw, error: stagingRowsError } = await supabase
    .from("commission_batch_staging_rows")
    .select(
      "row_number,broker,account_id,account_number,commission_amount,commission_date,mapping_status,validation_level,validation_issues,excluded_from_downstream,resolution_status,resolved_account_id,resolved_trader_user_id"
    )
    .eq("batch_id", batchId)
    .order("row_number", { ascending: true });

  if (stagingRowsError) {
    return {
      error: `Unable to load staging rows for simulation: ${stagingRowsError.message}`,
      batchId,
    };
  }

  const rows = toSimulationStagingRows((stagingRowsRaw as Record<string, unknown>[] | null) ?? null);
  if (rows.length === 0) {
    return { error: `Batch ${batchId} has no staging rows for simulation.`, batchId };
  }

  const totalRows = rows.length;
  const mappedRows = rows.filter((row) => row.mapping_status === "mapped").length;
  const validRows = rows.filter((row) => row.validation_level === "valid").length;
  const warningRows = rows.filter((row) => row.validation_level === "warning").length;
  const errorRows = rows.filter((row) => row.validation_level === "error").length;
  const resolvedRows = rows.filter((row) => row.resolution_status === "resolved").length;
  const excludedRows = rows.filter((row) => row.excluded_from_downstream).length;

  const blockingRows = rows.filter(isSimulationBlockingValidationRow);
  const eligibleRows = rows.filter(isSimulationEligibleRow);

  const accountIds = [
    ...new Set(
      eligibleRows
        .map((row) => row.resolved_account_id ?? row.account_id)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  const relationshipRowsByAccountId = new Map<string, SimulationRelationshipRow[]>();
  const accountOwnerByAccountId = new Map<string, string>();
  if (accountIds.length > 0) {
    const { data: accountRows, error: accountLookupError } = await supabase
      .from("trading_accounts")
      .select("account_id,user_id")
      .in("account_id", accountIds);

    if (accountLookupError) {
      return {
        error: `Unable to load trading account context for simulation: ${accountLookupError.message}`,
        batchId,
      };
    }

    for (const row of (accountRows as Record<string, unknown>[] | null) ?? []) {
      const accountId = normalizeOptionalText(row.account_id);
      const userId = normalizeOptionalText(row.user_id);
      if (accountId && userId) {
        accountOwnerByAccountId.set(accountId, userId);
      }
    }

    const { data: relationshipRows, error: relationshipError } = await supabase
      .from("ib_relationships")
      .select("*")
      .in("account_id", accountIds as string[]);

    if (relationshipError) {
      return {
        error: `Unable to load relationship snapshots for simulation: ${relationshipError.message}`,
        batchId,
      };
    }

    for (const row of (relationshipRows as Record<string, unknown>[] | null) ?? []) {
      const accountId = normalizeOptionalText(row.account_id);
      if (!accountId) {
        continue;
      }

      const bucket = relationshipRowsByAccountId.get(accountId) ?? [];
      bucket.push(row);
      relationshipRowsByAccountId.set(accountId, bucket);
    }
  }

  let estimatedGrossCommission = 0;
  let estimatedPlatformTotal = 0;
  let estimatedL2Total = 0;
  let estimatedTraderTotal = 0;
  let estimatedL1Total = 0;

  const blockers = new Map<string, number>();
  let blockedEligibleRows = 0;
  for (const row of blockingRows) {
    if (row.mapping_status !== "mapped") {
      pushBlocker(blockers, "mapping_incomplete");
      continue;
    }

    for (const issue of row.validation_issues) {
      if (issue.level === "error") {
        pushBlocker(blockers, issue.code);
      }
    }
  }

  for (const row of eligibleRows) {
    const gross = row.commission_amount ?? 0;
    const accountId = row.resolved_account_id ?? row.account_id;
    if (!accountId) {
      pushBlocker(blockers, "simulation_missing_resolved_account");
      blockedEligibleRows += 1;
      continue;
    }

    const commissionDateIso = normalizeIsoDate(row.commission_date);
    if (!commissionDateIso) {
      pushBlocker(blockers, "simulation_invalid_commission_date");
      blockedEligibleRows += 1;
      continue;
    }

    const relationshipRow = pickEffectiveRelationshipRow(
      relationshipRowsByAccountId.get(accountId) ?? [],
      commissionDateIso
    );

    if (!relationshipRow) {
      pushBlocker(blockers, "relationship_not_found_for_commission_date");
      blockedEligibleRows += 1;
      continue;
    }

    const traderUserId =
      normalizeOptionalText(relationshipRow.trader_user_id) ??
      normalizeOptionalText(relationshipRow.trader_id) ??
      accountOwnerByAccountId.get(accountId) ??
      row.resolved_trader_user_id;
    const l1UserId = normalizeOptionalText(relationshipRow.l1_ib_id);
    const l2UserId = normalizeOptionalText(relationshipRow.l2_ib_id);

    if (!traderUserId) {
      pushBlocker(blockers, "simulation_missing_trader_user");
      blockedEligibleRows += 1;
      continue;
    }

    if (l2UserId && l2UserId === traderUserId) {
      pushBlocker(blockers, "l2_equals_trader");
      blockedEligibleRows += 1;
      continue;
    }

    const platformRate = Math.max(
      parseRateCandidate(relationshipRow.platform_rate) ??
        parseRateCandidate(relationshipRow.admin_fee_rate) ??
        parseRateCandidate(relationshipRow.admin_rate) ??
        0.1,
      0.1
    );

    const l2RateRaw =
      parseRateCandidate(relationshipRow.l2_rate) ??
      parseRateCandidate(relationshipRow.l2_rebate_rate) ??
      parseRateCandidate(relationshipRow.l2_commission_rate);
    const l2Rate = l2UserId ? l2RateRaw : 0;

    if (l2UserId && l2Rate === null) {
      pushBlocker(blockers, "invalid_rate_state");
      blockedEligibleRows += 1;
      continue;
    }

    const cSplitRateRaw =
      parseRateCandidate(relationshipRow.c_split_rate) ??
      parseRateCandidate(relationshipRow.trader_split_rate) ??
      parseRateCandidate(relationshipRow.trader_rate);
    const cSplitRate = l1UserId ? cSplitRateRaw : 1;

    if (l1UserId && cSplitRate === null) {
      pushBlocker(blockers, "invalid_rate_state");
      blockedEligibleRows += 1;
      continue;
    }

    const platformAmount = roundFinancial(gross * platformRate);
    const minPlatformAmount = roundFinancial(gross * 0.1);
    if (platformAmount + 0.00000001 < minPlatformAmount) {
      pushBlocker(blockers, "platform_profit_below_minimum");
      blockedEligibleRows += 1;
      continue;
    }

    const l2Amount = roundFinancial(gross * (l2Rate ?? 0));
    const pool = roundFinancial(gross - platformAmount - l2Amount);
    if (pool < -0.00000001) {
      pushBlocker(blockers, "pool_negative");
      blockedEligibleRows += 1;
      continue;
    }

    const safePool = Math.max(pool, 0);
    const traderAmount = roundFinancial(safePool * (cSplitRate ?? 1));
    const l1Amount = roundFinancial(Math.max(safePool - traderAmount, 0));

    estimatedGrossCommission += gross;
    estimatedPlatformTotal += platformAmount;
    estimatedL2Total += l2Amount;
    estimatedTraderTotal += traderAmount;
    estimatedL1Total += l1Amount;
  }

  const blockedRows = blockingRows.length + blockedEligibleRows;
  const summary: SimulationSummary = {
    totalRows,
    mappedRows,
    validRows,
    warningRows,
    errorRows,
    resolvedRows,
    eligibleRows: eligibleRows.length,
    blockedRows,
    excludedRows,
    estimatedGrossCommission: roundFinancial(estimatedGrossCommission),
    estimatedPlatformTotal: roundFinancial(estimatedPlatformTotal),
    estimatedL2Total: roundFinancial(estimatedL2Total),
    estimatedTraderTotal: roundFinancial(estimatedTraderTotal),
    estimatedL1Total: roundFinancial(estimatedL1Total),
    simulationBasisVersion: "phase2-aligned-v1",
    nextRequiredAction: blockedRows > 0 ? "resolve_and_revalidate" : "ready_for_approval_gate",
    topBlockers: [...blockers.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8),
  };

  try {
    await persistBatchSimulationSummary(supabase, {
      batchId,
      summary,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Simulation summary update failed: ${error.message}`
          : "Simulation summary update failed.",
      batchId,
      summary,
    };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${batchId}`);

  if (summary.blockedRows > 0) {
    return {
      error: `Simulation completed with blockers for batch ${batchId}. Resolve issues before approval.`,
      batchId,
      summary,
    };
  }

  return {
    success: `Simulation completed for batch ${batchId}. Batch is now eligible for approval gate checks.`,
    batchId,
    summary,
  };
}
