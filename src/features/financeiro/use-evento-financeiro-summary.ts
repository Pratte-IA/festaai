import { useMemo } from "react";

import { Evento } from "@/features/eventos";

import { buildEventoFinanceiroSummary } from "./party-financial";
import { useFinanceiroLancamentos } from "./use-financeiro-lancamentos";

export const useEventoFinanceiroSummary = (event: Pick<Evento, "id" | "valor_total"> | null | undefined) => {
  const eventoId = event?.id ?? null;
  const { data: lancamentos = [], isLoading, error } = useFinanceiroLancamentos(
    eventoId != null ? { eventoId } : {},
    { enabled: eventoId != null },
  );

  const summary = useMemo(() => {
    if (!event) {
      return null;
    }

    return buildEventoFinanceiroSummary(event, lancamentos);
  }, [event, lancamentos]);

  return {
    error,
    isLoading,
    lancamentos,
    summary,
  };
};
