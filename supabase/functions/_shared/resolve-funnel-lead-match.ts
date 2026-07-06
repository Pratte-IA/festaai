import { phonesMatch } from "./phone.ts";

export type FunnelLeadCandidate = {
  cliente_email: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  etapa: string;
  funil: string;
  id: number;
  status_interno: string;
  updated_at: string;
};

export type FunnelLeadMatchCriteria = {
  email: string | null;
  linkedEventoId?: number | null;
  name: string | null;
  phone: string | null;
};

export type FunnelLeadMatchResult = {
  evento: FunnelLeadCandidate;
  source: "festa" | "vendas";
};

const normalizeEmailForMatch = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
};

export const normalizeLeadNameForMatch = (name: string | null | undefined): string =>
  (name ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const isVendasLead = (evento: FunnelLeadCandidate): boolean => evento.funil === "vendas";

const isFestaLead = (evento: FunnelLeadCandidate): boolean => evento.funil === "festa";

const findSingleNameMatch = (
  eventos: FunnelLeadCandidate[],
  funil: "festa" | "vendas",
  normalizedName: string,
): FunnelLeadCandidate | null => {
  const matches = eventos.filter((evento) => {
    if (evento.funil !== funil) return false;
    return normalizeLeadNameForMatch(evento.cliente_nome) === normalizedName;
  });

  return matches.length === 1 ? matches[0] : null;
};

const findPhoneMatches = (
  eventos: FunnelLeadCandidate[],
  funil: "festa" | "vendas",
  phone: string,
): FunnelLeadCandidate[] =>
  eventos.filter(
    (evento) => evento.funil === funil && phonesMatch(evento.cliente_telefone, phone),
  );

/** Entre vários leads com o mesmo telefone, prioriza o que bate com o nome informado. */
const resolvePhoneMatch = (
  eventos: FunnelLeadCandidate[],
  funil: "festa" | "vendas",
  criteria: FunnelLeadMatchCriteria,
): FunnelLeadCandidate | null => {
  if (!criteria.phone) return null;

  const phoneMatches = findPhoneMatches(eventos, funil, criteria.phone);
  if (phoneMatches.length === 0) return null;
  if (phoneMatches.length === 1) return phoneMatches[0];

  const normalizedName = normalizeLeadNameForMatch(criteria.name);
  if (normalizedName.length >= 3) {
    const byName = phoneMatches.find(
      (evento) => normalizeLeadNameForMatch(evento.cliente_nome) === normalizedName,
    );
    if (byName) return byName;
  }

  return phoneMatches.sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
  )[0];
};

/** Prioriza lead vinculado, depois telefone, e-mail e nome único em Vendas. */
export const resolveFunnelLeadMatch = (
  eventos: FunnelLeadCandidate[],
  criteria: FunnelLeadMatchCriteria,
): FunnelLeadMatchResult | null => {
  if (criteria.linkedEventoId) {
    const linked = eventos.find((evento) => evento.id === criteria.linkedEventoId);
    if (linked && (isVendasLead(linked) || isFestaLead(linked))) {
      return { evento: linked, source: linked.funil as "festa" | "vendas" };
    }
  }

  if (criteria.phone) {
    const vendasPhoneMatch = resolvePhoneMatch(eventos, "vendas", criteria);
    if (vendasPhoneMatch) return { evento: vendasPhoneMatch, source: "vendas" };

    const festaPhoneMatch = resolvePhoneMatch(eventos, "festa", criteria);
    if (festaPhoneMatch) return { evento: festaPhoneMatch, source: "festa" };
  }

  const normalizedEmail = normalizeEmailForMatch(criteria.email);
  if (normalizedEmail) {
    const vendasEmailMatch = eventos.find(
      (evento) =>
        isVendasLead(evento) && normalizeEmailForMatch(evento.cliente_email) === normalizedEmail,
    );
    if (vendasEmailMatch) return { evento: vendasEmailMatch, source: "vendas" };

    const festaEmailMatch = eventos.find(
      (evento) =>
        isFestaLead(evento) && normalizeEmailForMatch(evento.cliente_email) === normalizedEmail,
    );
    if (festaEmailMatch) return { evento: festaEmailMatch, source: "festa" };
  }

  const normalizedName = normalizeLeadNameForMatch(criteria.name);
  if (normalizedName.length >= 3) {
    const vendasNameMatch = findSingleNameMatch(eventos, "vendas", normalizedName);
    if (vendasNameMatch) return { evento: vendasNameMatch, source: "vendas" };

    const festaNameMatch = findSingleNameMatch(eventos, "festa", normalizedName);
    if (festaNameMatch) return { evento: festaNameMatch, source: "festa" };
  }

  return null;
};

export const findDuplicateVendasLeads = (
  eventos: FunnelLeadCandidate[],
  criteria: FunnelLeadMatchCriteria,
  excludeEventoId: number,
): FunnelLeadCandidate[] =>
  eventos.filter((evento) => {
    if (evento.id === excludeEventoId || !isVendasLead(evento)) return false;

    if (criteria.phone && phonesMatch(evento.cliente_telefone, criteria.phone)) return true;

    const normalizedEmail = normalizeEmailForMatch(criteria.email);
    if (
      normalizedEmail &&
      normalizeEmailForMatch(evento.cliente_email) === normalizedEmail
    ) {
      return true;
    }

    const normalizedName = normalizeLeadNameForMatch(criteria.name);
    if (
      normalizedName.length >= 3 &&
      normalizeLeadNameForMatch(evento.cliente_nome) === normalizedName
    ) {
      return true;
    }

    return false;
  });
