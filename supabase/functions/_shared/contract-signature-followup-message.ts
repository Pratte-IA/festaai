import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import {
  CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE,
  CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE,
} from "./contract-signature-followup-constants.ts";
import { formatPropostaFollowupDateBR } from "./proposta-followup-1-message.ts";

export const DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_INICIAL = `Oi, {{primeiro_nome}}! Tudo bem? 😊

Recebemos seu formulário de contratação na {{nome_empresa}} — obrigada pelo carinho em escolher a gente para a festa de {{nome_aniversariante}}! 🎉

Seu contrato já está pronto. Falta só um último passo: a assinatura eletrônica.

É rapidinho e pode ser feito pelo celular:
{{link_formulario}}

Se tiver qualquer dúvida sobre o contrato, pacote ou pagamento, estamos por aqui para te ajudar. 💛✨`;

export const DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE = `Oi, {{primeiro_nome}}! Passando para lembrar da assinatura do contrato da festa de {{nome_aniversariante}}. 😊

O link continua disponível:
{{link_formulario}}

Qualquer dúvida, estamos por aqui! 💛`;

const defaultTemplateByKey: Record<string, string> = {
  [CONTRACT_SIGNATURE_FOLLOWUP_INICIAL_TEMPLATE]: DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_INICIAL,
  [CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE_TEMPLATE]: DEFAULT_CONTRACT_SIGNATURE_FOLLOWUP_LEMBRETE,
};

export interface BuildContractSignatureFollowupMessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  dataEvento: string | null;
  linkFormulario: string;
  templateBody?: string | null;
  templateKey: string;
}

const applyTemplateVariables = (
  template: string,
  input: BuildContractSignatureFollowupMessageInput,
): string => {
  const primeiroNome = extractFirstName(input.clienteNome);
  const nomeEmpresa = formatCompanyDisplayName(input.companyLegalName);
  const nomeAniversariante = input.aniversarianteNome?.trim() || "aniversariante";
  const dataFesta = input.dataEvento ? formatPropostaFollowupDateBR(input.dataEvento) : "—";

  return template
    .replaceAll("{{primeiro_nome}}", primeiroNome)
    .replaceAll("{{nome_empresa}}", nomeEmpresa)
    .replaceAll("{{nome_aniversariante}}", nomeAniversariante)
    .replaceAll("{{data_festa}}", dataFesta)
    .replaceAll("{{link_formulario}}", input.linkFormulario);
};

export const buildContractSignatureFollowupMessage = (
  input: BuildContractSignatureFollowupMessageInput,
): string => {
  const trimmed = input.templateBody?.trim();
  const template = trimmed || defaultTemplateByKey[input.templateKey] || "";
  return applyTemplateVariables(template, input);
};

export const buildContractSignatureFollowupNota = (input: {
  enviadoEm: string;
  step: "inicial" | "lembrete";
}): string => {
  const enviado = new Date(input.enviadoEm);
  const enviadoBR = enviado.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const label = input.step === "inicial" ? "inicial" : "lembrete";
  return `[Automação] Follow-up de assinatura (${label}) enviado — ${enviadoBR}\nContrato aguardando assinatura após envio do formulário.`;
};
