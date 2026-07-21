alter table public.eventos
  add column if not exists checklist_extras jsonb not null default '[]'::jsonb;

alter table public.eventos
  drop constraint if exists eventos_checklist_extras_is_array;

alter table public.eventos
  add constraint eventos_checklist_extras_is_array
  check (jsonb_typeof(checklist_extras) = 'array');
