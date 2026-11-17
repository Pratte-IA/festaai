type ServiceClient = {
  from: (table: string) => Record<string, unknown>;
};

const INACTIVE_STATUSES = new Set(["perdido", "cancelado"]);

export interface UnitDateAvailability {
  available: boolean;
  id: number;
  kind: "matriz" | "filial" | string;
  name: string;
}

export interface EventDateAvailabilityByUnits {
  allAvailable: boolean;
  anyAvailable: boolean;
  units: UnitDateAvailability[];
}

const isValidDateIso = (dateIso: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(dateIso.trim());

const formatDateBR = (dateIso: string): string => {
  const [year, month, day] = dateIso.trim().split("-");
  if (!year || !month || !day) return dateIso;
  return `${day}/${month}/${year}`;
};

export const isEventDateAvailableForUnit = async (
  admin: ServiceClient,
  tenantId: number,
  unitId: number,
  dateIso: string,
): Promise<boolean> => {
  const date = dateIso.trim();
  if (!isValidDateIso(date)) return false;

  const { data: blocks, error: blockError } = await admin
    .from("calendar_blocks")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("unit_id", unitId)
    .eq("data", date)
    .limit(1);

  if (blockError) throw blockError;
  if (blocks?.[0]) return false;

  const { data: festas, error: festasError } = await admin
    .from("eventos")
    .select("id, etapa, funil, status_interno, tipo_evento")
    .eq("tenant_id", tenantId)
    .eq("unit_id", unitId)
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

export const getEventDateAvailabilityByUnits = async (
  admin: ServiceClient,
  tenantId: number,
  dateIso: string,
): Promise<EventDateAvailabilityByUnits> => {
  const date = dateIso.trim();
  if (!isValidDateIso(date)) {
    return { allAvailable: false, anyAvailable: false, units: [] };
  }

  const { data: unitRows, error: unitsError } = await admin
    .from("tenant_units")
    .select("id, kind, name, status")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (unitsError) throw unitsError;

  const sortedUnits = [...(unitRows ?? [])].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "matriz" ? -1 : 1;
    return String(left.name ?? "").localeCompare(String(right.name ?? ""), "pt-BR");
  });

  const units: UnitDateAvailability[] = [];
  for (const unit of sortedUnits) {
    const unitId = typeof unit.id === "number" ? unit.id : Number(unit.id);
    if (!Number.isInteger(unitId)) continue;

    const available = await isEventDateAvailableForUnit(admin, tenantId, unitId, date);
    units.push({
      available,
      id: unitId,
      kind: typeof unit.kind === "string" ? unit.kind : "matriz",
      name: typeof unit.name === "string" && unit.name.trim() ? unit.name.trim() : "Casa",
    });
  }

  const anyAvailable = units.some((unit) => unit.available);
  const allAvailable = units.length > 0 && units.every((unit) => unit.available);

  return { allAvailable, anyAvailable, units };
};

/**
 * Compat: true se ao menos uma casa ativa tiver a data livre.
 * Com matriz+filial, a mensagem detalha cada casa via formatResumoAgendaCasas.
 */
export const isEventDateAvailableForTenant = async (
  admin: ServiceClient,
  tenantId: number,
  dateIso: string,
): Promise<boolean> => {
  const availability = await getEventDateAvailabilityByUnits(admin, tenantId, dateIso);
  return availability.anyAvailable;
};

/** Texto humano para WhatsApp: Classic liberada / Premium fechada, etc. */
export const formatResumoAgendaCasas = (
  units: UnitDateAvailability[],
  dateIso: string,
): string => {
  const dataBR = formatDateBR(dateIso);

  if (units.length === 0) {
    return `Não conseguimos confirmar a disponibilidade da data ${dataBR} no momento.`;
  }

  if (units.length === 1) {
    const unit = units[0];
    return unit.available
      ? `A data ${dataBR} ainda está liberada na ${unit.name}.`
      : `A data ${dataBR} já está fechada na ${unit.name}.`;
  }

  const parts = units.map((unit) =>
    unit.available
      ? `na ${unit.name} ainda está liberada`
      : `na ${unit.name} já está fechada`,
  );

  if (parts.length === 2) {
    return `Sobre a data ${dataBR}: ${parts[0]} e ${parts[1]}.`;
  }

  const last = parts[parts.length - 1];
  const head = parts.slice(0, -1).join(", ");
  return `Sobre a data ${dataBR}: ${head} e ${last}.`;
};

export const formatAgendaCasasNotaLines = (units: UnitDateAvailability[]): string => {
  if (units.length === 0) return "Agenda: sem unidades ativas para verificar.";
  return units
    .map((unit) => `- ${unit.name}: ${unit.available ? "liberada" : "fechada"}`)
    .join("\n");
};
