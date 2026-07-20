-- Helpers e RPCs de feriados (calendário automático + checagem batch + listagem anual).

create or replace function public.brazilian_easter_sunday(p_year integer)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare
  a integer;
  b integer;
  c integer;
  d integer;
  e integer;
  f integer;
  g integer;
  h integer;
  i integer;
  k integer;
  l integer;
  m integer;
  month_num integer;
  day_num integer;
begin
  if p_year is null or p_year < 1900 or p_year > 2200 then
    raise exception 'Ano inválido para cálculo da Páscoa: %', p_year;
  end if;

  a := p_year % 19;
  b := p_year / 100;
  c := p_year % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  month_num := (h + l - 7 * m + 114) / 31;
  day_num := ((h + l - 7 * m + 114) % 31) + 1;

  return make_date(p_year, month_num, day_num);
end;
$$;

comment on function public.brazilian_easter_sunday(integer) is
  'Domingo de Páscoa (algoritmo Meeus/Jones/Butcher), base dos feriados móveis.';

create or replace function public.automatic_holidays_for_year(p_year integer)
returns table (
  holiday_date date,
  name text,
  scope text,
  kind text,
  recurrence_type text
)
language plpgsql
immutable
set search_path = public
as $$
declare
  easter date;
begin
  if p_year is null or p_year < 1900 or p_year > 2200 then
    raise exception 'Ano inválido: %', p_year;
  end if;

  easter := public.brazilian_easter_sunday(p_year);

  return query
  select *
  from (
    values
      (make_date(p_year, 1, 1), 'Confraternização Universal'::text, 'national'::text, 'official'::text, 'fixed_annual'::text),
      (make_date(p_year, 4, 21), 'Tiradentes', 'national', 'official', 'fixed_annual'),
      (make_date(p_year, 5, 1), 'Dia do Trabalho', 'national', 'official', 'fixed_annual'),
      (make_date(p_year, 9, 7), 'Independência do Brasil', 'national', 'official', 'fixed_annual'),
      (make_date(p_year, 10, 12), 'Nossa Senhora Aparecida', 'national', 'official', 'fixed_annual'),
      (make_date(p_year, 11, 2), 'Finados', 'national', 'official', 'fixed_annual'),
      (make_date(p_year, 11, 15), 'Proclamação da República', 'national', 'official', 'fixed_annual'),
      (make_date(p_year, 11, 20), 'Dia Nacional de Zumbi e da Consciência Negra', 'national', 'official', 'fixed_annual'),
      (make_date(p_year, 12, 25), 'Natal', 'national', 'official', 'fixed_annual'),
      (easter - 48, 'Carnaval (segunda)', 'national', 'optional', 'movable_annual'),
      (easter - 47, 'Carnaval (terça)', 'national', 'optional', 'movable_annual'),
      (easter - 2, 'Sexta-feira Santa', 'national', 'official', 'movable_annual'),
      (easter + 60, 'Corpus Christi', 'national', 'optional', 'movable_annual')
  ) as v(holiday_date, name, scope, kind, recurrence_type);
end;
$$;

comment on function public.automatic_holidays_for_year(integer) is
  'Calendário automático da precificação: nacionais oficiais e facultativos comerciais (Carnaval/Corpus).';

create or replace function public.is_fixed_automatic_holiday_md(p_month integer, p_day integer)
returns boolean
language sql
immutable
set search_path = public
as $$
  select (p_month, p_day) in (
    (1, 1),
    (4, 21),
    (5, 1),
    (9, 7),
    (10, 12),
    (11, 2),
    (11, 15),
    (11, 20),
    (12, 25)
  );
$$;

create or replace function public.can_access_tenant_holiday_rpcs(p_tenant_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_tenant_id is null then
    return false;
  end if;

  -- PostgREST service role (n8n / backend)
  if auth.role() = 'service_role' then
    return true;
  end if;

  -- SQL direto (migrations, MCP, psql) como postgres/supabase_admin
  if auth.uid() is null and current_user in ('postgres', 'supabase_admin') then
    return true;
  end if;

  if public.is_platform_admin() then
    return true;
  end if;

  return public.is_tenant_member(p_tenant_id);
end;
$$;

revoke all on function public.can_access_tenant_holiday_rpcs(bigint) from public, anon;
grant execute on function public.can_access_tenant_holiday_rpcs(bigint) to authenticated, service_role;

-- Bloqueia cadastro que duplica data automática (regras distintas para pontual vs recorrente).
create or replace function public.tenant_holidays_reject_automatic_duplicate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conflict_name text;
begin
  if tg_op = 'UPDATE'
    and new.holiday_date is not distinct from old.holiday_date
    and new.recurs_annually is not distinct from old.recurs_annually
  then
    return new;
  end if;

  if not new.recurs_annually then
    select ah.name
      into conflict_name
    from public.automatic_holidays_for_year(extract(year from new.holiday_date)::int) ah
    where ah.holiday_date = new.holiday_date
    limit 1;

    if conflict_name is not null then
      raise exception
        using message = format(
          'A data %s já está no calendário automático (%s). Não é necessário cadastrá-la novamente.',
          new.holiday_date,
          conflict_name
        ),
        errcode = 'P0001';
    end if;
  else
    if public.is_fixed_automatic_holiday_md(
      extract(month from new.holiday_date)::int,
      extract(day from new.holiday_date)::int
    ) then
      raise exception
        using message = format(
          'O dia/mês %s-%s coincide com um feriado automático fixo. Não é necessário cadastrá-lo novamente.',
          lpad(extract(month from new.holiday_date)::text, 2, '0'),
          lpad(extract(day from new.holiday_date)::text, 2, '0')
        ),
        errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tenant_holidays_reject_automatic_duplicate on public.tenant_holidays;

create trigger tenant_holidays_reject_automatic_duplicate
before insert or update of holiday_date, recurs_annually
on public.tenant_holidays
for each row
execute function public.tenant_holidays_reject_automatic_duplicate();

create or replace function public.check_tenant_holidays(
  p_tenant_id bigint,
  p_dates date[]
)
returns table (
  date date,
  is_holiday boolean,
  holiday_name text,
  holiday_scope text,
  holiday_kind text,
  holiday_source text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  unique_dates date[];
begin
  if not public.can_access_tenant_holiday_rpcs(p_tenant_id) then
    raise exception 'Acesso negado ao tenant %', p_tenant_id using errcode = '42501';
  end if;

  if p_dates is null or cardinality(p_dates) = 0 then
    raise exception 'Informe ao menos uma data.' using errcode = '22023';
  end if;

  if cardinality(p_dates) > 366 then
    raise exception 'Limite de 366 datas por requisição.' using errcode = '22023';
  end if;

  select array_agg(distinct d order by d)
    into unique_dates
  from unnest(p_dates) as d
  where d is not null;

  if unique_dates is null or cardinality(unique_dates) = 0 then
    raise exception 'Informe ao menos uma data válida.' using errcode = '22023';
  end if;

  return query
  with requested as (
    select unnest(unique_dates) as d
  ),
  auto_hit as (
    select
      r.d,
      ah.name,
      ah.scope,
      ah.kind,
      1 as rank_group
    from requested r
    join lateral (
      select *
      from public.automatic_holidays_for_year(extract(year from r.d)::int) a
      where a.holiday_date = r.d
      limit 1
    ) ah on true
  ),
  tenant_hit as (
    select distinct on (r.d)
      r.d,
      th.name,
      th.scope,
      th.kind,
      2 as rank_group
    from requested r
    join public.tenant_holidays th
      on th.tenant_id = p_tenant_id
     and th.active
     and (
       (not th.recurs_annually and th.holiday_date = r.d)
       or (
         th.recurs_annually
         and extract(month from th.holiday_date) = extract(month from r.d)
         and extract(day from th.holiday_date) = extract(day from r.d)
       )
     )
    order by
      r.d,
      case th.scope
        when 'state' then 1
        when 'municipal' then 2
        when 'tenant' then 3
        else 9
      end,
      case th.kind
        when 'official' then 1
        when 'optional' then 2
        when 'custom' then 3
        else 9
      end,
      th.name asc,
      th.id asc
  ),
  picked as (
    select distinct on (x.d)
      x.d,
      x.name,
      x.scope,
      x.kind,
      x.rank_group
    from (
      select * from auto_hit
      union all
      select * from tenant_hit
    ) x
    order by x.d, x.rank_group asc
  )
  select
    r.d as date,
    (p.d is not null) as is_holiday,
    p.name as holiday_name,
    p.scope as holiday_scope,
    p.kind as holiday_kind,
    case
      when p.rank_group = 1 then 'automatic'
      when p.rank_group = 2 then 'tenant'
      else null
    end as holiday_source
  from requested r
  left join picked p on p.d = r.d
  order by r.d;
end;
$$;

comment on function public.check_tenant_holidays(bigint, date[]) is
  'Indica se cada data é feriado (automático ou do tenant). Não resolve banda/preço.';

create or replace function public.list_tenant_holiday_calendar(
  p_tenant_id bigint,
  p_year integer
)
returns table (
  id bigint,
  date date,
  name text,
  scope text,
  kind text,
  source text,
  editable boolean,
  recurs_annually boolean,
  recurrence_type text,
  active boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_access_tenant_holiday_rpcs(p_tenant_id) then
    raise exception 'Acesso negado ao tenant %', p_tenant_id using errcode = '42501';
  end if;

  if p_year is null or p_year < 1900 or p_year > 2200 then
    raise exception 'Ano inválido: %', p_year using errcode = '22023';
  end if;

  return query
  with auto_rows as (
    select
      null::bigint as id,
      ah.holiday_date as date,
      ah.name,
      ah.scope,
      ah.kind,
      'automatic'::text as source,
      false as editable,
      (ah.recurrence_type = 'fixed_annual') as recurs_annually,
      ah.recurrence_type,
      true as active
    from public.automatic_holidays_for_year(p_year) ah
  ),
  tenant_rows as (
    select
      th.id,
      case
        when th.recurs_annually then
          case
            when extract(month from th.holiday_date) = 2
              and extract(day from th.holiday_date) = 29
              and not (
                (p_year % 4 = 0 and p_year % 100 <> 0)
                or (p_year % 400 = 0)
              )
            then null
            else make_date(
              p_year,
              extract(month from th.holiday_date)::int,
              extract(day from th.holiday_date)::int
            )
          end
        else th.holiday_date
      end as date,
      th.name,
      th.scope,
      th.kind,
      'tenant'::text as source,
      true as editable,
      th.recurs_annually,
      case
        when th.recurs_annually then 'fixed_annual'
        else 'one_time'
      end as recurrence_type,
      th.active
    from public.tenant_holidays th
    where th.tenant_id = p_tenant_id
      and (
        (not th.recurs_annually and extract(year from th.holiday_date)::int = p_year)
        or th.recurs_annually
      )
  )
  select
    u.id,
    u.date,
    u.name,
    u.scope,
    u.kind,
    u.source,
    u.editable,
    u.recurs_annually,
    u.recurrence_type,
    u.active
  from (
    select * from auto_rows
    union all
    select * from tenant_rows where tenant_rows.date is not null
  ) u
  order by
    u.date asc,
    case u.source when 'automatic' then 1 else 2 end,
    u.name asc,
    u.id nulls first;
end;
$$;

comment on function public.list_tenant_holiday_calendar(bigint, integer) is
  'Calendário anual unificado (automático + tenant) para a tela de configurações.';

revoke all on function public.brazilian_easter_sunday(integer) from public, anon;
revoke all on function public.automatic_holidays_for_year(integer) from public, anon;
revoke all on function public.is_fixed_automatic_holiday_md(integer, integer) from public, anon;
revoke all on function public.check_tenant_holidays(bigint, date[]) from public, anon;
revoke all on function public.list_tenant_holiday_calendar(bigint, integer) from public, anon;

grant execute on function public.brazilian_easter_sunday(integer) to authenticated, service_role;
grant execute on function public.automatic_holidays_for_year(integer) to authenticated, service_role;
grant execute on function public.check_tenant_holidays(bigint, date[]) to authenticated, service_role;
grant execute on function public.list_tenant_holiday_calendar(bigint, integer) to authenticated, service_role;
