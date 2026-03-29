export type MoneyDisplayMode = "positive" | "negative" | "neutral";

const FORMATTERS_BY_SCALE = new Map<number, Intl.NumberFormat>();

function getFormatter(scale: number) {
  if (!FORMATTERS_BY_SCALE.has(scale)) {
    FORMATTERS_BY_SCALE.set(
      scale,
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: scale,
        maximumFractionDigits: scale,
      })
    );
  }

  const formatter = FORMATTERS_BY_SCALE.get(scale);

  if (!formatter) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: scale,
      maximumFractionDigits: scale,
    });
  }

  return formatter;
}

export function truncateToScale(value: number, scale = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** scale;
  return Math.trunc(value * factor) / factor;
}

export function formatTruncatedNumber(value: number, scale = 2) {
  return getFormatter(scale).format(truncateToScale(value, scale));
}

export function formatTruncatedCurrency(value: number) {
  const unsigned = `$${formatTruncatedNumber(Math.abs(value), 2)}`;
  return value < 0 ? `-${unsigned}` : unsigned;
}

export function formatTruncatedCurrencyByMode(
  value: number,
  mode: MoneyDisplayMode = "neutral"
) {
  const unsigned = `$${formatTruncatedNumber(Math.abs(value), 2)}`;

  if (mode === "positive") {
    return `+${unsigned}`;
  }

  if (mode === "negative") {
    return `-${unsigned}`;
  }

  return value < 0 ? `-${unsigned}` : unsigned;
}

export function formatTruncatedFixed(value: number, scale = 2) {
  return truncateToScale(value, scale).toFixed(scale);
}
