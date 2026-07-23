import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import {
  PROPOSTA_FOLLOWUP_4_TEMPLATE_DATA_INDISPONIVEL,
  PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO,
  type PropostaFollowup4Variante,
  propostaFollowup4VarianteToTemplateKey,
} from "./proposta-followup-constants.ts";
import { formatPropostaFollowupDateBR } from "./proposta-followup-1-message.ts";

export const DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Como não tivemos seu retorno, vou pausar por aqui — e se fizer sentido no futuro, a gente retoma com carinho.

A gente segue com muito carinho e interesse em receber vocês na {{nome_empresa}} para celebrar a festa de {{nome_aniversariante}}, mas também entendemos que cada família tem seu tempo para decidir. ✨

Por enquanto, a data {{data_festa}} continuará disponível para novas reservas.

Se em algum momento você quiser retomar a proposta, ajustar algum detalhe ou agendar uma visita, é só me chamar por aqui. Vai ser uma alegria te ajudar.`;

export const DEFAULT_PROPOSTA_FOLLOWUP_4_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Como não tivemos seu retorno, vou pausar por aqui — e se fizer sentido no futuro, a gente retoma com carinho.

A gente segue com muito carinho e interesse em receber vocês na {{nome_empresa}} para celebrar a festa de {{nome_aniversariante}}, mas também entendemos que cada família tem seu tempo para decidir. ✨

A data {{data_festa}} já não está mais disponível, mas se em algum momento você quiser retomar a proposta, escolher outra data ou agendar uma visita, é só me chamar por aqui. Vai ser uma alegria te ajudar.`;

const defaultTemplateByKey: Record<string, string> = {
  [PROPOSTA_FOLLOWUP_4_TEMPLATE_ENCERRAMENTO]: DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO,
  [PROPOSTA_FOLLOWUP_4_TEMPLATE_DATA_INDISPONIVEL]:
    DEFAULT_PROPOSTA_FOLLOWUP_4_DATA_INDISPONIVEL,
};

export interface BuildPropostaFollowup4MessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string | null;
  variante: PropostaFollowup4Variante;
}

export const resolvePropostaFollowup4TemplateBody = (
  variante: PropostaFollowup4Variante,
  templateBody?: string | null,
): string => {
  const trimmed = templateBody?.trim();
  if (trimmed) return trimmed;

  const key = propostaFollowup4VarianteToTemplateKey(variante);
  return defaultTemplateByKey[key] ?? DEFAULT_PROPOSTA_FOLLOWUP_4_ENCERRAMENTO;
};

export const buildPropostaFollowup4Message = (
  input: BuildPropostaFollowup4MessageInput,
): string => {
  const template = resolvePropostaFollowup4TemplateBody(input.variante, input.templateBody);
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

export const buildPropostaFollowup4Nota = (input: {
  dataEvento: string;
  enviadoEm: string;
  variante: PropostaFollowup4Variante;
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

  return `[Automação] Follow-up 4 enviado (encerramento) — ${enviadoBR}\nVariante: ${varianteLabel}\nData verificada: ${dataBR}\nLead movido para Perdido — sem retorno após a sequência de follow-ups.`;
};
