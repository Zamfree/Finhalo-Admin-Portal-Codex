export type SettingsSectionKey =
  | "general"
  | "commission_rules"
  | "ib_configuration"
  | "data_import"
  | "finance"
  | "notifications"
  | "security";

export type SettingsSection = {
  key: SettingsSectionKey;
  title: string;
  description: string;
};
