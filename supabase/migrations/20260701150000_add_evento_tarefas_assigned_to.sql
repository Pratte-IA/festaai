alter table public.evento_tarefas
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

create index if not exists evento_tarefas_assigned_to_idx
  on public.evento_tarefas (tenant_id, assigned_to)
  where assigned_to is not null;

update public.evento_tarefas
set assigned_to = created_by
where assigned_to is null
  and created_by is not null;
