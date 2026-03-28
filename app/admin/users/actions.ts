"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type UserType = "trader" | "ib";
type UserStatus = "active" | "restricted" | "suspended";
type TradingAccountStatus = "active" | "monitoring" | "suspended";

export type UserMutationState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: UserMutationState = {};

function normalizeUserType(value: string): UserType {
  return value.trim().toLowerCase() === "ib" ? "ib" : "trader";
}

function normalizeUserStatus(value: string): UserStatus {
  const normalized = value.trim().toLowerCase();

  if (normalized === "restricted" || normalized === "suspended") {
    return normalized;
  }

  return "active";
}

function normalizeTradingAccountStatus(value: string): TradingAccountStatus {
  const normalized = value.trim().toLowerCase();

  if (normalized === "monitoring" || normalized === "suspended") {
    return normalized;
  }

  return "active";
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function isUniqueViolation(message: string) {
  return /duplicate key|already exists|unique/i.test(message);
}

function revalidateUserSurfaces() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/accounts");
}

async function updateUsersTableById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  payloadAttempts: Array<Record<string, string | boolean | null>>
) {
  const keyAttempts = ["user_id", "id"] as const;
  let lastErrorMessage = "No compatible column was found on users.";

  for (const key of keyAttempts) {
    for (const payload of payloadAttempts) {
      const { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq(key, userId)
        .select(key)
        .maybeSingle();

      if (!error && data) {
        return { ok: true as const };
      }

      if (error) {
        lastErrorMessage = error.message;

        if (!isMissingColumnError(error.message)) {
          return { ok: false as const, error: error.message };
        }
      }
    }
  }

  return { ok: false as const, error: lastErrorMessage };
}

export async function createUserAction(
  _prevState: UserMutationState = INITIAL_STATE,
  formData: FormData
): Promise<UserMutationState> {
  void _prevState;
  const userId = String(formData.get("user_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const userType = normalizeUserType(String(formData.get("user_type") ?? "trader"));
  const status = normalizeUserStatus(String(formData.get("status") ?? "active"));

  if (!userId) {
    return { error: "User ID is required." };
  }

  if (!email) {
    return { error: "Email is required." };
  }

  if (!displayName) {
    return { error: "Display name is required." };
  }

  const payloadAttempts: Array<Record<string, string>> = [
    { user_id: userId, email, display_name: displayName, user_type: userType, status },
    { id: userId, email, display_name: displayName, user_type: userType, status },
    { user_id: userId, email, full_name: displayName, role: userType, status },
    { id: userId, email, full_name: displayName, role: userType, status },
  ];
  const supabase = await createClient();
  let lastErrorMessage = "Failed to create user.";

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from("users").insert(payload);

    if (!error) {
      revalidateUserSurfaces();
      return { success: `User ${userId} created.` };
    }

    if (isUniqueViolation(error.message)) {
      return { error: `User ${userId} or email ${email} already exists.` };
    }

    lastErrorMessage = error.message;

    if (!isMissingColumnError(error.message)) {
      break;
    }
  }

  return { error: lastErrorMessage };
}

export async function updateUserAction(
  _prevState: UserMutationState = INITIAL_STATE,
  formData: FormData
): Promise<UserMutationState> {
  void _prevState;
  const userId = String(formData.get("user_id") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const userType = normalizeUserType(String(formData.get("user_type") ?? "trader"));
  const status = normalizeUserStatus(String(formData.get("status") ?? "active"));

  if (!userId) {
    return { error: "User ID is required." };
  }

  if (!displayName) {
    return { error: "Display name is required." };
  }

  const payloadAttempts: Array<Record<string, string>> = [
    { display_name: displayName, user_type: userType, status },
    { full_name: displayName, role: userType, status },
  ];
  const keyAttempts = ["user_id", "id"] as const;
  const supabase = await createClient();
  let lastErrorMessage = "Failed to update user.";

  for (const key of keyAttempts) {
    for (const payload of payloadAttempts) {
      const { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq(key, userId)
        .select(key)
        .maybeSingle();

      if (!error && data) {
        revalidateUserSurfaces();
        return { success: `User ${userId} updated.` };
      }

      if (error) {
        lastErrorMessage = error.message;

        if (isUniqueViolation(error.message)) {
          return { error: `Update conflicts with existing user data for ${userId}.` };
        }

        if (!isMissingColumnError(error.message)) {
          break;
        }
      }
    }
  }

  return { error: lastErrorMessage };
}

export async function bindTradingAccountAction(
  _prevState: UserMutationState = INITIAL_STATE,
  formData: FormData
): Promise<UserMutationState> {
  void _prevState;
  const userId = String(formData.get("user_id") ?? "").trim();
  const accountId = String(formData.get("account_id") ?? "").trim();

  if (!userId) {
    return { error: "User ID is required." };
  }

  if (!accountId) {
    return { error: "Trading account ID is required." };
  }

  const supabase = await createClient();

  for (const key of ["account_id", "id"] as const) {
    const { data, error } = await supabase
      .from("trading_accounts")
      .update({ user_id: userId })
      .eq(key, accountId)
      .select(key)
      .maybeSingle();

    if (!error && data) {
      revalidateUserSurfaces();
      return {
        success: `Trading account ${accountId} is now linked to ${userId}.`,
      };
    }

    if (error && !isMissingColumnError(error.message)) {
      return { error: error.message };
    }
  }

  return { error: `Trading account ${accountId} was not found.` };
}

export async function updateTradingAccountStatusAction(
  _prevState: UserMutationState = INITIAL_STATE,
  formData: FormData
): Promise<UserMutationState> {
  void _prevState;
  const accountId = String(formData.get("account_id") ?? "").trim();
  const status = normalizeTradingAccountStatus(String(formData.get("status") ?? "active"));

  if (!accountId) {
    return { error: "Trading account ID is required." };
  }

  const supabase = await createClient();

  for (const key of ["account_id", "id"] as const) {
    const { data, error } = await supabase
      .from("trading_accounts")
      .update({ status })
      .eq(key, accountId)
      .select(key)
      .maybeSingle();

    if (!error && data) {
      revalidateUserSurfaces();
      return {
        success: `Trading account ${accountId} marked as ${status}.`,
      };
    }

    if (error && !isMissingColumnError(error.message)) {
      return { error: error.message };
    }
  }

  return { error: `Trading account ${accountId} was not found.` };
}

export async function applyUserSafetyLockAction(
  _prevState: UserMutationState = INITIAL_STATE,
  formData: FormData
): Promise<UserMutationState> {
  void _prevState;
  const userId = String(formData.get("user_id") ?? "").trim();

  if (!userId) {
    return { error: "User ID is required." };
  }

  const lockUntil = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const supabase = await createClient();
  const updated = await updateUsersTableById(supabase, userId, [
    { safety_lock_until: lockUntil },
    { withdrawal_lock_until: lockUntil },
    { lock_until: lockUntil },
    { lock_12h_until: lockUntil },
    { rebate_lock_until: lockUntil },
  ]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidateUserSurfaces();
  return { success: `12-hour safety lock applied for ${userId}.` };
}

export async function clearUserSafetyLockAction(
  _prevState: UserMutationState = INITIAL_STATE,
  formData: FormData
): Promise<UserMutationState> {
  void _prevState;
  const userId = String(formData.get("user_id") ?? "").trim();

  if (!userId) {
    return { error: "User ID is required." };
  }

  const supabase = await createClient();
  const updated = await updateUsersTableById(supabase, userId, [
    { safety_lock_until: null },
    { withdrawal_lock_until: null },
    { lock_until: null },
    { lock_12h_until: null },
    { rebate_lock_until: null },
  ]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidateUserSurfaces();
  return { success: `12-hour safety lock cleared for ${userId}.` };
}

export async function setUserRebatePermissionAction(
  _prevState: UserMutationState = INITIAL_STATE,
  formData: FormData
): Promise<UserMutationState> {
  void _prevState;
  const userId = String(formData.get("user_id") ?? "").trim();
  const enabled =
    String(formData.get("enabled") ?? "")
      .trim()
      .toLowerCase() === "true";

  if (!userId) {
    return { error: "User ID is required." };
  }

  const supabase = await createClient();
  const updated = await updateUsersTableById(supabase, userId, [
    { rebate_enabled: enabled },
    { rebate_allowed: enabled },
    { cashback_enabled: enabled },
    { is_rebate_enabled: enabled },
  ]);

  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidateUserSurfaces();
  return {
    success: `User ${userId} rebate permission ${enabled ? "enabled" : "disabled"}.`,
  };
}
