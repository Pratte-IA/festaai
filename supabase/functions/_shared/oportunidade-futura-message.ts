import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import {
  formatMesFestaBR,
  OPORTUNIDADE_FUTURA_FOF1_TEMPLATE,
  OPORTUNIDADE_FUTURA_FOF2_TEMPLATE,
  OPORTUNIDADE_FUTURA_FOF3_TEMPLATE,
  type OportunidadeFuturaFofStep,
  oportunidadeFuturaFofStepToTemplateKey,
} from "./oportunidade-futura-constants.ts";

export const DEFAULT_OPORTUNIDADE_FUTURA_FOF1 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Parece que foi ontem que comemoramos a festa do(a) {{nome_aniversariante}} aqui na {{nome_empresa}}! Foi uma alegria fazer parte desse momento tão especial com vocês. 💛🎉

Como o próximo aniversário já começa a se aproximar, passei para saber: vocês já começaram a pensar na comemoração deste ano?

Estamos iniciando a organização da agenda para {{mes_festa}}, e seria muito especial receber vocês novamente por aqui. ✨

Posso te enviar as opções e valores atualizados?`;

export const DEFAULT_OPORTUNIDADE_FUTURA_FOF2 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei por aqui porque estamos avançando na organização das festas de {{mes_festa}} e lembrei novamente do aniversário do(a) {{nome_aniversariante}}. 🎂✨

Como vocês já comemoraram conosco, sabemos um pouco do que a família gosta e podemos ajudar a organizar a próxima festa de forma ainda mais prática e personalizada.

Com antecedência, vocês também têm mais possibilidades de datas, horários e escolhas para a comemoração.

Quer que eu verifique as opções disponíveis e prepare uma nova proposta para vocês? 💛`;

export const DEFAULT_OPORTUNIDADE_FUTURA_FOF3 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

O aniversário do(a) {{nome_aniversariante}} está se aproximando, e queremos muito ter a alegria de comemorar mais um ano com vocês aqui na {{nome_empresa}}. 🎉💛

Como faltam cerca de três meses, este é um ótimo momento para definir a festa e garantir uma boa opção de data e horário.

Posso consultar nossa agenda para {{mes_festa}} e verificar as melhores possibilidades para vocês?

Será muito especial fazer parte de mais um capítulo dessa história. ✨`;

const defaultTemplateByKey: Record<string, string> = {
  [OPORTUNIDADE_FUTURA_FOF1_TEMPLATE]: DEFAULT_OPORTUNIDADE_FUTURA_FOF1,
  [OPORTUNIDADE_FUTURA_FOF2_TEMPLATE]: DEFAULT_OPORTUNIDADE_FUTURA_FOF2,
  [OPORTUNIDADE_FUTURA_FOF3_TEMPLATE]: DEFAULT_OPORTUNIDADE_FUTURA_FOF3,
};

const resolveAniversarianteLabel = (nome: string | null): string => nome?.trim() || "seu filho(a)";

export interface BuildOportunidadeFuturaMessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  step: OportunidadeFuturaFofStep;
  targetPartyDate: string;
  templateBody?: string | null;
}

export const resolveOportunidadeFuturaTemplateBody = (
  step: OportunidadeFuturaFofStep,
  templateBody?: string | null,
): string => {
  const trimmed = templateBody?.trim();
  if (trimmed) return trimmed;

  const key = oportunidadeFuturaFofStepToTemplateKey(step);
  return defaultTemplateByKey[key] ?? DEFAULT_OPORTUNIDADE_FUTURA_FOF1;
};

export const buildOportunidadeFuturaMessage = (
  input: BuildOportunidadeFuturaMessageInput,
): string => {
  const template = resolveOportunidadeFuturaTemplateBody(input.step, input.templateBody);
  const primeiroNome = extractFirstName(input.clienteNome);
  const nomeAniversariante = resolveAniversarianteLabel(input.aniversarianteNome);
  const mesFesta = formatMesFestaBR(input.targetPartyDate);
  const nomeEmpresa = formatCompanyDisplayName(input.companyLegalName);

  return template
    .replaceAll("{{primeiro_nome}}", primeiroNome)
    .replaceAll("{{nome_aniversariante}}", nomeAniversariante)
    .replaceAll("{{mes_festa}}", mesFesta)
    .replaceAll("{{nome_empresa}}", nomeEmpresa);
};

export const buildOportunidadeFuturaNota = (input: {
  enviadoEm: string;
  step: OportunidadeFuturaFofStep;
  targetPartyDate: string;
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
  const mesFesta = formatMesFestaBR(input.targetPartyDate);

  return `[Automação] Follow-up FOF${input.step} (oportunidade futura) enviado — ${enviadoBR}\nFesta alvo: ${input.targetPartyDate} (${mesFesta})`;
};
