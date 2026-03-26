export type ReturnContextSource =
  | "dashboard"
  | "users"
  | "accounts"
  | "commission"
  | "brokers"
  | "finance"
  | "network"
  | "referral"
  | "campaigns"
  | "support"
  | "settings"
  | "search"
  | (string & {});

export type ReturnContextQueryValue = string | number | boolean | null | undefined;
export type ReturnContextQuery = Record<string, ReturnContextQueryValue>;

type SearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

export const RETURN_CONTEXT_QUERY_KEYS = {
  returnTo: "returnTo",
  source: "source",
} as const;

const SOURCE_PATTERNS: Array<{
  prefix: string;
  source: ReturnContextSource;
}> = [
  { prefix: "/admin/dashboard", source: "dashboard" },
  { prefix: "/admin/users", source: "users" },
  { prefix: "/admin/accounts", source: "accounts" },
  { prefix: "/admin/commission", source: "commission" },
  { prefix: "/admin/brokers", source: "brokers" },
  { prefix: "/admin/finance", source: "finance" },
  { prefix: "/admin/network", source: "network" },
  { prefix: "/admin/referral", source: "referral" },
  { prefix: "/admin/campaigns", source: "campaigns" },
  { prefix: "/admin/support", source: "support" },
  { prefix: "/admin/settings", source: "settings" },
  { prefix: "/admin/search", source: "search" },
];

function toSearchParams(
  value?: SearchParamsLike | URLSearchParams | string | null
): URLSearchParams {
  if (!value) {
    return new URLSearchParams();
  }

  if (typeof value === "string") {
    return new URLSearchParams(value.startsWith("?") ? value.slice(1) : value);
  }

  return new URLSearchParams(value.toString());
}

function isSafeInternalPath(target: string) {
  return target.startsWith("/") && !target.startsWith("//");
}

function normalizeTargetPath(targetPath: string) {
  const parsed = new URL(targetPath, "https://finhalo.local");
  return {
    pathname: parsed.pathname,
    searchParams: new URLSearchParams(parsed.search),
    hash: parsed.hash,
  };
}

export function detectReturnContextSource(pathname: string): ReturnContextSource | null {
  const matched = SOURCE_PATTERNS.find(({ prefix }) => pathname.startsWith(prefix));
  return matched?.source ?? null;
}

export function getReturnContextSourceLabel(source?: ReturnContextSource | null) {
  if (!source) {
    return null;
  }

  switch (source) {
    case "dashboard":
      return "Dashboard";
    case "users":
      return "Users";
    case "accounts":
      return "Accounts";
    case "commission":
      return "Commission";
    case "brokers":
      return "Brokers";
    case "finance":
      return "Finance";
    case "network":
      return "Network";
    case "referral":
      return "Referral";
    case "campaigns":
      return "Campaigns";
    case "support":
      return "Support";
    case "settings":
      return "Settings";
    case "search":
      return "Search";
    default:
      return source;
  }
}

export function getCurrentReturnContext(
  pathname: string,
  searchParams?: SearchParamsLike | URLSearchParams | string | null
) {
  const params = toSearchParams(searchParams);
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function buildPathWithReturnContext({
  currentPathname,
  currentSearchParams,
  targetPath,
  targetQuery,
  source,
}: {
  currentPathname: string;
  currentSearchParams?: SearchParamsLike | URLSearchParams | string | null;
  targetPath: string;
  targetQuery?: ReturnContextQuery;
  source?: ReturnContextSource | null;
}) {
  const currentContext = getCurrentReturnContext(currentPathname, currentSearchParams);
  const { pathname, searchParams, hash } = normalizeTargetPath(targetPath);

  if (targetQuery) {
    for (const [key, value] of Object.entries(targetQuery)) {
      if (value === undefined || value === null || value === "") {
        searchParams.delete(key);
      } else {
        searchParams.set(key, String(value));
      }
    }
  }

  searchParams.set(RETURN_CONTEXT_QUERY_KEYS.returnTo, currentContext);

  if (source) {
    searchParams.set(RETURN_CONTEXT_QUERY_KEYS.source, source);
  } else {
    searchParams.delete(RETURN_CONTEXT_QUERY_KEYS.source);
  }

  const query = searchParams.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}

export function getReturnTargetFromSearchParams(
  searchParams?: SearchParamsLike | URLSearchParams | string | null,
  fallbackPath = "/admin/dashboard"
) {
  const params = toSearchParams(searchParams);
  const returnTo = params.get(RETURN_CONTEXT_QUERY_KEYS.returnTo);

  if (!returnTo || !isSafeInternalPath(returnTo)) {
    return fallbackPath;
  }

  return returnTo;
}

export function getSourceFromSearchParams(
  searchParams?: SearchParamsLike | URLSearchParams | string | null,
  pathname?: string,
  fallbackSource?: ReturnContextSource | null
) {
  const params = toSearchParams(searchParams);
  const sourceFromQuery = params.get(RETURN_CONTEXT_QUERY_KEYS.source);

  if (sourceFromQuery) {
    return sourceFromQuery as ReturnContextSource;
  }

  if (fallbackSource) {
    return fallbackSource;
  }

  if (pathname) {
    return detectReturnContextSource(pathname);
  }

  return null;
}
