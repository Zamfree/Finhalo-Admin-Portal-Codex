export type KpiCardModel = {
  label: string;
  value: string | number;
  emphasis?: "default" | "strong";
  hint?: string;
};
