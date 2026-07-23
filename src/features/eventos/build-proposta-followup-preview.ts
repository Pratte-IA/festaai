import { formatCompanyDisplayName } from "@/lib/company-display-name";

import {
  DEFAULT_PROPOSTA_FOLLOWUP_0_CONTATO_INICIAL,
  DEFAULT_PROPOSTA_FOLLOWUP_0B_ENCERRAMENTO,
  DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE,
  DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE,
  DEFAULT_PROPOSTA_FOLLOWUP_3_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA,
  DEFAULT_PROPOSTA_FOLLOWUP_4_DATA_INDISPONIVEL,
  DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO,
  type PropostaFollowup1Variante,
  type PropostaFollowup2Variante,
  type PropostaFollowup3Variante,
  type PropostaFollowup4Variante,
} from "./proposta-followup";

export const PROPOSTA_FOLLOWUP_PREVIEW = {
  aniversarianteNome: "Helena",
  clienteNome: "Mariana Silva",
  dataEvento: "2026-08-15",
} as const;

const formatDateBR = (dateIso: string): string => {
  const [year, month, day] = dateIso.split("-");
  if (!year || !month || !day) return dateIso;
  return `${day}/${month}/${year}`;
};

const extractFirstName = (fullName: string): string => {
  const trimmed = fullName.trim();
  if (!trimmed) return "Cliente";
  return trimmed.split(/\s+/)[0] ?? trimmed;
};

export const buildPropostaFollowup0PreviewMessage = (input: {
  clienteNome: string;
  companyLegalName: string;
  templateBody?: string;
}): string => {
  const template = input.templateBody?.trim() || DEFAULT_PROPOSTA_FOLLOWUP_0_CONTATO_INICIAL;

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};

export const buildPropostaFollowup0bPreviewMessage = (input: {
  clienteNome: string;
  companyLegalName: string;
  templateBody?: string;
}): string => {
  const template = input.templateBody?.trim() || DEFAULT_PROPOSTA_FOLLOWUP_0B_ENCERRAMENTO;

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};

export const buildPropostaFollowup1PreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string;
  variante: PropostaFollowup1Variante;
}): string => {
  const template =
    input.templateBody?.trim() ||
    (input.variante === "data_livre"
      ? DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE
      : DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL);

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", input.aniversarianteNome)
    .replaceAll("{{data_festa}}", formatDateBR(input.dataEvento))
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};

export const buildPropostaFollowup2PreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string;
  variante: PropostaFollowup2Variante;
}): string => {
  const template =
    input.templateBody?.trim() ||
    (input.variante === "data_livre"
      ? DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE
      : DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL);

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", input.aniversarianteNome)
    .replaceAll("{{data_festa}}", formatDateBR(input.dataEvento))
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};

export const buildPropostaFollowup3PreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string;
  variante: PropostaFollowup3Variante;
}): string => {
  const template =
    input.templateBody?.trim() ||
    (input.variante === "data_livre"
      ? DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA
      : DEFAULT_PROPOSTA_FOLLOWUP_3_DATA_INDISPONIVEL);

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", input.aniversarianteNome)
    .replaceAll("{{data_festa}}", formatDateBR(input.dataEvento))
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};

export const buildPropostaFollowup4PreviewMessage = (input: {
  aniversarianteNome: string;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string;
  variante: PropostaFollowup4Variante;
}): string => {
  const template =
    input.templateBody?.trim() ||
    (input.variante === "data_livre"
      ? DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO
      : DEFAULT_PROPOSTA_FOLLOWUP_4_DATA_INDISPONIVEL);

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", input.aniversarianteNome)
    .replaceAll("{{data_festa}}", formatDateBR(input.dataEvento))
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};
