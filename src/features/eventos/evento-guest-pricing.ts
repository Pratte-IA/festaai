import { PackageData } from "@/data/packagesData";
import { Json } from "@/lib/supabase/database.types";

import {
  AdicionalSnapshotItem,
  calculateAdditionalSubtotal,
  getAdditionalsTotal,
  parseAdicionaisSnapshot,
  resolvePackagePrice,
} from "./closing-form-runtime";
import { Evento, EventoUpdate } from "./types";

export interface ConvidadosAlteracaoHistoricoEntry {
  altered_at: string;
  new_guest_count: number;
  new_valor_pacote: number;
  new_valor_total: number;
  previous_guest_count: number;
  previous_valor_pacote: number;
  previous_valor_total: number;
}

export interface EventoGuestPricingUpdate {
  adicionais_snapshot?: Json;
  convidados_alteracoes_historico?: ConvidadosAlteracaoHistoricoEntry[];
  quantidade_convidados?: number | null;
  valor_adicionais?: number;
  valor_pacote?: number;
  valor_total?: number;
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export const parseConvidadosAlteracoesHistorico = (
  value: Json | null | undefined,
): ConvidadosAlteracaoHistoricoEntry[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;

    if (
      typeof row.altered_at !== "string" ||
      typeof row.previous_guest_count !== "number" ||
      typeof row.new_guest_count !== "number" ||
      typeof row.previous_valor_pacote !== "number" ||
      typeof row.new_valor_pacote !== "number" ||
      typeof row.previous_valor_total !== "number" ||
      typeof row.new_valor_total !== "number"
    ) {
      return [];
    }

    return [row as ConvidadosAlteracaoHistoricoEntry];
  });
};

const recalculateAdicionaisSnapshot = (
  snapshot: AdicionalSnapshotItem[],
  guestCount: number,
): AdicionalSnapshotItem[] =>
  snapshot.map((item) => ({
    ...item,
    subtotal: roundCurrency(calculateAdditionalSubtotal(item, item.quantity, guestCount)),
  }));

export const recalculateEventoGuestPricing = ({
  adicionaisSnapshot,
  dataEvento,
  guestCount,
  isHoliday,
  pacoteId,
  packages,
  valorAdicionais,
  valorPacote,
}: {
  adicionaisSnapshot?: Json | null;
  dataEvento?: string | null;
  guestCount: number;
  isHoliday?: (date: string) => boolean;
  pacoteId?: number | null;
  packages: PackageData[];
  valorAdicionais: number;
  valorPacote: number;
}): Pick<EventoGuestPricingUpdate, "adicionais_snapshot" | "valor_adicionais" | "valor_pacote" | "valor_total"> => {
  const normalizedGuestCount = Number.isFinite(guestCount) && guestCount > 0 ? guestCount : 0;
  const pkg = pacoteId != null ? packages.find((item) => item.id === String(pacoteId)) ?? null : null;

  let nextValorPacote = valorPacote;
  if (pkg && normalizedGuestCount > 0) {
    nextValorPacote = resolvePackagePrice(pkg, normalizedGuestCount, dataEvento, isHoliday);
  }

  const parsedSnapshot = parseAdicionaisSnapshot(adicionaisSnapshot);
  let nextValorAdicionais = valorAdicionais;

  if (parsedSnapshot.length > 0 && normalizedGuestCount > 0) {
    const updatedSnapshot = recalculateAdicionaisSnapshot(parsedSnapshot, normalizedGuestCount);
    nextValorAdicionais = getAdditionalsTotal(updatedSnapshot);

    return {
      adicionais_snapshot: updatedSnapshot as unknown as Json,
      valor_adicionais: nextValorAdicionais,
      valor_pacote: nextValorPacote,
      valor_total: roundCurrency(nextValorPacote + nextValorAdicionais),
    };
  }

  return {
    valor_adicionais: nextValorAdicionais,
    valor_pacote: nextValorPacote,
    valor_total: roundCurrency(nextValorPacote + nextValorAdicionais),
  };
};

export const buildConvidadosAlteracaoHistoricoEntry = ({
  alteredAt = new Date().toISOString().slice(0, 10),
  newGuestCount,
  newValorPacote,
  newValorTotal,
  previousGuestCount,
  previousValorPacote,
  previousValorTotal,
}: {
  alteredAt?: string;
  newGuestCount: number;
  newValorPacote: number;
  newValorTotal: number;
  previousGuestCount: number;
  previousValorPacote: number;
  previousValorTotal: number;
}): ConvidadosAlteracaoHistoricoEntry => ({
  altered_at: alteredAt,
  new_guest_count: newGuestCount,
  new_valor_pacote: newValorPacote,
  new_valor_total: newValorTotal,
  previous_guest_count: previousGuestCount,
  previous_valor_pacote: previousValorPacote,
  previous_valor_total: previousValorTotal,
});

export const appendConvidadosAlteracaoHistorico = (
  evento: Pick<
    Evento,
    "convidados_alteracoes_historico" | "quantidade_convidados" | "valor_pacote" | "valor_total"
  >,
  nextValues: Pick<EventoUpdate, "quantidade_convidados" | "valor_pacote" | "valor_total">,
  options?: { trackHistory?: boolean },
): ConvidadosAlteracaoHistoricoEntry[] | undefined => {
  if (!options?.trackHistory) return undefined;

  const previousGuestCount = evento.quantidade_convidados;
  const nextGuestCount = nextValues.quantidade_convidados;

  if (
    previousGuestCount == null ||
    nextGuestCount == null ||
    previousGuestCount === nextGuestCount
  ) {
    return undefined;
  }

  const history = parseConvidadosAlteracoesHistorico(evento.convidados_alteracoes_historico);

  return [
    ...history,
    buildConvidadosAlteracaoHistoricoEntry({
      newGuestCount: nextGuestCount,
      newValorPacote: nextValues.valor_pacote ?? evento.valor_pacote,
      newValorTotal: nextValues.valor_total ?? evento.valor_total,
      previousGuestCount,
      previousValorPacote: evento.valor_pacote,
      previousValorTotal: evento.valor_total,
    }),
  ];
};

export const getSignedContractFinancialSnapshot = (
  contractSnapshot: Record<string, unknown> | undefined,
): {
  quantidadeConvidados: number | null;
  valorPacote: number | null;
  valorTotal: number | null;
} => {
  if (!contractSnapshot) {
    return { quantidadeConvidados: null, valorPacote: null, valorTotal: null };
  }

  const quantidadeConvidados =
    typeof contractSnapshot.quantidade_convidados === "number"
      ? contractSnapshot.quantidade_convidados
      : null;
  const valorPacote =
    typeof contractSnapshot.valor_pacote === "number" ? contractSnapshot.valor_pacote : null;
  const valorTotal =
    typeof contractSnapshot.valor_total === "number" ? contractSnapshot.valor_total : null;

  return { quantidadeConvidados, valorPacote, valorTotal };
};
