alter table public.tenant_checklist_categories
  add column package_id bigint references public.tenant_packages(id) on delete cascade;

-- Replica checklist tenant-wide existente para cada pacote ativo do tenant.
do $$
declare
  tenant_row record;
  package_row record;
  category_row record;
  new_category_id bigint;
begin
  for tenant_row in
    select distinct tenant_id
    from public.tenant_checklist_categories
    where package_id is null
  loop
    for package_row in
      select id
      from public.tenant_packages
      where tenant_id = tenant_row.tenant_id
        and active = true
      order by created_at asc
    loop
      for category_row in
        select *
        from public.tenant_checklist_categories
        where tenant_id = tenant_row.tenant_id
          and package_id is null
        order by sort_order asc, created_at asc
      loop
        insert into public.tenant_checklist_categories (
          tenant_id,
          package_id,
          name,
          active,
          sort_order,
          created_by,
          updated_by
        )
        values (
          category_row.tenant_id,
          package_row.id,
          category_row.name,
          category_row.active,
          category_row.sort_order,
          category_row.created_by,
          category_row.updated_by
        )
        returning id into new_category_id;

        insert into public.tenant_checklist_items (
          tenant_id,
          category_id,
          label,
          active,
          sort_order,
          created_by,
          updated_by
        )
        select
          item.tenant_id,
          new_category_id,
          item.label,
          item.active,
          item.sort_order,
          item.created_by,
          item.updated_by
        from public.tenant_checklist_items item
        where item.category_id = category_row.id
          and item.tenant_id = category_row.tenant_id;
      end loop;
    end loop;

    delete from public.tenant_checklist_categories
    where tenant_id = tenant_row.tenant_id
      and package_id is null;
  end loop;
end $$;

delete from public.tenant_checklist_categories
where package_id is null;

alter table public.tenant_checklist_categories
  alter column package_id set not null;

create index tenant_checklist_categories_tenant_package_idx
  on public.tenant_checklist_categories (tenant_id, package_id);
