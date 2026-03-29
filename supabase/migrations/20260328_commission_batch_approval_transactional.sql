-- Phase 1 hardening: transactional commission batch approval pipeline.
-- This migration is additive and safe to re-run.

alter table if exists public.commission_batches
  add column if not exists environment text not null default 'live';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_batches_environment_check'
  ) then
    alter table public.commission_batches
      add constraint commission_batches_environment_check
      check (environment in ('live', 'test'));
  end if;
end $$;

alter table if exists public.rebate_records
  add column if not exists source_batch_id text;

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
  add column if not exists l2_rate numeric(20,8);

alter table if exists public.rebate_records
  add column if not exists c_split_rate numeric(20,8);

alter table if exists public.rebate_records
  add column if not exists gross_commission numeric(20,8);

alter table if exists public.rebate_records
  add column if not exists allocation_ref text;

alter table if exists public.rebate_records
  add column if not exists allocation_snapshot jsonb;

create unique index if not exists rebate_records_allocation_ref_uidx
  on public.rebate_records (allocation_ref);

alter table if exists public.finance_ledger
  add column if not exists reference_type text;

alter table if exists public.finance_ledger
  add column if not exists reference_id text;

alter table if exists public.finance_ledger
  add column if not exists source_batch_id text;

alter table if exists public.finance_ledger
  add column if not exists source_commission_id text;

alter table if exists public.finance_ledger
  add column if not exists related_rebate_record text;

alter table if exists public.finance_ledger
  add column if not exists allocation_snapshot jsonb;

create unique index if not exists finance_ledger_commission_batch_approval_reference_uidx
  on public.finance_ledger (reference_type, reference_id)
  where reference_type = 'commission_batch_approval'
    and reference_id is not null;

alter table if exists public.ib_relationships
  add column if not exists effective_from timestamptz;

alter table if exists public.ib_relationships
  add column if not exists effective_to timestamptz;

update public.ib_relationships
set effective_from = created_at
where effective_from is null
  and created_at is not null;

create index if not exists ib_relationships_account_effective_idx
  on public.ib_relationships (account_id, effective_from desc, effective_to);

create index if not exists ib_relationships_account_effective_resolved_idx
  on public.ib_relationships (account_id, coalesce(effective_from, created_at) desc, effective_to);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ib_relationships_effective_window_check'
  ) then
    alter table public.ib_relationships
      add constraint ib_relationships_effective_window_check
      check (effective_to is null or effective_from is null or effective_to > effective_from);
  end if;
end $$;

create or replace function public.finhalo_try_parse_numeric(value_text text)
returns numeric
language plpgsql
immutable
as $$
declare
  parsed numeric;
begin
  if value_text is null or btrim(value_text) = '' then
    return null;
  end if;

  begin
    parsed := value_text::numeric;
  exception
    when others then
      return null;
  end;

  return parsed;
end;
$$;

create or replace function public.finhalo_try_parse_timestamptz(value_text text)
returns timestamptz
language plpgsql
immutable
as $$
declare
  parsed timestamptz;
begin
  if value_text is null or btrim(value_text) = '' then
    return null;
  end if;

  begin
    parsed := value_text::timestamptz;
  exception
    when others then
      return null;
  end;

  return parsed;
end;
$$;

create or replace function public.finhalo_normalize_rate(value_text text)
returns numeric
language plpgsql
immutable
as $$
declare
  parsed numeric;
begin
  parsed := public.finhalo_try_parse_numeric(value_text);

  if parsed is null or parsed < 0 then
    return null;
  end if;

  if parsed <= 1 then
    return parsed;
  end if;

  if parsed <= 100 then
    return parsed / 100;
  end if;

  return null;
end;
$$;

drop function if exists public.admin_confirm_commission_batch(text);

create or replace function public.admin_confirm_commission_batch(p_batch_id text)
returns table (
  batch_id text,
  environment text,
  rebates_created integer,
  rebates_reused integer,
  ledger_created integer,
  ledger_reused integer,
  final_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_json jsonb;
  v_environment text;
  v_existing_status text;
  v_simulation_completed_at text;
  v_simulation_status text;
  v_record_json jsonb;
  v_relationship_json jsonb;
  v_account_id text;
  v_account_number text;
  v_resolved_account_id text;
  v_trader_user_id text;
  v_account_user_id text;
  v_l1_user_id text;
  v_l2_user_id text;
  v_relationship_snapshot_id text;
  v_commission_business_id text;
  v_commission_ts timestamptz;
  v_gross_commission numeric(20,8);
  v_platform_rate numeric(20,8);
  v_l2_rate numeric(20,8);
  v_c_split_rate numeric(20,8);
  v_platform_amount numeric(20,8);
  v_min_platform_amount numeric(20,8);
  v_l2_amount numeric(20,8);
  v_pool_amount numeric(20,8);
  v_trader_amount numeric(20,8);
  v_l1_amount numeric(20,8);
  v_role text;
  v_beneficiary_user_id text;
  v_allocation_amount numeric(20,8);
  v_allocation_ref text;
  v_rebate_business_id text;
  v_ledger_ref text;
  v_allocation_snapshot jsonb;
  v_existing_rebate_json jsonb;
  v_existing_ledger_json jsonb;
  v_existing_rebate_amount numeric(20,8);
  v_existing_ledger_amount numeric(20,8);
  v_rebate_record_id text;
  v_existing_rebate_beneficiary text;
  v_existing_rebate_type text;
  v_existing_rebate_account_id text;
  v_existing_rebate_allocation_ref text;
  v_existing_rebate_source_batch_id text;
  v_existing_rebate_source_commission_id text;
  v_existing_rebate_snapshot_id text;
  v_existing_ledger_reference_type text;
  v_existing_ledger_reference_id text;
  v_existing_ledger_user_id text;
  v_existing_ledger_account_id text;
  v_existing_ledger_direction text;
  v_existing_ledger_transaction_type text;
  v_existing_ledger_related_rebate_record text;
  v_existing_ledger_source_batch_id text;
  v_existing_ledger_source_commission_id text;
  v_affected_rows integer;
  v_row_number integer := 0;
  v_rebates_created integer := 0;
  v_rebates_reused integer := 0;
  v_ledger_created integer := 0;
  v_ledger_reused integer := 0;
  v_calc_epsilon constant numeric(20,8) := 0.00000100;
  v_min_platform_rate constant numeric(20,8) := 0.10000000;
begin
  if p_batch_id is null or btrim(p_batch_id) = '' then
    raise exception 'Batch ID is required.';
  end if;

  update public.commission_batches as cb
  set status = 'locked'
  where cb.batch_id = p_batch_id
    and lower(coalesce(cb.status, '')) = 'validated'
  returning to_jsonb(cb)
  into v_batch_json;

  if v_batch_json is null then
    select lower(coalesce(cb.status, ''))
    into v_existing_status
    from public.commission_batches as cb
    where cb.batch_id = p_batch_id
    limit 1;

    if v_existing_status is null then
      raise exception 'Unable to approve batch %: batch not found.', p_batch_id;
    elsif v_existing_status in ('confirmed', 'locked') then
      raise exception 'Batch % has already been approved and cannot be approved again.', p_batch_id;
    elsif v_existing_status in ('cancelled', 'rolled_back') then
      raise exception 'Batch % is %. Reset status before approval.', p_batch_id, v_existing_status;
    else
      raise exception 'Batch % is "%". Only validated batches can be approved.', p_batch_id, v_existing_status;
    end if;
  end if;

  if coalesce(public.finhalo_try_parse_numeric(v_batch_json ->> 'failed_rows'), 0) > 0 then
    raise exception 'Batch % still has failed rows and cannot be approved.', p_batch_id;
  end if;

  if lower(coalesce(v_batch_json ->> 'validation_result', 'passed')) <> 'passed' then
    raise exception 'Batch % validation state is "%", approval blocked.',
      p_batch_id, coalesce(v_batch_json ->> 'validation_result', 'unknown');
  end if;

  if lower(coalesce(v_batch_json ->> 'duplicate_result', 'clear')) <> 'clear' then
    raise exception 'Batch % duplicate review is "%", approval blocked.',
      p_batch_id, coalesce(v_batch_json ->> 'duplicate_result', 'unknown');
  end if;

  v_simulation_completed_at := nullif(v_batch_json ->> 'simulation_completed_at', '');
  v_simulation_status := lower(coalesce(v_batch_json ->> 'simulation_status', ''));
  if v_simulation_completed_at is null and v_simulation_status not in ('completed', 'done') then
    raise exception 'Batch % must complete simulation before approval.', p_batch_id;
  end if;

  v_environment := case
    when lower(coalesce(v_batch_json ->> 'environment', 'live')) = 'test' then 'test'
    else 'live'
  end;

  for v_record_json in
    select to_jsonb(cr)
    from public.commission_records as cr
    where cr.batch_id = p_batch_id
    order by cr.commission_date asc nulls last, cr.commission_id asc nulls last
  loop
    v_row_number := v_row_number + 1;

    v_commission_business_id := coalesce(
      nullif(v_record_json ->> 'commission_id', ''),
      p_batch_id || '-ROW-' || v_row_number::text
    );

    v_gross_commission := coalesce(
      public.finhalo_try_parse_numeric(v_record_json ->> 'gross_commission'),
      public.finhalo_try_parse_numeric(v_record_json ->> 'commission_amount'),
      0
    );

    if v_gross_commission < 0 then
      raise exception 'Commission % gross commission cannot be negative.', v_commission_business_id;
    end if;

    if v_gross_commission = 0 then
      continue;
    end if;

    v_commission_ts := public.finhalo_try_parse_timestamptz(v_record_json ->> 'commission_date');
    if v_commission_ts is null then
      raise exception 'Commission % has invalid commission_date "%".',
        v_commission_business_id, coalesce(v_record_json ->> 'commission_date', '');
    end if;

    v_account_id := nullif(v_record_json ->> 'account_id', '');
    v_account_number := nullif(v_record_json ->> 'account_number', '');
    v_account_user_id := null;
    v_resolved_account_id := v_account_id;

    if v_resolved_account_id is null or nullif(v_record_json ->> 'trader_user_id', '') is null then
      select ta.account_id, ta.user_id
      into v_resolved_account_id, v_account_user_id
      from public.trading_accounts as ta
      where (
        v_account_id is not null and ta.account_id = v_account_id
      ) or (
        v_account_number is not null and ta.account_number = v_account_number
      )
      order by case when v_account_id is not null and ta.account_id = v_account_id then 0 else 1 end
      limit 1;
    end if;

    v_resolved_account_id := coalesce(v_resolved_account_id, v_account_number);

    if v_resolved_account_id is null then
      raise exception 'Commission % failed account-level relationship resolution (missing account_id/account_number).',
        v_commission_business_id;
    end if;

    select to_jsonb(ir)
    into v_relationship_json
    from public.ib_relationships as ir
    where ir.account_id = v_resolved_account_id
      and coalesce(ir.effective_from, ir.created_at) is not null
      and coalesce(ir.effective_from, ir.created_at) <= v_commission_ts
      and (ir.effective_to is null or ir.effective_to > v_commission_ts)
    order by coalesce(ir.effective_from, ir.created_at) desc, ir.created_at desc nulls last
    limit 1;

    if v_relationship_json is null then
      if exists (
        select 1
        from public.ib_relationships as ir
        where ir.account_id = v_resolved_account_id
          and ir.effective_from is null
          and ir.created_at is null
      ) then
        raise exception 'Commission % cannot resolve historical relationship for account %: relationship rows are missing both effective_from and created_at.',
          v_commission_business_id, v_resolved_account_id;
      end if;

      raise exception 'Commission % has no effective ib_relationships snapshot for account % at %.',
        v_commission_business_id, v_resolved_account_id, v_commission_ts;
    end if;

    v_trader_user_id := coalesce(
      nullif(v_relationship_json ->> 'trader_user_id', ''),
      nullif(v_relationship_json ->> 'trader_id', ''),
      v_account_user_id,
      nullif(v_record_json ->> 'trader_user_id', ''),
      nullif(v_record_json ->> 'user_id', '')
    );

    if v_trader_user_id is null then
      raise exception 'Commission % failed trader resolution for account %.',
        v_commission_business_id, v_resolved_account_id;
    end if;

    v_l1_user_id := coalesce(
      nullif(v_relationship_json ->> 'l1_ib_id', ''),
      nullif(v_record_json ->> 'l1_ib_id', '')
    );
    v_l2_user_id := coalesce(
      nullif(v_relationship_json ->> 'l2_ib_id', ''),
      nullif(v_record_json ->> 'l2_ib_id', '')
    );

    if v_l2_user_id is not null and v_l2_user_id = v_trader_user_id then
      raise exception 'Commission % invalid relationship: L2 (%) cannot equal trader (%).',
        v_commission_business_id, v_l2_user_id, v_trader_user_id;
    end if;

    v_relationship_snapshot_id := coalesce(
      nullif(v_relationship_json ->> 'snapshot_id', ''),
      nullif(v_relationship_json ->> 'relationship_snapshot_id', ''),
      nullif(v_relationship_json ->> 'id', ''),
      nullif(v_record_json ->> 'relationship_snapshot_id', ''),
      'REL-' || v_resolved_account_id
    );

    v_platform_rate := greatest(
      coalesce(
        public.finhalo_normalize_rate(v_record_json ->> 'platform_rate'),
        public.finhalo_normalize_rate(v_record_json ->> 'admin_fee_rate'),
        public.finhalo_normalize_rate(v_record_json ->> 'admin_rate'),
        public.finhalo_normalize_rate(v_record_json ->> 'platform_fee_rate'),
        public.finhalo_normalize_rate(v_relationship_json ->> 'platform_rate'),
        public.finhalo_normalize_rate(v_relationship_json ->> 'admin_fee_rate'),
        public.finhalo_normalize_rate(v_relationship_json ->> 'admin_rate'),
        v_min_platform_rate
      ),
      v_min_platform_rate
    );

    v_l2_rate := coalesce(
      public.finhalo_normalize_rate(v_record_json ->> 'l2_rate'),
      public.finhalo_normalize_rate(v_record_json ->> 'l2_rebate_rate'),
      public.finhalo_normalize_rate(v_relationship_json ->> 'l2_rate'),
      public.finhalo_normalize_rate(v_relationship_json ->> 'l2_rebate_rate'),
      public.finhalo_normalize_rate(v_relationship_json ->> 'l2_commission_rate')
    );

    if v_l2_user_id is null then
      v_l2_rate := 0;
    elsif v_l2_rate is null and v_gross_commission > 0 then
      v_l2_rate := public.finhalo_try_parse_numeric(v_record_json ->> 'l2_amount') / v_gross_commission;
    end if;

    if v_l2_rate is null or v_l2_rate < 0 or v_l2_rate > 1 then
      raise exception 'Commission % has invalid l2_rate for account %.',
        v_commission_business_id, v_resolved_account_id;
    end if;

    v_platform_amount := round(v_gross_commission * v_platform_rate, 8);
    v_min_platform_amount := round(v_gross_commission * v_min_platform_rate, 8);

    if v_platform_amount + v_calc_epsilon < v_min_platform_amount then
      raise exception 'Commission % platform retention (%) is below 10%% minimum.',
        v_commission_business_id, v_platform_amount;
    end if;

    v_l2_amount := case when v_l2_user_id is null then 0 else round(v_gross_commission * v_l2_rate, 8) end;
    v_pool_amount := round(v_gross_commission - v_platform_amount - v_l2_amount, 8);

    if v_pool_amount < -v_calc_epsilon then
      raise exception 'Commission % produces negative pool (gross=%, platform=%, l2=%).',
        v_commission_business_id, v_gross_commission, v_platform_amount, v_l2_amount;
    end if;

    if v_pool_amount < 0 then
      v_pool_amount := 0;
    end if;

    v_c_split_rate := coalesce(
      public.finhalo_normalize_rate(v_record_json ->> 'c_split_rate'),
      public.finhalo_normalize_rate(v_record_json ->> 'trader_split_rate'),
      public.finhalo_normalize_rate(v_record_json ->> 'trader_rate'),
      public.finhalo_normalize_rate(v_relationship_json ->> 'c_split_rate'),
      public.finhalo_normalize_rate(v_relationship_json ->> 'trader_split_rate'),
      public.finhalo_normalize_rate(v_relationship_json ->> 'trader_rate')
    );

    if v_l1_user_id is null then
      v_c_split_rate := 1;
    elsif v_c_split_rate is null and v_pool_amount > 0 then
      v_c_split_rate := public.finhalo_try_parse_numeric(v_record_json ->> 'trader_amount') / v_pool_amount;
    end if;

    if v_c_split_rate is null or v_c_split_rate < 0 or v_c_split_rate > 1 then
      raise exception 'Commission % has invalid c_split_rate for account %.',
        v_commission_business_id, v_resolved_account_id;
    end if;

    v_trader_amount := case
      when v_l1_user_id is null then v_pool_amount
      else round(v_pool_amount * v_c_split_rate, 8)
    end;
    v_l1_amount := case
      when v_l1_user_id is null then 0
      else round(v_pool_amount - v_trader_amount, 8)
    end;

    if v_trader_amount < -v_calc_epsilon or v_l1_amount < -v_calc_epsilon then
      raise exception 'Commission % produced invalid waterfall amounts (trader=%, l1=%).',
        v_commission_business_id, v_trader_amount, v_l1_amount;
    end if;

    for v_role, v_beneficiary_user_id, v_allocation_amount in
      select *
      from (
        values
          ('l2'::text, v_l2_user_id, v_l2_amount),
          ('trader'::text, v_trader_user_id, v_trader_amount),
          ('l1'::text, v_l1_user_id, v_l1_amount)
      ) as allocations(role, beneficiary_user_id, amount)
      where beneficiary_user_id is not null
        and amount > v_calc_epsilon
    loop
      v_allocation_ref := p_batch_id || ':' || v_commission_business_id || ':' || v_role;
      v_rebate_business_id := 'REB-' || regexp_replace(v_allocation_ref, '[^A-Za-z0-9_-]', '-', 'g');
      v_ledger_ref := 'LED-COMM-BATCH:' || v_allocation_ref;

      v_allocation_snapshot := jsonb_build_object(
        'trader_account_id', v_resolved_account_id,
        'trader_user_id', v_trader_user_id,
        'l1_user_id', v_l1_user_id,
        'l2_user_id', v_l2_user_id,
        'relationship_snapshot_id', v_relationship_snapshot_id,
        'platform_rate', v_platform_rate,
        'l2_rate', v_l2_rate,
        'c_split_rate', v_c_split_rate,
        'gross_commission', v_gross_commission,
        'platform_amount', v_platform_amount,
        'l2_amount', v_l2_amount,
        'pool_amount', v_pool_amount,
        'trader_amount', v_trader_amount,
        'l1_amount', v_l1_amount,
        'commission_date', v_commission_ts,
        'source_batch_id', p_batch_id,
        'source_commission_id', v_commission_business_id,
        'allocation_ref', v_allocation_ref,
        'allocation_role', v_role
      );

      insert into public.rebate_records (
        rebate_id,
        beneficiary,
        account_id,
        amount,
        rebate_type,
        relationship_snapshot_id,
        status,
        source_batch_id,
        source_commission_id,
        trader_account_id,
        trader_user_id,
        l1_user_id,
        l2_user_id,
        l2_rate,
        c_split_rate,
        gross_commission,
        allocation_ref,
        allocation_snapshot,
        created_at
      )
      values (
        v_rebate_business_id,
        v_beneficiary_user_id,
        v_resolved_account_id,
        v_allocation_amount,
        v_role,
        v_relationship_snapshot_id,
        'posted',
        p_batch_id,
        v_commission_business_id,
        v_resolved_account_id,
        v_trader_user_id,
        v_l1_user_id,
        v_l2_user_id,
        v_l2_rate,
        v_c_split_rate,
        v_gross_commission,
        v_allocation_ref,
        v_allocation_snapshot,
        now()
      )
      on conflict do nothing;

      get diagnostics v_affected_rows = row_count;

      if v_affected_rows = 1 then
        v_rebate_record_id := v_rebate_business_id;
        v_rebates_created := v_rebates_created + 1;
      else
        select to_jsonb(rr)
        into v_existing_rebate_json
        from public.rebate_records as rr
        where rr.allocation_ref = v_allocation_ref
        limit 1;

        if v_existing_rebate_json is null then
          select to_jsonb(rr)
          into v_existing_rebate_json
          from public.rebate_records as rr
          where rr.rebate_id = v_rebate_business_id
          limit 1;
        end if;

        if v_existing_rebate_json is null then
          raise exception 'Unable to locate existing rebate record for allocation_ref %.', v_allocation_ref;
        end if;

        v_existing_rebate_amount := coalesce(
          public.finhalo_try_parse_numeric(v_existing_rebate_json ->> 'amount'),
          public.finhalo_try_parse_numeric(v_existing_rebate_json ->> 'rebate_amount'),
          0
        );
        v_existing_rebate_beneficiary := coalesce(nullif(v_existing_rebate_json ->> 'beneficiary', ''), '');
        v_existing_rebate_type := lower(coalesce(nullif(v_existing_rebate_json ->> 'rebate_type', ''), ''));
        v_existing_rebate_account_id := coalesce(nullif(v_existing_rebate_json ->> 'account_id', ''), '');
        v_existing_rebate_allocation_ref := coalesce(nullif(v_existing_rebate_json ->> 'allocation_ref', ''), '');
        v_existing_rebate_source_batch_id := coalesce(nullif(v_existing_rebate_json ->> 'source_batch_id', ''), '');
        v_existing_rebate_source_commission_id := coalesce(nullif(v_existing_rebate_json ->> 'source_commission_id', ''), '');
        v_existing_rebate_snapshot_id := coalesce(nullif(v_existing_rebate_json ->> 'relationship_snapshot_id', ''), '');
        v_rebate_record_id := coalesce(
          nullif(v_existing_rebate_json ->> 'rebate_id', ''),
          nullif(v_existing_rebate_json ->> 'id', ''),
          v_rebate_business_id
        );

        if abs(v_existing_rebate_amount - v_allocation_amount) > v_calc_epsilon then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (existing amount=%, expected=%).',
            v_allocation_ref, v_existing_rebate_amount, v_allocation_amount;
        end if;

        if v_existing_rebate_beneficiary <> v_beneficiary_user_id then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (beneficiary mismatch).',
            v_allocation_ref;
        end if;

        if v_existing_rebate_type <> v_role then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (rebate_type mismatch).',
            v_allocation_ref;
        end if;

        if v_existing_rebate_account_id <> v_resolved_account_id then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (account mismatch).',
            v_allocation_ref;
        end if;

        if v_existing_rebate_allocation_ref <> v_allocation_ref then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (business key mismatch).',
            v_allocation_ref;
        end if;

        if v_existing_rebate_source_batch_id <> p_batch_id then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (source_batch_id mismatch).',
            v_allocation_ref;
        end if;

        if v_existing_rebate_source_commission_id <> v_commission_business_id then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (source_commission_id mismatch).',
            v_allocation_ref;
        end if;

        if v_existing_rebate_snapshot_id <> v_relationship_snapshot_id then
          raise exception 'Rebate idempotency mismatch for allocation_ref % (relationship_snapshot_id mismatch).',
            v_allocation_ref;
        end if;

        v_rebates_reused := v_rebates_reused + 1;
      end if;

      if v_environment = 'live' then
        insert into public.finance_ledger (
          ledger_ref,
          reference_type,
          reference_id,
          transaction_type,
          user_id,
          account_id,
          amount,
          direction,
          status,
          related_rebate_record,
          source_batch_id,
          source_commission_id,
          allocation_snapshot,
          created_at
        )
        values (
          v_ledger_ref,
          'commission_batch_approval',
          v_allocation_ref,
          'rebate_settlement',
          v_beneficiary_user_id,
          v_resolved_account_id,
          abs(v_allocation_amount),
          'credit',
          'posted',
          v_rebate_record_id,
          p_batch_id,
          v_commission_business_id,
          v_allocation_snapshot,
          now()
        )
        on conflict do nothing;

        get diagnostics v_affected_rows = row_count;

        if v_affected_rows = 1 then
          v_ledger_created := v_ledger_created + 1;
        else
          select to_jsonb(fl)
          into v_existing_ledger_json
          from public.finance_ledger as fl
          where fl.reference_type = 'commission_batch_approval'
            and fl.reference_id = v_allocation_ref
          limit 1;

          if v_existing_ledger_json is null then
            select to_jsonb(fl)
            into v_existing_ledger_json
            from public.finance_ledger as fl
            where fl.ledger_ref = v_ledger_ref
            limit 1;
          end if;

          if v_existing_ledger_json is null then
            raise exception 'Unable to locate existing ledger record for reference_id %.', v_allocation_ref;
          end if;

          v_existing_ledger_amount := coalesce(public.finhalo_try_parse_numeric(v_existing_ledger_json ->> 'amount'), 0);
          v_existing_ledger_reference_type := lower(coalesce(nullif(v_existing_ledger_json ->> 'reference_type', ''), ''));
          v_existing_ledger_reference_id := coalesce(nullif(v_existing_ledger_json ->> 'reference_id', ''), '');
          v_existing_ledger_user_id := coalesce(nullif(v_existing_ledger_json ->> 'user_id', ''), '');
          v_existing_ledger_account_id := coalesce(nullif(v_existing_ledger_json ->> 'account_id', ''), '');
          v_existing_ledger_direction := lower(coalesce(nullif(v_existing_ledger_json ->> 'direction', ''), ''));
          v_existing_ledger_transaction_type := lower(coalesce(nullif(v_existing_ledger_json ->> 'transaction_type', ''), ''));
          v_existing_ledger_related_rebate_record := coalesce(nullif(v_existing_ledger_json ->> 'related_rebate_record', ''), '');
          v_existing_ledger_source_batch_id := coalesce(nullif(v_existing_ledger_json ->> 'source_batch_id', ''), '');
          v_existing_ledger_source_commission_id := coalesce(nullif(v_existing_ledger_json ->> 'source_commission_id', ''), '');

          if abs(v_existing_ledger_amount - abs(v_allocation_amount)) > v_calc_epsilon then
            raise exception 'Ledger idempotency mismatch for reference_id % (existing amount=%, expected=%).',
              v_allocation_ref, v_existing_ledger_amount, abs(v_allocation_amount);
          end if;

          if v_existing_ledger_reference_type <> 'commission_batch_approval' then
            raise exception 'Ledger idempotency mismatch for reference_id % (reference_type mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_reference_id <> v_allocation_ref then
            raise exception 'Ledger idempotency mismatch for reference_id % (reference_id mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_user_id <> v_beneficiary_user_id then
            raise exception 'Ledger idempotency mismatch for reference_id % (user mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_account_id <> v_resolved_account_id then
            raise exception 'Ledger idempotency mismatch for reference_id % (account mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_direction <> 'credit' then
            raise exception 'Ledger idempotency mismatch for reference_id % (direction mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_transaction_type <> 'rebate_settlement' then
            raise exception 'Ledger idempotency mismatch for reference_id % (transaction_type mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_related_rebate_record <> v_rebate_record_id then
            raise exception 'Ledger idempotency mismatch for reference_id % (rebate linkage mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_source_batch_id <> p_batch_id then
            raise exception 'Ledger idempotency mismatch for reference_id % (source_batch_id mismatch).',
              v_allocation_ref;
          end if;

          if v_existing_ledger_source_commission_id <> v_commission_business_id then
            raise exception 'Ledger idempotency mismatch for reference_id % (source_commission_id mismatch).',
              v_allocation_ref;
          end if;

          v_ledger_reused := v_ledger_reused + 1;
        end if;
      end if;
    end loop;
  end loop;

  if v_row_number = 0 then
    raise exception 'Batch % has no commission records to approve.', p_batch_id;
  end if;

  update public.commission_batches as cb
  set status = 'confirmed'
  where cb.batch_id = p_batch_id
    and cb.status = 'locked';

  if not found then
    raise exception 'Batch % failed final confirmation transition from locked to confirmed.', p_batch_id;
  end if;

  return query
  select
    p_batch_id,
    v_environment,
    v_rebates_created,
    v_rebates_reused,
    v_ledger_created,
    v_ledger_reused,
    'confirmed'::text;
end;
$$;
