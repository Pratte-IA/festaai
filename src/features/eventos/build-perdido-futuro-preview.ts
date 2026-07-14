import { formatCompanyDisplayName } from "@/lib/company-display-name";
import { formatIsoDateBR } from "@/lib/date";

import {
  DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL,
  DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE,
  type PerdidoFuturoFup1Variante,
  perdidoFuturoFup1VarianteToTemplateKey,
} from "./perdido-futuro-followup";

export const PERDIDO_FUTURO_PREVIEW = {
  aniversarianteNome: "Helena",
  clienteNome: "Mariana Silva",
  dataEvento: "2026-09-15",
} as const;

const extractFirstName = (fullName: string): string => {
  const trimmed = fullName.trim();
  if (!trimmed) return "Cliente";
  return trimmed.split(/\s+/)[0] ?? trimmed;
};

const resolveAniversarianteLabel = (nome: string | null | undefined): string =>
  nome?.trim() || "seu filho(a)";

const resolveTemplateBody = (
  variante: PerdidoFuturoFup1Variante,
  templateBody?: string,
): string => {
  const trimmed = templateBody?.trim();
  if (trimmed) return trimmed;

  return variante === "data_livre"
    ? DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE
    : DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL;
};

export const buildPerdidoFuturoFup1PreviewMessage = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string;
  variante: PerdidoFuturoFup1Variante;
}): string => {
  const template = resolveTemplateBody(input.variante, input.templateBody);
  const dataFesta = formatIsoDateBR(input.dataEvento);

  return template
    .replaceAll("{{primeiro_nome}}", extractFirstName(input.clienteNome))
    .replaceAll("{{nome_aniversariante}}", resolveAniversarianteLabel(input.aniversarianteNome))
    .replaceAll("{{data_festa}}", dataFesta)
    .replaceAll("{{nome_empresa}}", formatCompanyDisplayName(input.companyLegalName));
};

export const buildPerdidoFuturoFup1PreviewMessages = (input: {
  aniversarianteNome: string | null;
  clienteNome: string;
  companyLegalName: string;
  dataEvento: string;
  dataIndisponivelBody?: string;
  dataLivreBody?: string;
}) => ({
  dataIndisponivel: buildPerdidoFuturoFup1PreviewMessage({
    ...input,
    templateBody: input.dataIndisponivelBody,
    variante: "data_indisponivel",
  }),
  dataLivre: buildPerdidoFuturoFup1PreviewMessage({
    ...input,
    templateBody: input.dataLivreBody,
    variante: "data_livre",
  }),
});

export { perdidoFuturoFup1VarianteToTemplateKey };
