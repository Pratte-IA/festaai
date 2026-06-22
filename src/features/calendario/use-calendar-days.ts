import { useQuery } from "@tanstack/react-query";

import { Evento } from "@/features/eventos";
import { useCurrentTenant } from "@/features/tenants";
import { supabase } from "@/lib/supabase/client";

import { buildMonthDays, getMonthRange } from "./calendar-utils";
import { calendarioQueryKeys } from "./query-keys";
import { CalendarBlock, DayInfo } from "./types";

interface CalendarMonthData {
  blocks: CalendarBlock[];
  days: DayInfo[];
  events: Evento[];
}

const fetchCalendarMonth = async (
  tenantId: number,
  year: number,
  month: number,
): Promise<CalendarMonthData> => {
  const { start, end } = getMonthRange(year, month);

  const [festaResult, vendasResult, blocksResult] = await Promise.all([
    supabase
      .from("eventos")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("funil", "festa")
      .eq("tipo_evento", "festa")
      .gte("data_evento", start)
      .lte("data_evento", end)
      .order("data_evento", { ascending: true })
      .order("hora_evento", { ascending: true })
      .returns<Evento[]>(),
    supabase
      .from("eventos")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("funil", "vendas")
      .eq("tipo_evento", "visita")
      .gte("data_evento", start)
      .lte("data_evento", end)
      .order("data_evento", { ascending: true })
      .order("hora_evento", { ascending: true })
      .returns<Evento[]>(),
    supabase
      .from("calendar_blocks")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("data", start)
      .lte("data", end)
      .order("data", { ascending: true })
      .returns<CalendarBlock[]>(),
  ]);

  if (festaResult.error) {
    throw festaResult.error;
  }

  if (vendasResult.error) {
    throw vendasResult.error;
  }

  if (blocksResult.error) {
    throw blocksResult.error;
  }

  const events = [...(festaResult.data ?? []), ...(vendasResult.data ?? [])];
  const blocks = blocksResult.data ?? [];

  return {
    blocks,
    days: buildMonthDays(year, month, events, blocks),
    events,
  };
};

export const useCalendarDays = (year: number, month: number) => {
  const { currentTenantId } = useCurrentTenant();

  return useQuery({
    enabled: Boolean(currentTenantId),
    queryFn: () => fetchCalendarMonth(currentTenantId as number, year, month),
    queryKey: calendarioQueryKeys.month(currentTenantId, year, month),
    staleTime: 1000 * 30,
  });
};
