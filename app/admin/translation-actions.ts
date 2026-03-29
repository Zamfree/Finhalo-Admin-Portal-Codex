"use server";

import type { AdminLanguage } from "@/lib/admin-ui";
import { translateAdminBatch } from "@/services/admin/translation.service";

type TranslateAdminBatchActionInput = {
  language: AdminLanguage;
  texts: string[];
};

type TranslateAdminBatchActionOutput = {
  provider: "azure" | "libretranslate" | "none";
  translations: Record<string, string>;
};

const MAX_TEXTS_PER_CALL = 50;

export async function translateAdminTextBatchAction(
  input: TranslateAdminBatchActionInput
): Promise<TranslateAdminBatchActionOutput> {
  const networkEnabled = process.env.ADMIN_TRANSLATE_ENABLE_NETWORK === "true";
  if (!networkEnabled || input.language !== "zh") {
    return { provider: "none", translations: {} };
  }

  const texts = Array.from(new Set((input.texts ?? []).map((item) => item.trim()).filter(Boolean))).slice(
    0,
    MAX_TEXTS_PER_CALL
  );

  if (texts.length === 0) {
    return { provider: "none", translations: {} };
  }

  return translateAdminBatch({
    texts,
    from: "en",
    to: "zh-Hans",
  });
}
