import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import {
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE,
  type PropostaFollowup1Variante,
  propostaFollowup1VarianteToTemplateKey,
} from "./proposta-followup-constants.ts";

export const DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui para ver se ficou alguma dúvida sobre a proposta da festa de {{nome_aniversariante}}.

Sei que escolher o lugar da festa envolve carinho, organização e também segurança de que tudo vai dar certo no dia. Por isso, quero te ajudar a deixar essa decisão mais fácil. ✨

A data {{data_festa}} ainda está livre por enquanto.

Quer que eu te explique como funciona para garantir essa data ou prefere que eu ajuste algum ponto da proposta?`;

export const DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui para te atualizar sobre a festa de {{nome_aniversariante}}.

A data {{data_festa}} acabou sendo reservada por outra família, mas a gente continua com muito carinho e interesse em receber vocês na {{nome_empresa}} para viver esse dia especial. ✨

Às vezes uma nova data também pode funcionar muito bem para a família, e eu posso te ajudar a encontrar a melhor opção disponível na nossa agenda.

Quer que eu veja quais datas ainda temos livres para a festa de {{nome_aniversariante}}?`;

const defaultTemplateByKey: Record<string, string> = {
  [PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_LIVRE]: DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE,
  [PROPOSTA_FOLLOWUP_1_TEMPLATE_DATA_INDISPONIVEL]:
    DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_INDISPONIVEL,
};

export const formatPropostaFollowupDateBR = (dateIso: string): string => {
  const [year, month, day] = dateIso.split("-");
  if (!year || !month || !day) return dateIso;
  return `${day}/${month}/${year}`;
};

export interface BuildPropostaFollowup1MessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string | null;
  variante: PropostaFollowup1Variante;
}

export const resolvePropostaFollowup1TemplateBody = (
  variante: PropostaFollowup1Variante,
  templateBody?: string | null,
): string => {
  const trimmed = templateBody?.trim();
  if (trimmed) return trimmed;

  const key = propostaFollowup1VarianteToTemplateKey(variante);
  return defaultTemplateByKey[key] ?? DEFAULT_PROPOSTA_FOLLOWUP_1_DATA_LIVRE;
};

export const buildPropostaFollowup1Message = (
  input: BuildPropostaFollowup1MessageInput,
): string => {
  const template = resolvePropostaFollowup1TemplateBody(input.variante, input.templateBody);
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

export const buildPropostaFollowup1Nota = (input: {
  dataEvento: string;
  enviadoEm: string;
  variante: PropostaFollowup1Variante;
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

  return `[Automação] Follow-up 1 enviado — ${enviadoBR}\nVariante: ${varianteLabel}\nData verificada: ${dataBR}`;
};
