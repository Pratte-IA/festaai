import { formatCompanyDisplayName } from "@/lib/company-display-name";

import {
  DEFAULT_OPORTUNIDADE_FUTURA_FOF1,
  DEFAULT_OPORTUNIDADE_FUTURA_FOF2,
  DEFAULT_OPORTUNIDADE_FUTURA_FOF3,
} from "./oportunidade-futura-followup";
import { formatMesFestaBR } from "./oportunidade-futura-schedule";

export const OPORTUNIDADE_FUTURA_PREVIEW = {
  aniversarianteNome: "Helena",
  clienteNome: "Mariana Silva",
  targetPartyDate: "2026-07-15",
} as const;

const extractFirstName = (fullName: string): string => {
  const trimmed = fullName.trim();
  if (!trimmed) return "Cliente";
  return trimmed.split(/\s+/)[0] ?? trimmed;
};

const resolveAniversarianteLabel = (nome: string | null | undefined): string =>
  nome?.trim() || "seu filho(a)";

const buildMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  defaultTemplate: string;
  targetPartyDate: string;
  templateBody?: string;
}): string => {
  const template = input.templateBody?.trim() || input.defaultTemplate;
  const mesFesta = formatMesFestaBR(input.targetPartyDate);

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", resolveAniversarianteLabel(input.aniversarianteNome))
    .replaceAll("{{mes_festa}}", mesFesta)
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};

export const buildOportunidadeFuturaFof1PreviewMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  targetPartyDate: string;
  templateBody?: string;
}): string =>
  buildMessage({
    ...input,
    defaultTemplate: DEFAULT_OPORTUNIDADE_FUTURA_FOF1,
  });

export const buildOportunidadeFuturaFof2PreviewMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  targetPartyDate: string;
  templateBody?: string;
}): string =>
  buildMessage({
    ...input,
    defaultTemplate: DEFAULT_OPORTUNIDADE_FUTURA_FOF2,
  });

export const buildOportunidadeFuturaFof3PreviewMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  targetPartyDate: string;
  templateBody?: string;
}): string =>
  buildMessage({
    ...input,
    defaultTemplate: DEFAULT_OPORTUNIDADE_FUTURA_FOF3,
  });
