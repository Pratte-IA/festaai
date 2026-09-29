type UnitRow = { id: number; kind: string; slug: string };

export const resolveEventoUnitId = async (
  admin: { from: (table: string) => any },
  eventoId: number,
  tenantId: number,
): Promise<number> => {
  const eventoResult = await admin.from("eventos").select("unit_id").eq("id", eventoId).maybeSingle();
  if (eventoResult.error) throw eventoResult.error;

  const eventoUnitId = (eventoResult.data as { unit_id?: number } | null)?.unit_id;
  if (typeof eventoUnitId === "number") return eventoUnitId;

  const matriz = await admin
    .from("tenant_units")
    .select("id, kind, slug")
    .eq("tenant_id", tenantId)
    .eq("kind", "matriz")
    .maybeSingle();

  if (matriz.error) throw matriz.error;
  if (!matriz.data) throw new Error("Matriz não encontrada para o tenant.");

  return matriz.data.id;
};

export const resolveTenantUnit = async (
  admin: { from: (table: string) => any },
  tenantId: number,
  unitSlug?: string | null,
): Promise<UnitRow> => {
  let query = admin.from("tenant_units").select("id, kind, slug").eq("tenant_id", tenantId);
  query = unitSlug ? query.eq("slug", unitSlug) : query.eq("kind", "matriz");

  const result = await query.maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new Error("Casa não encontrada.");

  return result.data;
};

export const resolveFilialPublicSlug = async (
  admin: { from: (table: string) => any },
  unitId: number,
): Promise<string | null> => {
  const result = await admin.from("tenant_units").select("kind, slug").eq("id", unitId).maybeSingle();
  if (result.error) throw result.error;

  const row = result.data as { kind?: string; slug?: string } | null;
  if (row?.kind === "filial" && typeof row.slug === "string" && row.slug.trim()) {
    return row.slug;
  }

  return null;
};
