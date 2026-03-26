export type SettingsSectionRecord = {
  key:
    | "general"
    | "commissionRules"
    | "ibConfiguration"
    | "dataImport"
    | "financeSettings"
    | "notifications"
    | "security";
  items: [string, string][];
};

export type SettingsOperationRecord = {
  key: "recalculateRebates" | "reprocessCommissionBatch" | "systemConfiguration";
  title: string;
  description: string;
  status: string;
  linkedModule: string;
  nextStep: string;
};

export type SettingsAuditRecord = {
  id: string;
  actor: string;
  action: string;
  scope: string;
  createdAt: string;
};

export type SettingsWorkspaceData = {
  sections: SettingsSectionRecord[];
  operations: SettingsOperationRecord[];
  auditTrail: SettingsAuditRecord[];
};
