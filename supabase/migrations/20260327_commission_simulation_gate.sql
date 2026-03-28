-- Standardize commission simulation gate metadata on commission_batches.
-- This migration adds explicit simulation tracking fields that are used by
-- admin approval workflow gating.

alter table if exists public.commission_batches
  add column if not exists simulation_status text;

alter table if exists public.commission_batches
  add column if not exists simulation_completed_at timestamptz;

-- Normalize empty status values.
update public.commission_batches
set simulation_status = null
where simulation_status is not null
  and btrim(simulation_status) = '';

-- Backfill from already-processed commission records.
update public.commission_batches as cb
set simulation_status = 'completed',
    simulation_completed_at = coalesce(cb.simulation_completed_at, now())
where exists (
  select 1
  from public.commission_records as cr
  where cr.batch_id = cb.batch_id
    and lower(coalesce(cr.status, '')) = 'processed'
);

-- Default remaining rows to pending if no explicit status exists.
update public.commission_batches
set simulation_status = 'pending'
where simulation_status is null;

alter table if exists public.commission_batches
  alter column simulation_status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batches_simulation_status_check'
  ) then
    alter table public.commission_batches
      add constraint commission_batches_simulation_status_check
      check (simulation_status in ('pending', 'completed', 'failed'));
  end if;
end $$;

create index if not exists commission_batches_simulation_status_idx
  on public.commission_batches (simulation_status);
