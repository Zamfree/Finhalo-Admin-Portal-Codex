type TranslationProvider = "azure" | "libretranslate" | "none";

type TranslateBatchInput = {
  texts: string[];
  from: string;
  to: string;
};

type TranslateBatchOutput = {
  provider: TranslationProvider;
  translations: Record<string, string>;
};

const MAX_BATCH_SIZE = 50;
const MAX_TEXT_LENGTH = 3000;

function normalizeTexts(input: string[]) {
  const deduped = new Set<string>();

  for (const raw of input) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX_TEXT_LENGTH) continue;
    deduped.add(trimmed);
    if (deduped.size >= MAX_BATCH_SIZE) break;
  }

  return Array.from(deduped);
}

function resolveProvider(): TranslationProvider {
  const configured = (process.env.ADMIN_TRANSLATE_PROVIDER ?? "").trim().toLowerCase();
  if (configured === "azure" || configured === "libretranslate") return configured;

  if (process.env.ADMIN_TRANSLATE_AZURE_KEY && process.env.ADMIN_TRANSLATE_AZURE_ENDPOINT) {
    return "azure";
  }

  if (process.env.ADMIN_TRANSLATE_LIBRE_URL) {
    return "libretranslate";
  }

  return "none";
}

function isLoopbackEndpoint(urlValue: string) {
  try {
    const url = new URL(urlValue);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function translateWithAzure(input: TranslateBatchInput) {
  const endpoint = (process.env.ADMIN_TRANSLATE_AZURE_ENDPOINT ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.ADMIN_TRANSLATE_AZURE_KEY ?? "").trim();
  const region = (process.env.ADMIN_TRANSLATE_AZURE_REGION ?? "").trim();

  if (!endpoint || !key) return {};

  const url = `${endpoint}/translate?api-version=3.0&from=${encodeURIComponent(
    input.from
  )}&to=${encodeURIComponent(input.to)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": key,
      ...(region ? { "Ocp-Apim-Subscription-Region": region } : {}),
    },
    body: JSON.stringify(input.texts.map((text) => ({ Text: text }))),
    cache: "no-store",
  });

  if (!response.ok) return {};

  const payload = (await response.json()) as Array<{
    translations?: Array<{ text?: string }>;
  }>;

  const translations: Record<string, string> = {};
  for (let index = 0; index < input.texts.length; index += 1) {
    const source = input.texts[index];
    const translated = payload[index]?.translations?.[0]?.text?.trim();
    if (!source || !translated || translated === source) continue;
    translations[source] = translated;
  }

  return translations;
}

async function translateWithLibreTranslate(input: TranslateBatchInput) {
  const baseUrl = (process.env.ADMIN_TRANSLATE_LIBRE_URL ?? "").trim().replace(/\/+$/, "");
  const apiKey = (process.env.ADMIN_TRANSLATE_LIBRE_API_KEY ?? "").trim();
  const allowExternal = process.env.ADMIN_TRANSLATE_ALLOW_EXTERNAL === "true";

  if (!baseUrl) return {};
  if (!allowExternal && !isLoopbackEndpoint(baseUrl)) return {};

  const translations: Record<string, string> = {};

  for (const text of input.texts) {
    const response = await fetch(`${baseUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: input.from,
        target: input.to,
        format: "text",
        ...(apiKey ? { api_key: apiKey } : {}),
      }),
      cache: "no-store",
    });

    if (!response.ok) continue;
    const payload = (await response.json()) as { translatedText?: string };
    const translated = payload.translatedText?.trim();
    if (!translated || translated === text) continue;
    translations[text] = translated;
  }

  return translations;
}

export async function translateAdminBatch(input: TranslateBatchInput): Promise<TranslateBatchOutput> {
  const texts = normalizeTexts(input.texts);
  if (texts.length === 0) {
    return { provider: "none", translations: {} };
  }

  const provider = resolveProvider();

  if (provider === "azure") {
    return {
      provider,
      translations: await translateWithAzure({ ...input, texts }),
    };
  }

  if (provider === "libretranslate") {
    return {
      provider,
      translations: await translateWithLibreTranslate({ ...input, texts }),
    };
  }

  return { provider: "none", translations: {} };
}
