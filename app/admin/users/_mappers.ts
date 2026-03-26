import type { User } from "@/types/domain/user";
import type { UserFilters, UserRow } from "./_types";

function getEmailPrefix(email: string) {
  return email.split("@")[0]?.trim() ?? "";
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesUserQuery(row: UserRow, query: string) {
  if (!query) return true;

  return (
    row.email.toLowerCase().includes(query) ||
    row.display_name.toLowerCase().includes(query) ||
    row.user_id.toLowerCase().includes(query)
  );
}
export function filterUserRows(rows: UserRow[], filters: UserFilters) {
  const normalizedQuery = normalizeSearchValue(filters.query);

  return rows.filter((row) => {
    const matchesQuery = matchesUserQuery(row, normalizedQuery);
    const matchesStatus = filters.status === "all" || row.status === filters.status;

    return matchesQuery && matchesStatus;
  });
}

export function getUserDisplayName(user: {
  email: string;
  userId?: string;
  user_id?: string;
  displayName?: string | null;
  display_name?: string | null;
  profile?: {
    fullName?: string | null;
  } | null;
}) {
  const explicitDisplayName = user.displayName ?? user.display_name ?? user.profile?.fullName;
  if (explicitDisplayName && explicitDisplayName.trim().length > 0) {
    return explicitDisplayName.trim();
  }

  const emailPrefix = getEmailPrefix(user.email);
  if (emailPrefix) {
    return emailPrefix;
  }

  return user.userId ?? user.user_id ?? user.email;
}

export function mapDomainUserToUserRow(user: User): UserRow {
  return {
    user_id: user.userId,
    email: user.email,
    display_name: getUserDisplayName(user),
    user_type: user.role,
    status: user.status,
    created_at: user.createdAt,
  };
}
