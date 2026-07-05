import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import {
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE,
  type PropostaFollowup2Variante,
  propostaFollowup2VarianteToTemplateKey,
} from "./proposta-followup-constants.ts";
import { formatPropostaFollowupDateBR } from "./proposta-followup-1-message.ts";

export const DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui porque a data {{data_festa}} para a festa de {{nome_aniversariante}} ainda está disponível, mas eu não queria deixar passar muito tempo sem te avisar.

A gente adoraria receber vocês aqui na {{nome_empresa}} e preparar uma festa linda, leve e especial para {{nome_aniversariante}}. Tenho certeza de que seria um dia muito gostoso para a família aproveitar de verdade. ✨

Como nossa agenda vai sendo preenchida conforme as reservas são confirmadas, queria entender com você:

O que falta para conseguirmos seguir com a reserva dessa data?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui para retomar o contato sobre a festa de {{nome_aniversariante}}.

A data {{data_festa}} acabou sendo reservada por outra família, mas a gente adoraria receber vocês na {{nome_empresa}} e preparar uma festa linda, leve e especial — mesmo que seja em outra data. ✨

Como nossa agenda vai sendo preenchida conforme as reservas são confirmadas, queria entender com você:

O que falta para conseguirmos seguir com a festa de {{nome_aniversariante}}?`;

const defaultTemplateByKey: Record<string, string> = {
  [PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_LIVRE]: DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE,
  [PROPOSTA_FOLLOWUP_2_TEMPLATE_DATA_INDISPONIVEL]:
    DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_INDISPONIVEL,
};

export interface BuildPropostaFollowup2MessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string | null;
  variante: PropostaFollowup2Variante;
}

export const resolvePropostaFollowup2TemplateBody = (
  variante: PropostaFollowup2Variante,
  templateBody?: string | null,
): string => {
  const trimmed = templateBody?.trim();
  if (trimmed) return trimmed;

  const key = propostaFollowup2VarianteToTemplateKey(variante);
  return defaultTemplateByKey[key] ?? DEFAULT_PROPOSTA_FOLLOWUP_2_DATA_LIVRE;
};

export const buildPropostaFollowup2Message = (
  input: BuildPropostaFollowup2MessageInput,
): string => {
  const template = resolvePropostaFollowup2TemplateBody(input.variante, input.templateBody);
  const primeiroNome = extractFirstName(input.clienteNome);
  const nomeAniversariante = input.aniversarianteNome?.trim() || "aniversariante";
  const nomeEmpresa = formatCompanyDisplayName(input.companyLegalName);
  const dataFesta = formatPropostaFollowupDateBR(input.dataEvento);

  return template
    .replaceAll("{{primeiro_nome}}", primeiroNome)
    .replaceAll("{{nome_aniversariante}}", nomeAniversariante)
    .replaceAll("{{data_festa}}", dataFesta)
    .replaceAll("{{nome_empresa}}", nomeEmpresa);
};

export const buildPropostaFollowup2Nota = (input: {
  dataEvento: string;
  enviadoEm: string;
  variante: PropostaFollowup2Variante;
}): string => {
  const dataBR = formatPropostaFollowupDateBR(input.dataEvento);
  const enviado = new Date(input.enviadoEm);
  const enviadoBR = enviado.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const varianteLabel =
    input.variante === "data_livre"
      ? "data livre (disponível)"
      : "data indisponível (reservada por outra família)";

  return `[Automação] Follow-up 2 enviado — ${enviadoBR}\nVariante: ${varianteLabel}\nData verificada: ${dataBR}`;
};
