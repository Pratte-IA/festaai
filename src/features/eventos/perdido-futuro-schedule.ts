import { parseIsoDateLocal } from "@/lib/date";

import {
  isIsoDateBefore,
  isIsoDateOnOrBefore,
  isPastPartyForReativacao,
  toIsoDateKey,
} from "./perdido-reativacao-schedule";

export const PERDIDO_FUTURO_FUP1_DAYS_BEFORE = 60;

/** Festa ainda não aconteceu — elegível para FUP1. */
export const isFuturePartyForPerdidoFollowup = (dataEvento: string, todayIso: string): boolean =>
  !isPastPartyForReativacao(dataEvento, todayIso);

/** Data em que o FUP1 deve ser disparado (60 dias antes da festa). */
export const getFup1TriggerDate = (dataEvento: string): string | null => {
  const parsed = parseIsoDateLocal(dataEvento);
  if (!parsed) return null;

  parsed.setDate(parsed.getDate() - PERDIDO_FUTURO_FUP1_DAYS_BEFORE);
  return toIsoDateKey(parsed);
};

export const isEligibleForFup1Dispatch = (input: {
  dataEvento: string;
  fup1EnviadoEm: string | null;
  todayIso: string;
}): boolean => {
  if (input.fup1EnviadoEm) return false;
  if (!isFuturePartyForPerdidoFollowup(input.dataEvento, input.todayIso)) return false;

  const trigger = getFup1TriggerDate(input.dataEvento);
  if (!trigger) return false;

  // Festa ainda no futuro no dia do disparo.
  if (!isIsoDateBefore(input.todayIso, input.dataEvento)) return false;

  return isIsoDateOnOrBefore(trigger, input.todayIso);
};
