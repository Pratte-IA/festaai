import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";

export const DEFAULT_PROPOSTA_FOLLOWUP_0_CONTATO_INICIAL = `Oiii, {{primeiro_nome}}! Tudo bem? 😊

Passando aqui para saber se ficou alguma dúvida — a gente adoraria te ajudar com tudo o que você precisar para planejar essa festa especial. 🎉

Ficamos no aguardo do seu retorno para darmos sequência no atendimento e cuidar de cada detalhe com muito carinho. 💛✨`;

export interface BuildPropostaFollowup0MessageInput {
  clienteNome: string | null;
  companyLegalName: string;
  templateBody?: string | null;
}

export const resolvePropostaFollowup0TemplateBody = (templateBody?: string | null): string => {
  const trimmed = templateBody?.trim();
  return trimmed || DEFAULT_PROPOSTA_FOLLOWUP_0_CONTATO_INICIAL;
};

export const buildPropostaFollowup0Message = (input: BuildPropostaFollowup0MessageInput): string => {
  const template = resolvePropostaFollowup0TemplateBody(input.templateBody);
  const primeiroNome = extractFirstName(input.clienteNome);
  const nomeEmpresa = formatCompanyDisplayName(input.companyLegalName);

  return template
    .replaceAll("{{primeiro_nome}}", primeiroNome)
    .replaceAll("{{nome_empresa}}", nomeEmpresa);
};

export const buildPropostaFollowup0Nota = (input: { enviadoEm: string }): string => {
  const enviado = new Date(input.enviadoEm);
  const enviadoBR = enviado.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `[Automação] Follow-up 0 enviado (retomada de contato inicial) — ${enviadoBR}\nLead sem retorno após a nossa última mensagem.`;
};
