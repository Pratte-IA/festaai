import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import { formatPropostaFollowupDateBR } from "./proposta-followup-1-message.ts";

export const DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei aqui de novo sobre a festa de {{nome_aniversariante}} na data {{data_festa}}.

Às vezes, só pela proposta, não dá para sentir tudo que a {{nome_empresa}} oferece: o espaço, os brinquedos, a estrutura, o carinho nos detalhes e como a festa pode ficar linda para a família aproveitar de verdade. ✨

Por isso, queria te fazer um convite: que tal vir na {{nome_empresa}} pessoalmente?

Assim você vê o espaço com calma, tira suas dúvidas e consegue sentir se faz sentido para esse dia especial.

Vamos agendar um horário para uma visita?`;

export interface BuildPropostaFollowup3MessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string | null;
}

export const resolvePropostaFollowup3TemplateBody = (templateBody?: string | null): string => {
  const trimmed = templateBody?.trim();
  return trimmed || DEFAULT_PROPOSTA_FOLLOWUP_3_VISITA;
};

export const buildPropostaFollowup3Message = (input: BuildPropostaFollowup3MessageInput): string => {
  const template = resolvePropostaFollowup3TemplateBody(input.templateBody);
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

export const buildPropostaFollowup3Nota = (input: {
  dataEvento: string;
  enviadoEm: string;
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

  return `[Automação] Follow-up 3 enviado (convite de visita) — ${enviadoBR}\nData da festa: ${dataBR}`;
};
