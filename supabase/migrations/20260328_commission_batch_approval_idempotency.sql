-- Harden commission batch approval idempotency on finance_ledger.
-- This migration is additive and safe to re-run.

alter table if exists public.finance_ledger
  add column if not exists reference_type text;

alter table if exists public.finance_ledger
  add column if not exists reference_id text;

create unique index if not exists finance_ledger_commission_batch_approval_reference_uidx
  on public.finance_ledger (reference_type, reference_id)
  where reference_type = 'commission_batch_approval'
    and reference_id is not null;

create index if not exists commission_batches_status_idx
  on public.commission_batches (status);
