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
    <section className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <h2 className="mb-4 text-base font-semibold text-white">Upload Commission CSV</h2>
      <form action={formAction} className="space-y-3">
        <div>
          <label
            htmlFor="broker"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Broker
          </label>
          <input
            id="broker"
            name="broker"
            value={broker}
            onChange={(event) => setBroker(event.target.value)}
            placeholder="Broker name"
            className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>

        <div>
          <label
            htmlFor="commission_csv"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            CSV file
          </label>
          <input
            id="commission_csv"
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-zinc-200 file:transition file:duration-200 hover:file:border-white/15 hover:file:bg-white/[0.08]"
          />
        </div>

        <input type="hidden" name="parsed_csv" value={parsedPayload} />

        {parseError ? <p className="text-sm text-rose-300">{parseError}</p> : null}
        {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Uploading..." : "Upload CSV"}
        </button>
      </form>
    </section>
  );
}
