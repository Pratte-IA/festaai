import { formatCompanyDisplayName } from "@/lib/company-display-name";

import {
  DEFAULT_PERDIDO_REATIVACAO_FOP1,
  DEFAULT_PERDIDO_REATIVACAO_FOP2,
  DEFAULT_PERDIDO_REATIVACAO_FOP3,
} from "./perdido-reativacao-followup";
import { formatMesFestaBR } from "./perdido-reativacao-schedule";

export const PERDIDO_REATIVACAO_PREVIEW = {
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

export const buildPerdidoReativacaoFop1PreviewMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  targetPartyDate: string;
  templateBody?: string;
}): string =>
  buildMessage({
    ...input,
    defaultTemplate: DEFAULT_PERDIDO_REATIVACAO_FOP1,
  });

export const buildPerdidoReativacaoFop2PreviewMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  targetPartyDate: string;
  templateBody?: string;
}): string =>
  buildMessage({
    ...input,
    defaultTemplate: DEFAULT_PERDIDO_REATIVACAO_FOP2,
  });

export const buildPerdidoReativacaoFop3PreviewMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  targetPartyDate: string;
  templateBody?: string;
}): string =>
  buildMessage({
    ...input,
    defaultTemplate: DEFAULT_PERDIDO_REATIVACAO_FOP3,
  });
