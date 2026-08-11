import { normalizeBrazilPhoneDigits, phonesMatch } from "./phone.ts";

/** Lead de vendas que bloqueia FOF: qualquer card não cancelado (inclui perdido). */
export interface FofBlockingVendasLead {
  cliente_telefone: string | null;
  status_interno?: string | null;
  tenant_id?: number;
}

export interface FofOfCandidate {
  cliente_telefone: string | null;
  data_evento: string | null;
  id: number;
  tenant_id: number;
}

export type FofSkipReason =
  | "vendas_ativo_mesmo_telefone"
  | "oportunidade_futura_nao_canonica";

export interface FofEligibilityDecision {
  eligibleIds: number[];
  skipped: Array<{ eventoId: number; reason: FofSkipReason }>;
}

export const isVendasLeadBlockingFof = (evento: {
  status_interno?: string | null;
}): boolean => evento.status_interno !== "cancelado";

export const hasVendasLeadBlockingFof = (
  phone: string | null | undefined,
  vendasLeads: FofBlockingVendasLead[],
  tenantId?: number,
): boolean => {
  if (!phone) return false;

  return vendasLeads.some((lead) => {
    if (!isVendasLeadBlockingFof(lead)) return false;
    if (tenantId != null && lead.tenant_id != null && lead.tenant_id !== tenantId) {
      return false;
    }
    return phonesMatch(lead.cliente_telefone, phone);
  });
};

/** Canônico = festa mais recente (`data_evento`); empate → maior `id`. */
export const pickCanonicalOportunidadeFuturaId = (
  candidates: Array<{ data_evento: string | null; id: number }>,
): number | null => {
  if (candidates.length === 0) return null;

  let best = candidates[0];
  for (let i = 1; i < candidates.length; i += 1) {
    const current = candidates[i];
    const bestDate = best.data_evento ?? "";
    const currentDate = current.data_evento ?? "";
    if (currentDate > bestDate || (currentDate === bestDate && current.id > best.id)) {
      best = current;
    }
  }
  return best.id;
};

const phoneTenantKey = (tenantId: number, phone: string | null | undefined): string | null => {
  const digits = normalizeBrazilPhoneDigits(phone);
  if (!digits) return null;
  return `${tenantId}:${digits}`;
};

/**
 * Elegíveis a FOF: no máximo 1 OF por telefone (festa mais recente),
 * e nenhum se já existir lead de vendas não cancelado no mesmo telefone.
 */
export const selectFofDispatchEligibleIds = (
  ofCandidates: FofOfCandidate[],
  vendasLeads: FofBlockingVendasLead[],
): FofEligibilityDecision => {
  const skipped: FofEligibilityDecision["skipped"] = [];
  const groups = new Map<string, FofOfCandidate[]>();

  for (const candidate of ofCandidates) {
    const key = phoneTenantKey(candidate.tenant_id, candidate.cliente_telefone);
    if (!key) {
      // Sem telefone válido: mantém elegível isolado (comportamento anterior por id).
      groups.set(`id:${candidate.id}`, [candidate]);
      continue;
    }
    const list = groups.get(key) ?? [];
    list.push(candidate);
    groups.set(key, list);
  }

  const eligibleIds: number[] = [];

  for (const group of groups.values()) {
    const sample = group[0];
    if (
      hasVendasLeadBlockingFof(sample.cliente_telefone, vendasLeads, sample.tenant_id)
    ) {
      for (const evento of group) {
        skipped.push({ eventoId: evento.id, reason: "vendas_ativo_mesmo_telefone" });
      }
      continue;
    }

    const canonicalId = pickCanonicalOportunidadeFuturaId(group);
    for (const evento of group) {
      if (evento.id === canonicalId) {
        eligibleIds.push(evento.id);
      } else {
        skipped.push({ eventoId: evento.id, reason: "oportunidade_futura_nao_canonica" });
      }
    }
  }

  return { eligibleIds, skipped };
};
