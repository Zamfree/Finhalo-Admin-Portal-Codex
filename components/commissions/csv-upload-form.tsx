"use client";

import { useActionState, useMemo, useState, type ChangeEvent } from "react";

import { uploadCommissionCsv } from "@/app/admin/commissions/actions";

type ActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: ActionState = {};
const REQUIRED_FIELDS = [
  "user_id",
  "account_number",
  "symbol",
  "volume",
  "commission_amount",
  "commission_date",
] as const;

function parseCsvLine(line: string): string[] {
  return line
    .split(",")
    .map((value) => value.trim())
    .map((value) => value.replace(/^"|"$/g, ""));
}

export function CsvUploadForm() {
  const [state, formAction, isPending] = useActionState(uploadCommissionCsv, INITIAL_STATE);
  const [broker, setBroker] = useState("");
  const [parseError, setParseError] = useState("");
  const [parsedPayload, setParsedPayload] = useState("[]");

  const canSubmit = useMemo(
    () => Boolean(broker.trim()) && parsedPayload !== "[]" && !parseError,
    [broker, parsedPayload, parseError],
  );

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setParsedPayload("[]");
      setParseError("");
      return;
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setParsedPayload("[]");
      setParseError("CSV must include a header and at least one data row.");
      return;
    }

    const header = parseCsvLine(lines[0]);
    const missing = REQUIRED_FIELDS.filter((field) => !header.includes(field));

    if (missing.length > 0) {
      setParsedPayload("[]");
      setParseError(`Missing required fields: ${missing.join(", ")}`);
      return;
    }

    const indexMap = new Map(header.map((name, index) => [name, index]));

    const parsedRows = lines.slice(1).map((line) => {
      const columns = parseCsvLine(line);
      const get = (field: (typeof REQUIRED_FIELDS)[number]) => columns[indexMap.get(field) ?? -1] ?? "";

      return {
        user_id: get("user_id"),
        account_number: get("account_number"),
        symbol: get("symbol"),
        volume: get("volume"),
        commission_amount: get("commission_amount"),
        commission_date: get("commission_date"),
      };
    });

    const hasMissingValue = parsedRows.some((row) =>
      REQUIRED_FIELDS.some((field) => String(row[field]).trim().length === 0),
    );

    if (hasMissingValue) {
      setParsedPayload("[]");
      setParseError("CSV contains rows with missing required values.");
      return;
    }

    setParseError("");
    setParsedPayload(JSON.stringify(parsedRows));
  }

  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">Upload Commission CSV</h2>
      <form action={formAction} className="space-y-3">
        <div>
          <label htmlFor="broker" className="mb-1 block text-sm font-medium">
            Broker
          </label>
          <input
            id="broker"
            name="broker"
            value={broker}
            onChange={(event) => setBroker(event.target.value)}
            placeholder="Broker name"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="commission_csv" className="mb-1 block text-sm font-medium">
            CSV file
          </label>
          <input
            id="commission_csv"
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="block w-full text-sm"
          />
        </div>

        <input type="hidden" name="parsed_csv" value={parsedPayload} />

        {parseError ? <p className="text-sm text-destructive">{parseError}</p> : null}
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload CSV"}
        </button>
      </form>
    </section>
  );
}
