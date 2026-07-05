type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

const INACTIVE_STATUSES = new Set(["perdido", "cancelado"]);

export const isEventDateAvailableForTenant = async (
  admin: ServiceClient,
  tenantId: number,
  dateIso: string,
): Promise<boolean> => {
  const date = dateIso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const { data: block, error: blockError } = await admin
    .from("calendar_blocks")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("data", date)
    .maybeSingle();

  if (blockError) throw blockError;
  if (block) return false;

  const { data: festas, error: festasError } = await admin
    .from("eventos")
    .select("id, etapa, funil, status_interno, tipo_evento")
    .eq("tenant_id", tenantId)
    .eq("data_evento", date)
    .eq("funil", "festa")
    .eq("tipo_evento", "festa");

  if (festasError) throw festasError;

  const hasConfirmedParty = (festas ?? []).some((evento) => {
    const statusInterno =
      typeof evento.status_interno === "string" ? evento.status_interno : "";
    const etapa = typeof evento.etapa === "string" ? evento.etapa : "";

    if (INACTIVE_STATUSES.has(statusInterno) || etapa === "perdido") {
      return false;
    }

    return true;
  });

  return !hasConfirmedParty;
};
