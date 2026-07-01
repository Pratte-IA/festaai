import { ALUGUEL_ESPACO_TEMPLATE_HTML } from "./aluguel-espaco-template.ts";
import { FESTA_COMPLETA_TEMPLATE_HTML } from "./festa-completa-template.ts";

export const CONTRACT_TEMPLATE_KEYS = [
  "aluguel_espaco",
  "aluguel_espaco_festa_completa",
] as const;

export type ContractTemplateKey = (typeof CONTRACT_TEMPLATE_KEYS)[number];

/** Horário de término padrão para locação diária do espaço (meia-noite). */
export const DEFAULT_ALUGUEL_ESPACO_HORA_TERMINO = "00:00";

export const isAluguelEspacoTemplateKey = (
  value: ContractTemplateKey | null | undefined,
): value is "aluguel_espaco" => value === "aluguel_espaco";

export const CONTRACT_TEMPLATE_BASE_HTML: Record<ContractTemplateKey, string> = {
  aluguel_espaco: ALUGUEL_ESPACO_TEMPLATE_HTML,
  aluguel_espaco_festa_completa: FESTA_COMPLETA_TEMPLATE_HTML,
};

export const isContractTemplateKey = (value: string): value is ContractTemplateKey =>
  CONTRACT_TEMPLATE_KEYS.includes(value as ContractTemplateKey);
