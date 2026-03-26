import type { SettingsWorkspaceData } from "@/app/admin/settings/_types";
import { createClient } from "@/lib/supabase/server";

const SETTINGS_SECTIONS: SettingsWorkspaceData["sections"] = [
  {
    key: "general",
    items: [
      ["platformTimezone", "UTC"],
      ["defaultCurrency", "USD"],
      ["adminLocaleFallback", "English"],
    ],
  },
  {
    key: "commissionRules",
    items: [
      ["adminFeeFloor", "10% minimum"],
      ["l2Priority", "Calculated before trader and L1 split"],
      ["batchApprovalMode", "Manual review required"],
    ],
  },
  {
    key: "ibConfiguration",
    items: [
      ["maxReferralDepth", "2 levels"],
      ["traderModel", "Account-level only"],
      ["snapshotBehavior", "Future-only relationship updates"],
    ],
  },
  {
    key: "dataImport",
    items: [
      ["commissionFormats", "CSV, XLSX"],
      ["columnMapping", "Required before import"],
      ["validationMode", "Preview before batch creation"],
    ],
  },
  {
    key: "financeSettings",
    items: [
      ["ledgerPosting", "Derived from approved downstream records"],
      ["withdrawalReview", "Manual approval queue"],
      ["reconciliationWindow", "Daily operational review"],
    ],
  },
  {
    key: "notifications",
    items: [
      ["adminAlerts", "Enabled"],
      ["batchReviewNotices", "Enabled"],
      ["financeExceptionNotices", "Enabled"],
    ],
  },
  {
    key: "security",
    items: [
      ["adminSessions", "Managed by platform auth"],
      ["auditVisibility", "Enabled"],
      ["sensitiveActions", "Protected by review workflow"],
    ],
  },
];

const SETTINGS_OPERATIONS: SettingsWorkspaceData["operations"] = [
  {
    key: "recalculateRebates",
    title: "Recalculate Rebates",
    description: "Operational entry for replaying rebate results after upstream rule or source corrections.",
    status: "Structured placeholder",
    linkedModule: "Finance",
    nextStep: "Hold this behind guarded replay controls once finance-side validation and settlement review are ready.",
  },
  {
    key: "reprocessCommissionBatch",
    title: "Reprocess Commission Batch",
    description: "Used when a reviewed batch must be replayed through the commission pipeline safely.",
    status: "Structured placeholder",
    linkedModule: "Commission",
    nextStep: "Expose only after batch replay can safely preserve source context, review notes, and downstream posting order.",
  },
  {
    key: "systemConfiguration",
    title: "System Configuration",
    description: "Central review surface for platform-wide defaults, validation behavior, and guarded admin settings.",
    status: "Available",
    linkedModule: "Settings",
    nextStep: "Continue reviewing defaults, import assumptions, and guarded action readiness from this central control surface.",
  },
];

const SETTINGS_AUDIT_TRAIL: SettingsWorkspaceData["auditTrail"] = [
  {
    id: "AUD-1201",
    actor: "Operations Lead",
    action: "Reviewed finance settings",
    scope: "Finance Settings",
    createdAt: "2026-03-24T10:20:00Z",
  },
  {
    id: "AUD-1202",
    actor: "Commission Review",
    action: "Confirmed batch approval mode",
    scope: "Commission Rules",
    createdAt: "2026-03-24T14:05:00Z",
  },
  {
    id: "AUD-1203",
    actor: "Platform Admin",
    action: "Checked import validation configuration",
    scope: "Data & Import",
    createdAt: "2026-03-25T09:35:00Z",
  },
];

async function getSettingsAuditTrail() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admin_settings_audit")
      .select("id, actor, action, scope, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data && data.length > 0) {
      return data.map((item) => ({
        id: String(item.id),
        actor: String(item.actor ?? "Admin Operator"),
        action: String(item.action ?? "Settings action"),
        scope: String(item.scope ?? "Settings"),
        createdAt: String(item.created_at ?? new Date().toISOString()),
      }));
    }
  } catch {
    // Fall through to mock data.
  }

  return SETTINGS_AUDIT_TRAIL;
}

export async function getAdminSettingsWorkspace(): Promise<SettingsWorkspaceData> {
  return {
    sections: SETTINGS_SECTIONS,
    operations: SETTINGS_OPERATIONS,
    auditTrail: await getSettingsAuditTrail(),
  };
}

export async function getCommissionProfitThresholdPercent(): Promise<number> {
  const commissionRules = SETTINGS_SECTIONS.find((section) => section.key === "commissionRules");
  const adminFeeFloor = commissionRules?.items.find(([key]) => key === "adminFeeFloor")?.[1] ?? "";
  const matched = adminFeeFloor.match(/(\d+(?:\.\d+)?)/);

  return matched ? Number(matched[1]) : 10;
}
