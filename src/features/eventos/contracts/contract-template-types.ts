import { ALUGUEL_ESPACO_TEMPLATE_HTML } from "./aluguel-espaco-template";
import { FESTA_COMPLETA_TEMPLATE_HTML } from "./festa-completa-template";

export const CONTRACT_TEMPLATE_KEYS = [
  "aluguel_espaco",
  "aluguel_espaco_festa_completa",
] as const;

export type ContractTemplateKey = (typeof CONTRACT_TEMPLATE_KEYS)[number];

export interface ContractTemplateDefinition {
  description: string;
  name: string;
  placeholderHtml: string;
  sortOrder: number;
}

export const CONTRACT_TEMPLATE_DEFINITIONS: Record<ContractTemplateKey, ContractTemplateDefinition> = {
  aluguel_espaco: {
    description:
      "Para clientes que contratam apenas o espaço físico, sem pacote de festa completa da casa.",
    name: "Contrato de Aluguel do Espaço",
    placeholderHtml: ALUGUEL_ESPACO_TEMPLATE_HTML,
    sortOrder: 1,
  },
  aluguel_espaco_festa_completa: {
    description:
      "Para clientes que contratam o espaço com pacote, adicionais e serviços de festa completa.",
    name: "Contrato de Aluguel do Espaço + Festa Completa",
    placeholderHtml: FESTA_COMPLETA_TEMPLATE_HTML,
    sortOrder: 2,
  },
};

export const isContractTemplateKey = (value: string): value is ContractTemplateKey =>
  CONTRACT_TEMPLATE_KEYS.includes(value as ContractTemplateKey);

export const getContractTemplateDefinition = (key: ContractTemplateKey) =>
  CONTRACT_TEMPLATE_DEFINITIONS[key];
