-- Phase 2 (Resolution + Simulation): staging corrections, exclusion, simulation traceability.
-- Additive migration, safe to re-run.

alter table if exists public.commission_batch_staging_rows
  add column if not exists resolution_status text;

update public.commission_batch_staging_rows
set resolution_status = 'pending'
where resolution_status is null;

alter table if exists public.commission_batch_staging_rows
  alter column resolution_status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batch_staging_rows_resolution_status_check'
  ) then
    alter table public.commission_batch_staging_rows
      add constraint commission_batch_staging_rows_resolution_status_check
      check (resolution_status in ('pending', 'resolved', 'ignored'));
  end if;
end $$;

alter table if exists public.commission_batch_staging_rows
  add column if not exists resolution_notes text;

alter table if exists public.commission_batch_staging_rows
  add column if not exists override_payload jsonb;

update public.commission_batch_staging_rows
set override_payload = '{}'::jsonb
where override_payload is null;

alter table if exists public.commission_batch_staging_rows
  alter column override_payload set default '{}'::jsonb;

alter table if exists public.commission_batch_staging_rows
  alter column override_payload set not null;

alter table if exists public.commission_batch_staging_rows
  add column if not exists excluded_from_downstream boolean;

update public.commission_batch_staging_rows
set excluded_from_downstream = false
where excluded_from_downstream is null;

alter table if exists public.commission_batch_staging_rows
  alter column excluded_from_downstream set default false;

alter table if exists public.commission_batch_staging_rows
  alter column excluded_from_downstream set not null;

alter table if exists public.commission_batch_staging_rows
  add column if not exists resolved_by text;

alter table if exists public.commission_batch_staging_rows
  add column if not exists resolved_at timestamptz;

create index if not exists commission_batch_staging_rows_resolution_status_idx
  on public.commission_batch_staging_rows (batch_id, resolution_status, row_number);

create index if not exists commission_batch_staging_rows_excluded_idx
  on public.commission_batch_staging_rows (batch_id, excluded_from_downstream, row_number);

alter table if exists public.commission_batches
  add column if not exists resolution_status text;

update public.commission_batches
set resolution_status = 'pending'
where resolution_status is null;

alter table if exists public.commission_batches
  alter column resolution_status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batches_resolution_status_check'
  ) then
    alter table public.commission_batches
      add constraint commission_batches_resolution_status_check
      check (resolution_status in ('pending', 'in_progress', 'completed'));
  end if;
end $$;

alter table if exists public.commission_batches
  add column if not exists resolution_completed_at timestamptz;

alter table if exists public.commission_batches
  add column if not exists resolution_summary jsonb;

alter table if exists public.commission_batches
  add column if not exists simulation_summary jsonb;

alter table if exists public.commission_batches
  add column if not exists simulation_error_summary jsonb;
