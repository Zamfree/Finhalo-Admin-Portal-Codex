import type { User } from "@/types/domain/user";
import type { UserRow } from "@/types/user";

function getEmailPrefix(email: string) {
  return email.split("@")[0]?.trim() ?? "";
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
