import type { SearchWorkspaceData } from "@/app/admin/search/_types";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccounts } from "./accounts.service";
import { getAdminBrokers } from "./brokers.service";
import { getAdminCampaigns } from "./campaigns.service";
import { getAdminCommissionBatches } from "./commission.service";
import { getAdminWithdrawalRows } from "./finance.service";
import { getAdminSupportWorkspace } from "./support.service";
import { getAdminUsers } from "./users.service";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function getAdminSearchWorkspace(): Promise<SearchWorkspaceData> {
  try {
    const supabase = await createClient();
    const [
      usersResult,
      accountsResult,
      brokersResult,
      batchesResult,
      campaignsResult,
      withdrawalRequestsResult,
      legacyWithdrawalsResult,
      supportTicketsResult,
    ] = await Promise.all([
      supabase.from("users").select("user_id, email, display_name"),
      supabase.from("trading_accounts").select("account_id, account_number, user_id, user_display_name"),
      supabase.from("brokers").select("broker_id, broker_name, name, status"),
      supabase.from("commission_batches").select("batch_id, broker, status"),
      supabase.from("campaigns").select("campaign_id, name, type, status"),
      supabase
        .from("withdrawal_requests")
        .select("withdrawal_id, user_id, account_id, request_amount, status"),
      supabase
        .from("withdrawals")
        .select("withdrawal_id, user_id, beneficiary, account_id, amount, status"),
      supabase.from("support_tickets").select("ticket_id, subject, user_id, priority, status"),
    ]);

    if (
      !usersResult.error &&
      !accountsResult.error &&
      !brokersResult.error &&
      !batchesResult.error &&
      !campaignsResult.error &&
      !supportTicketsResult.error
    ) {
      const withdrawalRows =
        !withdrawalRequestsResult.error && withdrawalRequestsResult.data && withdrawalRequestsResult.data.length > 0
          ? (withdrawalRequestsResult.data as DbRow[])
          : !legacyWithdrawalsResult.error && legacyWithdrawalsResult.data
            ? (legacyWithdrawalsResult.data as DbRow[])
            : [];

      return {
        users: ((usersResult.data as DbRow[] | null) ?? []).map((row) => ({
          user_id: asString(row.user_id) || asString(row.id),
          email: asString(row.email, "unknown@search.local"),
          display_name:
            asString(row.display_name) ||
            asString(row.name) ||
            asString(row.email).split("@")[0] ||
            asString(row.user_id, "Unknown User"),
        })),
        tradingAccounts: ((accountsResult.data as DbRow[] | null) ?? []).map((row) => ({
          account_id: asString(row.account_id) || asString(row.id),
          account_number:
            asString(row.account_number) ||
            asString(row.account_code) ||
            asString(row.account_id),
          user_id: asString(row.user_id, "UNKNOWN"),
          display_name:
            asString(row.user_display_name) ||
            asString(row.display_name) ||
            asString(row.user_id, "Unknown User"),
        })),
        brokers: ((brokersResult.data as DbRow[] | null) ?? []).map((row) => ({
          broker_id: asString(row.broker_id) || asString(row.id),
          broker_name: asString(row.broker_name) || asString(row.name, "Unknown Broker"),
          status: asString(row.status, "active"),
        })),
        commissionBatches: ((batchesResult.data as DbRow[] | null) ?? []).map((row) => ({
          batch_id: asString(row.batch_id) || asString(row.id),
          broker: asString(row.broker, "Unknown Broker"),
          status: asString(row.status, "review"),
        })),
        campaigns: ((campaignsResult.data as DbRow[] | null) ?? []).map((row) => ({
          campaign_id: asString(row.campaign_id) || asString(row.id),
          name: asString(row.name, "Untitled Campaign"),
          type: asString(row.type, "trading"),
          status: asString(row.status, "scheduled"),
        })),
        withdrawals: withdrawalRows.map((row) => ({
          withdrawal_id: asString(row.withdrawal_id) || asString(row.id),
          user_id: asString(row.user_id, "UNKNOWN"),
          beneficiary:
            asString(row.beneficiary) ||
            asString(row.user_email) ||
            asString(row.user_id, "Unknown User"),
          account_id: asString(row.account_id) || null,
          amount: Number(row.request_amount ?? row.amount ?? 0),
          status: asString(row.status, "requested"),
        })),
        supportTickets: ((supportTicketsResult.data as DbRow[] | null) ?? []).map((row) => ({
          ticket_id: asString(row.ticket_id) || asString(row.id),
          subject: asString(row.subject, "Support case"),
          user_id: asString(row.user_id, "UNKNOWN"),
          priority: asString(row.priority, "medium"),
          status: asString(row.status, "open"),
        })),
      };
    }
  } catch {
    // Fall through to service-backed fallback.
  }

  const [users, accounts, brokers, batches, campaigns, withdrawals, supportWorkspace] = await Promise.all([
    getAdminUsers(),
    getAdminAccounts(),
    getAdminBrokers(),
    getAdminCommissionBatches(),
    getAdminCampaigns(),
    getAdminWithdrawalRows(),
    getAdminSupportWorkspace(),
  ]);

  return {
    users: users.map((user) => ({
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
    })),
    tradingAccounts: accounts.map((account) => ({
      account_id: account.account_id,
      account_number: account.account_id,
      user_id: account.user_id,
      display_name: account.user_display_name,
    })),
    brokers: brokers.rows.map((broker) => ({
      broker_id: broker.broker_id,
      broker_name: broker.broker_name,
      status: broker.status,
    })),
    commissionBatches: batches.map((batch) => ({
      batch_id: batch.batch_id,
      broker: batch.broker,
      status: batch.status,
    })),
    campaigns: campaigns.map((campaign) => ({
      campaign_id: campaign.campaign_id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
    })),
    withdrawals: withdrawals.map((withdrawal) => ({
      withdrawal_id: withdrawal.withdrawal_id,
      user_id: withdrawal.user_id,
      beneficiary: withdrawal.beneficiary,
      account_id: withdrawal.account_id,
      amount: withdrawal.request_amount,
      status: withdrawal.status,
    })),
    supportTickets: supportWorkspace.tickets.map((ticket) => ({
      ticket_id: ticket.ticket_id,
      subject: ticket.subject,
      user_id: ticket.user_id,
      priority: ticket.priority,
      status: ticket.status,
    })),
  };
}
