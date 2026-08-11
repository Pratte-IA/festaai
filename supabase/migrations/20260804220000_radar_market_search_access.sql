-- Radar 00: acesso admin às tabelas de cobertura/termos/runs (sem criar tabelas).
-- Padrão: RPCs public SECURITY DEFINER + RLS para platform admin.

-- ---------------------------------------------------------------------------
-- 1) Grants + RLS nas tabelas existentes
-- ---------------------------------------------------------------------------

grant select on radar.market_search_terms to authenticated;
grant select, insert, update on radar.market_search_runs to authenticated;
grant select, insert, update on radar.market_coverage to authenticated;

alter table radar.market_search_terms enable row level security;
alter table radar.market_search_runs enable row level security;
alter table radar.market_coverage enable row level security;

drop policy if exists market_search_terms_admin_select on radar.market_search_terms;
create policy market_search_terms_admin_select
on radar.market_search_terms
for select
to authenticated
using (public.is_platform_admin());

drop policy if exists market_search_runs_admin_select on radar.market_search_runs;
create policy market_search_runs_admin_select
on radar.market_search_runs
for select
to authenticated
using (public.is_platform_admin());

drop policy if exists market_search_runs_admin_insert on radar.market_search_runs;
create policy market_search_runs_admin_insert
on radar.market_search_runs
for insert
to authenticated
with check (public.is_platform_admin());

drop policy if exists market_search_runs_admin_update on radar.market_search_runs;
create policy market_search_runs_admin_update
on radar.market_search_runs
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists market_coverage_admin_select on radar.market_coverage;
create policy market_coverage_admin_select
on radar.market_coverage
for select
to authenticated
using (public.is_platform_admin());

drop policy if exists market_coverage_admin_insert on radar.market_coverage;
create policy market_coverage_admin_insert
on radar.market_coverage
for insert
to authenticated
with check (public.is_platform_admin());

drop policy if exists market_coverage_admin_update on radar.market_coverage;
create policy market_coverage_admin_update
on radar.market_coverage
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 2) Listar cobertura (histórico / resumo de cidades)
-- ---------------------------------------------------------------------------

create or replace function public.radar_list_market_coverage()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, radar
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  return coalesce(
    (
      select jsonb_agg(row_to_json(c)::jsonb order by c.last_search_at desc nulls last, c.updated_at desc, c.id desc)
      from radar.market_coverage c
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.radar_list_market_coverage() from public;
grant execute on function public.radar_list_market_coverage() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Listar termos ativos por segmento
-- ---------------------------------------------------------------------------

create or replace function public.radar_list_market_search_terms(p_segment text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, radar
as $$
declare
  v_segment text := nullif(trim(p_segment), '');
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  if v_segment is null then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'segment', t.segment,
          'search_term', t.search_term,
          'priority', t.priority,
          'is_active', t.is_active
        )
        order by t.priority asc, t.search_term asc, t.id asc
      )
      from radar.market_search_terms t
      where t.segment = v_segment
        and t.is_active = true
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.radar_list_market_search_terms(text) from public;
grant execute on function public.radar_list_market_search_terms(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Listar runs recentes (histórico operacional)
-- ---------------------------------------------------------------------------

create or replace function public.radar_list_market_search_runs(p_limit integer default 40)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, radar
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 40), 200));
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  return coalesce(
    (
      select jsonb_agg(row_to_json(r)::jsonb)
      from (
        select
          id,
          city,
          state,
          segment,
          search_term,
          provider,
          results_returned,
          unique_results,
          new_companies,
          duplicate_companies,
          execution_status,
          executed_at,
          metadata
        from radar.market_search_runs
        order by executed_at desc, id desc
        limit v_limit
      ) r
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.radar_list_market_search_runs(integer) from public;
grant execute on function public.radar_list_market_search_runs(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Iniciar pesquisa: cria runs pending + garante coverage
-- ---------------------------------------------------------------------------

create or replace function public.radar_start_market_search(
  p_search_name text,
  p_city text,
  p_state text,
  p_segment text,
  p_search_terms text[],
  p_max_results_per_term integer,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, radar
as $$
declare
  v_search_name text := nullif(trim(p_search_name), '');
  v_city text := nullif(trim(p_city), '');
  v_state text := upper(nullif(trim(p_state), ''));
  v_segment text := nullif(trim(p_segment), '');
  v_notes text := nullif(trim(coalesce(p_notes, '')), '');
  v_max integer := coalesce(p_max_results_per_term, 20);
  v_terms text[] := array[]::text[];
  v_term text;
  v_batch_id uuid := gen_random_uuid();
  v_coverage_id bigint;
  v_run_ids bigint[] := array[]::bigint[];
  v_run_id bigint;
  v_metadata jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: apenas administradores da plataforma.';
  end if;

  if v_search_name is null then
    raise exception 'Informe o nome da pesquisa.';
  end if;
  if v_city is null then
    raise exception 'Informe a cidade.';
  end if;
  if v_state is null or char_length(v_state) <> 2 then
    raise exception 'Informe um estado (UF) válido.';
  end if;
  if v_segment is null then
    raise exception 'Informe o segmento.';
  end if;
  if v_max < 1 or v_max > 100 then
    raise exception 'Máximo de resultados por termo deve estar entre 1 e 100.';
  end if;

  if p_search_terms is not null then
    foreach v_term in array p_search_terms loop
      v_term := nullif(trim(v_term), '');
      if v_term is not null and not (v_term = any (v_terms)) then
        v_terms := array_append(v_terms, v_term);
      end if;
    end loop;
  end if;

  if coalesce(array_length(v_terms, 1), 0) = 0 then
    raise exception 'Informe ao menos um termo de busca.';
  end if;

  v_metadata := jsonb_build_object(
    'search_name', v_search_name,
    'max_results_per_term', v_max,
    'notes', to_jsonb(v_notes),
    'source', 'festaai_admin',
    'batch_id', v_batch_id
  );

  insert into radar.market_coverage as c (
    city,
    state,
    segment,
    coverage_status,
    last_search_at,
    updated_at
  )
  values (
    v_city,
    v_state,
    v_segment,
    'open',
    now(),
    now()
  )
  on conflict (city, state, segment) do update
  set
    last_search_at = now(),
    updated_at = now(),
    coverage_status = case
      when c.coverage_status = 'monitoring' then 'expanding'
      else c.coverage_status
    end
  returning id into v_coverage_id;

  foreach v_term in array v_terms loop
    insert into radar.market_search_runs (
      city,
      state,
      segment,
      search_term,
      provider,
      results_returned,
      unique_results,
      new_companies,
      duplicate_companies,
      execution_status,
      executed_at,
      metadata
    )
    values (
      v_city,
      v_state,
      v_segment,
      v_term,
      'google_places',
      0,
      0,
      0,
      0,
      'pending',
      now(),
      v_metadata
    )
    returning id into v_run_id;

    v_run_ids := array_append(v_run_ids, v_run_id);
  end loop;

  return jsonb_build_object(
    'batch_id', v_batch_id,
    'coverage_id', v_coverage_id,
    'run_ids', to_jsonb(v_run_ids),
    'payload', jsonb_build_object(
      'search_name', v_search_name,
      'state', v_state,
      'city', v_city,
      'segment', v_segment,
      'search_terms', to_jsonb(v_terms),
      'max_results_per_term', v_max,
      'notes', v_notes,
      'source', 'festaai_admin'
    )
  );
end;
$$;

revoke all on function public.radar_start_market_search(
  text, text, text, text, text[], integer, text
) from public;
grant execute on function public.radar_start_market_search(
  text, text, text, text, text[], integer, text
) to authenticated;
