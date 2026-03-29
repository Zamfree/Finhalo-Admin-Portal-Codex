-- Phase 2 (Upload + Mapping): staging-first commission ingestion.
-- Additive migration, safe to re-run.

create extension if not exists pgcrypto;

alter table if exists public.commission_batches
  add column if not exists upload_fingerprint text;

alter table if exists public.commission_batches
  add column if not exists upload_row_count integer;

alter table if exists public.commission_batches
  add column if not exists source_columns jsonb;

alter table if exists public.commission_batches
  add column if not exists mapping_template_id uuid;

alter table if exists public.commission_batches
  add column if not exists mapping_status text;

alter table if exists public.commission_batches
  add column if not exists mapping_completed_at timestamptz;

update public.commission_batches
set mapping_status = 'pending'
where mapping_status is null;

alter table if exists public.commission_batches
  alter column mapping_status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batches_mapping_status_check'
  ) then
    alter table public.commission_batches
      add constraint commission_batches_mapping_status_check
      check (mapping_status in ('pending', 'mapped', 'failed'));
  end if;
end $$;

create unique index if not exists commission_batches_broker_upload_fingerprint_uidx
  on public.commission_batches (broker, upload_fingerprint)
  where upload_fingerprint is not null;

create table if not exists public.commission_import_templates (
  template_id uuid primary key default gen_random_uuid(),
  broker text not null,
  template_name text not null,
  mappings jsonb not null,
  required_fields jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists commission_import_templates_broker_name_uidx
  on public.commission_import_templates (broker, template_name);

create index if not exists commission_import_templates_broker_idx
  on public.commission_import_templates (broker, is_default);

create table if not exists public.commission_batch_staging_rows (
  staging_id bigserial primary key,
  batch_id text not null references public.commission_batches(batch_id) on delete cascade,
  row_number integer not null,
  raw_row jsonb not null,
  broker text,
  account_id text,
  account_number text,
  commission_amount numeric(20,8),
  commission_date timestamptz,
  volume numeric(20,8),
  symbol text,
  currency text,
  account_type text,
  mapping_status text not null default 'pending',
  mapping_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batch_staging_rows_batch_row_uidx'
  ) then
    alter table public.commission_batch_staging_rows
      add constraint commission_batch_staging_rows_batch_row_uidx
      unique (batch_id, row_number);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batch_staging_rows_mapping_status_check'
  ) then
    alter table public.commission_batch_staging_rows
      add constraint commission_batch_staging_rows_mapping_status_check
      check (mapping_status in ('pending', 'mapped', 'failed'));
  end if;
end $$;

create index if not exists commission_batch_staging_rows_batch_status_idx
  on public.commission_batch_staging_rows (batch_id, mapping_status, row_number);

