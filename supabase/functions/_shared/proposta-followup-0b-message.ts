import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";

export const DEFAULT_PROPOSTA_FOLLOWUP_0B_ENCERRAMENTO = `Oiii, {{primeiro_nome}}! 😊

Você ainda mantém interesse em fazer uma festa na {{nome_empresa}}? 🎉

Ficamos no aguardo do seu retorno por aqui — será um prazer te ajudar a planejar esse dia especial. 💛✨`;

export interface BuildPropostaFollowup0bMessageInput {
  clienteNome: string | null;
  companyLegalName: string;
  templateBody?: string | null;
}

export const resolvePropostaFollowup0bTemplateBody = (templateBody?: string | null): string => {
  const trimmed = templateBody?.trim();
  return trimmed || DEFAULT_PROPOSTA_FOLLOWUP_0B_ENCERRAMENTO;
};

export const buildPropostaFollowup0bMessage = (
  input: BuildPropostaFollowup0bMessageInput,
): string => {
  const template = resolvePropostaFollowup0bTemplateBody(input.templateBody);
  const primeiroNome = extractFirstName(input.clienteNome);
  const nomeEmpresa = formatCompanyDisplayName(input.companyLegalName);

  return template
    .replaceAll("{{primeiro_nome}}", primeiroNome)
    .replaceAll("{{nome_empresa}}", nomeEmpresa);
};

export const buildPropostaFollowup0bNota = (input: { enviadoEm: string }): string => {
  const enviado = new Date(input.enviadoEm);
  const enviadoBR = enviado.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    `[Automação] Follow-up 0b enviado (2ª tentativa / encerramento de contato inicial) — ${enviadoBR}\n` +
    "Lead movido para Perdido por falta de retorno."
  );
};
