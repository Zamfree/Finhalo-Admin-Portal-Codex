-- Phase 2 (Validation Engine): persist row-level validation and batch summaries.
-- Additive migration, safe to re-run.

alter table if exists public.commission_batch_staging_rows
  add column if not exists validation_level text;

update public.commission_batch_staging_rows
set validation_level = 'pending'
where validation_level is null;

alter table if exists public.commission_batch_staging_rows
  alter column validation_level set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batch_staging_rows_validation_level_check'
  ) then
    alter table public.commission_batch_staging_rows
      add constraint commission_batch_staging_rows_validation_level_check
      check (validation_level in ('pending', 'valid', 'warning', 'error'));
  end if;
end $$;

alter table if exists public.commission_batch_staging_rows
  add column if not exists validation_issues jsonb;

update public.commission_batch_staging_rows
set validation_issues = '[]'::jsonb
where validation_issues is null;

alter table if exists public.commission_batch_staging_rows
  alter column validation_issues set default '[]'::jsonb;

alter table if exists public.commission_batch_staging_rows
  alter column validation_issues set not null;

alter table if exists public.commission_batch_staging_rows
  add column if not exists validation_run_at timestamptz;

alter table if exists public.commission_batch_staging_rows
  add column if not exists resolved_account_id text;

alter table if exists public.commission_batch_staging_rows
  add column if not exists resolved_trader_user_id text;

alter table if exists public.commission_batch_staging_rows
  add column if not exists duplicate_key text;

create index if not exists commission_batch_staging_rows_batch_validation_level_idx
  on public.commission_batch_staging_rows (batch_id, validation_level, row_number);

create index if not exists commission_batch_staging_rows_batch_duplicate_key_idx
  on public.commission_batch_staging_rows (batch_id, duplicate_key)
  where duplicate_key is not null;

alter table if exists public.commission_batches
  add column if not exists validation_summary jsonb;

alter table if exists public.commission_batches
  add column if not exists validation_completed_at timestamptz;
