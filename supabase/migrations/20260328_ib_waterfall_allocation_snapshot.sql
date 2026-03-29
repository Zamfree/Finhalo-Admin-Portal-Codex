-- Persist immutable waterfall allocation snapshots for commission approvals.
-- Additive and safe to re-run.

alter table if exists public.rebate_records
  add column if not exists source_commission_id text;

alter table if exists public.rebate_records
  add column if not exists trader_account_id text;

alter table if exists public.rebate_records
  add column if not exists trader_user_id text;

alter table if exists public.rebate_records
  add column if not exists l1_user_id text;

alter table if exists public.rebate_records
  add column if not exists l2_user_id text;

alter table if exists public.rebate_records
  add column if not exists l2_rate numeric;

alter table if exists public.rebate_records
  add column if not exists c_split_rate numeric;

alter table if exists public.rebate_records
  add column if not exists gross_commission numeric;

alter table if exists public.rebate_records
  add column if not exists allocation_ref text;

alter table if exists public.rebate_records
  add column if not exists allocation_snapshot jsonb;

create unique index if not exists rebate_records_allocation_ref_uidx
  on public.rebate_records (allocation_ref)
  where allocation_ref is not null;

alter table if exists public.finance_ledger
  add column if not exists source_commission_id text;

alter table if exists public.finance_ledger
  add column if not exists allocation_snapshot jsonb;
