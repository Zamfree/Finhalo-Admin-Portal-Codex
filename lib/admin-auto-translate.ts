import { adminTranslations, type AdminLanguage } from "@/lib/admin-ui";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const STATIC_EN_TO_ZH: Record<string, string> = {
  "Users Management": "用户管理",
  "Brokers Management": "经纪商管理",
  "Commission Management": "佣金管理",
  "Finance Center": "财务中心",
  "Referral Program": "推荐系统",
  "Support Center": "客服中心",
  "System Setting": "系统设置",
  "CREATE USER": "创建用户",
  "Create User": "创建用户",
  "APPLY FILTERS": "应用筛选",
  "Apply Filters": "应用筛选",
  CLEAR: "清除",
  USER: "用户",
  STATUS: "状态",
  IDENTITY: "身份",
  "OWNED ACCOUNTS": "拥有账户",
  "PRIMARY ACCOUNT CONTEXT": "主账户上下文",
  "PUBLISH SYSTEM ANNOUNCEMENT": "发布系统公告",
  "SEND ADMIN MESSAGE": "发送后台消息",
  "TARGET EMAIL": "目标邮箱",
  TITLE: "标题",
  BODY: "正文",
  SUBJECT: "主题",
  MESSAGE: "消息",
  "PUBLISH ANNOUNCEMENT": "发布公告",
  "SEND MESSAGE": "发送消息",
  "RECENT ANNOUNCEMENTS": "最近公告",
  "RECENT ADMIN MESSAGES": "最近后台消息",
  CASE: "工单",
  "ISSUE SUMMARY": "问题摘要",
  "CASE STATE": "工单状态",
  "INVESTIGATION CONTEXT": "调查上下文",
  "LATEST ACTIVITY": "最近活动",
  Broadcast: "广播",
  "Search users by email or ID": "按邮箱或ID搜索用户",
  "No users found.": "未找到用户。",
  "No withdrawal requests found.": "未找到提现请求。",
  "Open user": "打开用户",
  "Open withdrawal": "打开提现",
  "Open network node": "打开代理节点",
  "Requested At": "请求时间",
  "Reviewed / Processed": "已审核 / 已处理",
  "No further action": "无需后续操作",
  "Move to under review": "流转到审核中",
  "Approve or reject": "批准或拒绝",
  "Mark processing or completed": "标记为处理中或已完成",
  "Complete or fail": "完成或失败",
  "Check release and retry plan": "检查放款与重试计划",
  "Optional notes for audit trail": "审计轨迹可选备注",
  "Bulk reject reason": "批量拒绝原因",
  "Approve Filtered": "批准筛选结果",
  "Reject Filtered": "拒绝筛选结果",
  "Approve Selected": "批准已选",
  "Reject Selected": "拒绝已选",
  "Open First Selected": "打开首个已选",
  "Open Next Selected": "打开下一个已选",
  "Clear All": "清空全部",
  "Selected Queue": "已选队列",
  "Selection Actions": "选择操作",
  "Bulk Transition": "批量流转",
  "System Presets": "系统预设",
  "Your Presets (Recent First)": "你的预设（最近优先）",
  "Preset name": "预设名称",
  "Save Current": "保存当前",
  "No local presets saved yet.": "尚无本地预设。",
  "Review Queue": "审核队列",
  "Open (Requested)": "开放（待请求）",
  "Open (REQUESTED)": "开放（待请求）",
  "Select Filtered": "选择筛选结果",
  "Deselect Filtered": "取消选择筛选结果",
  "Select Page": "选择当前页",
  "Deselect Page": "取消选择当前页",
  "Linked Accounts": "关联账户",
  "Active Linked Accounts": "活跃关联账户",
  "Direct Referrals": "直属推荐",
  "Total Downline": "总下线",
  "Current parent context": "当前上级上下文",
  "No linked accounts": "暂无关联账户",
  "No direct referrals": "暂无直属推荐",
  "No live activity": "暂无活跃记录",
  "IB Coverage Stats": "代理覆盖统计",
  "Account Relationship Snapshot": "账户关系快照",
  "Created ": "创建于 ",
  ACTIVE: "活跃",
  INACTIVE: "停用",
  PENDING: "待处理",
  RESTRICTED: "受限",
  SUSPENDED: "已暂停",
  REQUESTED: "待请求",
  REVIEW: "审核中",
  APPROVED: "已批准",
  PROCESSING: "处理中",
  COMPLETED: "已完成",
  FAILED: "失败",
  CANCELLED: "已取消",
};

const WORD_EN_TO_ZH: Record<string, string> = {
  users: "用户",
  user: "用户",
  brokers: "经纪商",
  broker: "经纪商",
  accounts: "账户",
  account: "账户",
  withdrawals: "提现",
  withdrawal: "提现",
  status: "状态",
  statuses: "状态",
  requested: "待请求",
  review: "审核",
  approved: "已批准",
  processing: "处理中",
  completed: "已完成",
  failed: "失败",
  rejected: "已拒绝",
  cancelled: "已取消",
  pending: "待处理",
  active: "活跃",
  inactive: "停用",
  filters: "筛选",
  filter: "筛选",
  selected: "已选",
  select: "选择",
  deselect: "取消选择",
  queue: "队列",
  actions: "操作",
  action: "操作",
  optional: "可选",
  required: "必填",
  previous: "上一页",
  next: "下一页",
  identity: "身份",
  uplink: "上级",
  signal: "信号",
  coverage: "覆盖",
  relationship: "关系",
  direct: "直属",
  referrals: "推荐",
  referral: "推荐",
  linked: "关联",
  trader: "交易员",
  management: "管理",
  center: "中心",
  setting: "设置",
  settings: "设置",
  program: "系统",
  title: "标题",
  body: "正文",
  subject: "主题",
  message: "消息",
  created: "创建于",
};

const BASE_EN_TO_ZH = new Map<string, string>();
const RUNTIME_EN_TO_ZH = new Map<string, string>();

function hasChinese(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function collectEnToZhPairs(enNode: unknown, zhNode: unknown) {
  if (typeof enNode === "string" && typeof zhNode === "string") {
    const en = enNode.trim();
    const zh = zhNode.trim();
    if (en && zh && /[A-Za-z]/.test(en) && en !== zh) {
      BASE_EN_TO_ZH.set(en, zh);
    }
    return;
  }

  if (typeof enNode !== "object" || enNode === null) return;
  if (typeof zhNode !== "object" || zhNode === null) return;

  for (const [key, value] of Object.entries(enNode)) {
    collectEnToZhPairs(value, (zhNode as Record<string, unknown>)[key]);
  }
}

collectEnToZhPairs(adminTranslations.en, adminTranslations.zh);
for (const [en, zh] of Object.entries(STATIC_EN_TO_ZH)) {
  BASE_EN_TO_ZH.set(en, zh);
}

const PHRASE_RULES = [...BASE_EN_TO_ZH.entries()]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([en, zh]) => ({
    pattern: /^[A-Za-z0-9]+$/.test(en)
      ? new RegExp(`\\b${escapeRegExp(en)}\\b`, "gi")
      : new RegExp(escapeRegExp(en), "gi"),
    replacement: zh,
  }));

const WORD_RULES = Object.entries(WORD_EN_TO_ZH)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([en, zh]) => ({
    pattern: new RegExp(`\\b${escapeRegExp(en)}\\b`, "gi"),
    replacement: zh,
  }));

function shouldSkipTranslation(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (!/[A-Za-z]/.test(trimmed)) return true;
  if (/https?:\/\//i.test(trimmed)) return true;
  if (trimmed.includes("@")) return true;
  if (/^\/[A-Za-z0-9/_-]+$/.test(trimmed)) return true;
  if (/\b(?:USR|ACC|WDL|AXI|TM|VT|ICM)-\d+\b/i.test(trimmed)) return true;
  if (/\b0x[a-fA-F0-9]{8,}\b/.test(trimmed)) return true;
  if (/^[A-Z0-9_-]{3,}$/.test(trimmed) && /[0-9_-]/.test(trimmed)) return true;
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(trimmed)) {
    const domainWords = new Set([
      "user",
      "users",
      "account",
      "accounts",
      "status",
      "identity",
      "context",
      "case",
      "message",
      "announcement",
      "broadcast",
      "filter",
      "filters",
      "review",
      "queue",
      "support",
      "finance",
      "commission",
      "network",
      "broker",
      "brokers",
      "primary",
      "owned",
      "latest",
      "activity",
      "target",
      "subject",
      "title",
      "body",
    ]);

    const words = trimmed.split(/\s+/).map((word) => word.toLowerCase());
    if (!words.some((word) => domainWords.has(word))) {
      return true;
    }
  }
  return false;
}

function preservePadding(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function normalizeResiduals(value: string) {
  return value
    .replace(/All\s*状态\s*es/gi, "全部状态")
    .replace(/账户\s*s\b/gi, "账户")
    .replace(/推荐\s*s\b/gi, "推荐")
    .replace(/#{3,}/g, "");
}

function exactTranslate(trimmed: string) {
  return RUNTIME_EN_TO_ZH.get(trimmed) ?? BASE_EN_TO_ZH.get(trimmed);
}

function isSuspiciousRuntimeTranslation(source: string, translated: string) {
  if (!translated) return true;
  if (translated === source) return true;
  if (/#{3,}/.test(translated)) return true;
  if (/�/.test(translated)) return true;

  const sourceHasDate = /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(source);
  const translatedHasDate = /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(translated);
  if (!sourceHasDate && translatedHasDate && source.trim().split(/\s+/).length <= 5) {
    return true;
  }

  const sourceWordCount = (source.match(/[A-Za-z]+/g) ?? []).length;
  if (sourceWordCount <= 4 && translated.length > 36) {
    return true;
  }

  if (!hasChinese(translated) && /[A-Za-z]/.test(source)) {
    return true;
  }

  return false;
}

export function resetAdminRuntimeTranslations() {
  RUNTIME_EN_TO_ZH.clear();
}

export function registerAdminRuntimeTranslations(translations: Record<string, string>) {
  for (const [source, translated] of Object.entries(translations)) {
    const from = source.trim();
    const to = translated.trim();
    if (!from || !to || from === to) continue;
    if (!/[A-Za-z]/.test(from)) continue;
    if (isSuspiciousRuntimeTranslation(from, to)) continue;
    RUNTIME_EN_TO_ZH.set(from, to);
  }
}

export function autoTranslateAdminText(language: AdminLanguage, rawText: string) {
  if (language !== "zh") return rawText;
  if (shouldSkipTranslation(rawText)) return rawText;

  const trimmed = rawText.trim();
  const exact = exactTranslate(trimmed);
  if (exact) return preservePadding(rawText, exact);

  let translated = trimmed;
  for (const rule of PHRASE_RULES) {
    translated = translated.replace(rule.pattern, rule.replacement);
  }
  for (const rule of WORD_RULES) {
    translated = translated.replace(rule.pattern, rule.replacement);
  }

  translated = normalizeResiduals(translated);
  return preservePadding(rawText, translated);
}

function processAttributeValue(
  value: string,
  language: AdminLanguage,
  collectMissing?: Set<string>
) {
  const translated = autoTranslateAdminText(language, value);
  const hasEnglishAfterLocal = /[A-Za-z]/.test(translated.trim());
  const originalTrimmed = value.trim();
  if (
    collectMissing &&
    hasEnglishAfterLocal &&
    /[A-Za-z]/.test(originalTrimmed) &&
    !shouldSkipTranslation(originalTrimmed)
  ) {
    collectMissing.add(originalTrimmed);
  }
  return translated;
}

function translateElementAttributes(
  element: Element,
  language: AdminLanguage,
  collectMissing?: Set<string>
) {
  const attributeNames = ["placeholder", "title", "aria-label"] as const;
  for (const attr of attributeNames) {
    const value = element.getAttribute(attr);
    if (!value) continue;
    const translated = processAttributeValue(value, language, collectMissing);
    if (translated !== value) {
      element.setAttribute(attr, translated);
    }
  }
}

function translateTextNodes(root: Node, language: AdminLanguage, collectMissing?: Set<string>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    if (
      parent &&
      !["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"].includes(parent.tagName)
    ) {
      const original = node.nodeValue ?? "";
      const translated = autoTranslateAdminText(language, original);
      const hasEnglishAfterLocal = /[A-Za-z]/.test(translated.trim());
      const originalTrimmed = original.trim();

      if (
        collectMissing &&
        hasEnglishAfterLocal &&
        /[A-Za-z]/.test(originalTrimmed) &&
        !shouldSkipTranslation(originalTrimmed)
      ) {
        collectMissing.add(originalTrimmed);
      }

      if (translated !== original) {
        node.nodeValue = translated;
      }
    }

    node = walker.nextNode();
  }
}

export function collectAdminMissingTranslations(
  root: ParentNode,
  language: AdminLanguage,
  limit = 80
) {
  if (language !== "zh") return [];

  const missing = new Set<string>();
  translateTextNodes(root as unknown as Node, language, missing);
  root.querySelectorAll("*").forEach((element) => {
    translateElementAttributes(element, language, missing);
  });

  return Array.from(missing).slice(0, limit);
}

export function applyAdminAutoTranslation(root: ParentNode, language: AdminLanguage) {
  if (language !== "zh") return;
  translateTextNodes(root as unknown as Node, language);
  root.querySelectorAll("*").forEach((element) => {
    translateElementAttributes(element, language);
  });
}
