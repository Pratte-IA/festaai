create temp table _default_checklist_seed (
  category_name text not null,
  category_sort integer not null,
  item_label text not null,
  item_sort integer not null
) on commit drop;

insert into _default_checklist_seed (category_name, category_sort, item_label, item_sort)
values
  ('Equipe de Limpeza', 0, 'Contratar equipe', 0),
  ('Decoração', 1, 'Contratar decoradora', 0),
  ('Decoração', 1, 'Alinhar decoração com a mãe', 1),
  ('Buffet', 2, 'Salgado', 0),
  ('Buffet', 2, 'Doce', 1),
  ('Buffet', 2, 'Bolo', 2),
  ('Buffet', 2, 'Bebidas sem álcool', 3),
  ('Equipe da Festa', 3, 'Recepcionista', 0),
  ('Equipe da Festa', 3, 'Copeira', 1),
  ('Equipe da Festa', 3, 'Garçom', 2),
  ('Equipe da Festa', 3, 'Monitora', 3);

do $$
declare
  package_row record;
  category_row record;
  new_category_id bigint;
begin
  for package_row in
    select p.id, p.tenant_id
    from public.tenant_packages p
    where p.active = true
      and not exists (
        select 1
        from public.tenant_checklist_categories c
        where c.package_id = p.id
      )
  loop
    for category_row in
      select distinct category_name, category_sort
      from _default_checklist_seed
      order by category_sort asc
    loop
      insert into public.tenant_checklist_categories (
        tenant_id,
        package_id,
        name,
        active,
        sort_order
      )
      values (
        package_row.tenant_id,
        package_row.id,
        category_row.category_name,
        true,
        category_row.category_sort
      )
      returning id into new_category_id;

      insert into public.tenant_checklist_items (
        tenant_id,
        category_id,
        label,
        active,
        sort_order
      )
      select
        package_row.tenant_id,
        new_category_id,
        seed.item_label,
        true,
        seed.item_sort
      from _default_checklist_seed seed
      where seed.category_name = category_row.category_name
        and seed.category_sort = category_row.category_sort
      order by seed.item_sort asc;
    end loop;
  end loop;
end $$;
