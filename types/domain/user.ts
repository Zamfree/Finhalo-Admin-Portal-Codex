export type UserRole = "trader" | "ib";
export type UserStatus = "active" | "restricted" | "suspended";

export type UserIdentity = {
  userId: string;
  email: string;
  displayName?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type UserProfile = {
  fullName?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
};

export type User = UserIdentity & {
  profile?: UserProfile | null;
};
