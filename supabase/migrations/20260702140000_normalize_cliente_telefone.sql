-- Padroniza cliente_telefone no formato 55 + DDD + 8 dígitos (chave Evolution/WhatsApp).

create or replace function public.normalize_brazil_phone_storage(raw text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
  national text;
  ddd text;
  local_part text;
begin
  if raw is null or btrim(raw) = '' then
    return null;
  end if;

  digits := regexp_replace(split_part(raw, '@', 1), '\D', '', 'g');

  if length(digits) >= 12 and left(digits, 2) = '55' then
    national := substring(digits from 3);
  else
    national := digits;
  end if;

  if length(national) < 10 or length(national) > 11 then
    return null;
  end if;

  ddd := left(national, 2);
  local_part := substring(national from 3);

  if length(local_part) = 8 and local_part ~ '^[6-9]' then
    national := ddd || '9' || local_part;
  elsif length(local_part) = 9 then
    national := ddd || local_part;
  elsif length(local_part) = 8 then
    national := ddd || local_part;
  else
    return null;
  end if;

  if length(national) <> 11 or substring(national from 3 for 1) <> '9' then
    return null;
  end if;

  ddd := left(national, 2);
  local_part := substring(national from 3);

  if length(local_part) = 9 and left(local_part, 1) = '9' then
    return '55' || ddd || substring(local_part from 2);
  end if;

  return '55' || national;
end;
$$;

update public.eventos
set cliente_telefone = public.normalize_brazil_phone_storage(cliente_telefone)
where cliente_telefone is not null
  and public.normalize_brazil_phone_storage(cliente_telefone) is not null
  and cliente_telefone is distinct from public.normalize_brazil_phone_storage(cliente_telefone);

create or replace function public.eventos_normalize_cliente_telefone()
returns trigger
language plpgsql
as $$
declare
  normalized text;
begin
  if new.cliente_telefone is not null then
    normalized := public.normalize_brazil_phone_storage(new.cliente_telefone);
    if normalized is not null then
      new.cliente_telefone := normalized;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists eventos_normalize_cliente_telefone on public.eventos;

create trigger eventos_normalize_cliente_telefone
before insert or update of cliente_telefone on public.eventos
for each row
execute function public.eventos_normalize_cliente_telefone();
