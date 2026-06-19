import type { Additional } from "@/data/packagesData";
import { supabase } from "@/lib/supabase/client";

type AdditionalRow = {
  active: boolean;
  category: string;
  description: string | null;
  id: number;
  is_required: boolean;
  name: string;
  package_ids: number[] | null;
  price: number;
  sort_order: number;
  type: string;
};

export const isPersistedAdditionalId = (id: string) => /^\d+$/.test(id);

const mapPackageIds = (packageIds: number[] | null | undefined): string[] =>
  (packageIds ?? []).map(String);

const serializePackageIds = (packageIds: string[] | undefined): number[] =>
  (packageIds ?? []).map(Number).filter((id) => Number.isFinite(id) && id > 0);

const mapAdditionalRow = (row: AdditionalRow): Additional => ({
  active: row.active,
  category: row.category as Additional["category"],
  description: row.description,
  id: String(row.id),
  isRequired: row.is_required,
  name: row.name,
  packageIds: mapPackageIds(row.package_ids),
  price: row.price,
  sortOrder: row.sort_order,
  type: row.type as Additional["type"],
});

export const syncTenantAdditionals = async ({
  desired,
  existing,
  tenantId,
  userId,
}: {
  desired: Additional[];
  existing: Additional[];
  tenantId: number;
  userId: string;
}): Promise<Additional[]> => {
  const desiredPersistedIds = new Set(
    desired.filter((item) => isPersistedAdditionalId(item.id)).map((item) => item.id),
  );

  for (const item of existing) {
    if (!desiredPersistedIds.has(item.id)) {
      const { error } = await supabase
        .from("tenant_additionals")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", Number(item.id));

      if (error) throw error;
    }
  }

  const { data: sortRows, error: sortError } = await supabase
    .from("tenant_additionals")
    .select("sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (sortError) throw sortError;

  let nextSortOrder = (sortRows?.[0]?.sort_order ?? -1) + 1;
  const synced: Additional[] = [];

  for (let index = 0; index < desired.length; index += 1) {
    const item = desired[index];
    const sortOrder = index;

    if (isPersistedAdditionalId(item.id)) {
      const { error } = await supabase
        .from("tenant_additionals")
        .update({
          active: item.active ?? true,
          category: item.category,
          description: item.description?.trim() || null,
          is_required: false,
          name: item.name.trim(),
          package_ids: serializePackageIds(item.packageIds),
          price: item.price,
          sort_order: sortOrder,
          type: item.type,
          updated_by: userId,
        })
        .eq("tenant_id", tenantId)
        .eq("id", Number(item.id));

      if (error) throw error;

      synced.push({ ...item, sortOrder });
      continue;
    }

    const { data, error } = await supabase
      .from("tenant_additionals")
      .insert({
        active: item.active ?? true,
        category: item.category,
        created_by: userId,
        description: item.description?.trim() || null,
        is_required: false,
        name: item.name.trim(),
        package_ids: serializePackageIds(item.packageIds),
        price: item.price,
        sort_order: nextSortOrder,
        tenant_id: tenantId,
        type: item.type,
        updated_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Adicional nao foi persistido no banco de dados.");

    synced.push(mapAdditionalRow(data as AdditionalRow));
    nextSortOrder += 1;
  }

  return synced;
};
