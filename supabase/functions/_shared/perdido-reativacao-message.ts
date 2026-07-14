import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import {
  formatMesFestaBR,
  PERDIDO_REATIVACAO_FOP1_TEMPLATE,
  PERDIDO_REATIVACAO_FOP2_TEMPLATE,
  PERDIDO_REATIVACAO_FOP3_TEMPLATE,
  type PerdidoReativacaoFopStep,
  perdidoReativacaoFopStepToTemplateKey,
} from "./perdido-reativacao-constants.ts";

export const DEFAULT_PERDIDO_REATIVACAO_FOP1 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

No ano passado, você conversou com a gente sobre a festa do(a) {{nome_aniversariante}}, e lembrei de vocês porque já estamos começando a organizar as comemorações para {{mes_festa}}. 🎉

Como ainda faltam alguns meses, este é um ótimo momento para planejar tudo com calma, escolher uma boa data e conhecer as opções de festa da Vila Encantada. ✨

Vocês já começaram a pensar no aniversário deste ano?

Posso te enviar as opções e valores atualizados, sem compromisso. 😊`;

export const DEFAULT_PERDIDO_REATIVACAO_FOP2 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Passei novamente porque estamos organizando as festas de {{mes_festa}} e ainda temos algumas possibilidades de datas para esse período. 🎉

Como o aniversário do(a) {{nome_aniversariante}} está se aproximando, queria saber se vocês já decidiram como será a comemoração deste ano.

Aqui na Vila Encantada temos opções desde a locação do espaço até pacotes completos, e posso te ajudar a encontrar uma opção que combine com o que vocês estão planejando. ✨

Quer que eu te envie as opções atualizadas?`;

export const DEFAULT_PERDIDO_REATIVACAO_FOP3 = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

O aniversário do(a) {{nome_aniversariante}} está se aproximando, e como faltam cerca de 3 meses, passei para saber se vocês já decidiram como será a comemoração deste ano. 🎉

Nossa agenda para {{mes_festa}} já está começando a preencher, e ainda temos algumas possibilidades de datas e horários disponíveis.

Na Vila Encantada, temos opções desde a locação do espaço até pacotes completos, para deixar a organização mais prática e tranquila para você. ✨

Quer que eu verifique as datas disponíveis e te envie as opções atualizadas?`;

const defaultTemplateByKey: Record<string, string> = {
  [PERDIDO_REATIVACAO_FOP1_TEMPLATE]: DEFAULT_PERDIDO_REATIVACAO_FOP1,
  [PERDIDO_REATIVACAO_FOP2_TEMPLATE]: DEFAULT_PERDIDO_REATIVACAO_FOP2,
  [PERDIDO_REATIVACAO_FOP3_TEMPLATE]: DEFAULT_PERDIDO_REATIVACAO_FOP3,
};

const resolveAniversarianteLabel = (nome: string | null): string => nome?.trim() || "seu filho(a)";

export interface BuildPerdidoReativacaoMessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  step: PerdidoReativacaoFopStep;
  targetPartyDate: string;
  templateBody?: string | null;
}

export const resolvePerdidoReativacaoTemplateBody = (
  step: PerdidoReativacaoFopStep,
  templateBody?: string | null,
): string => {
  const trimmed = templateBody?.trim();
  if (trimmed) return trimmed;

  const key = perdidoReativacaoFopStepToTemplateKey(step);
  return defaultTemplateByKey[key] ?? DEFAULT_PERDIDO_REATIVACAO_FOP1;
};

export const buildPerdidoReativacaoMessage = (
  input: BuildPerdidoReativacaoMessageInput,
): string => {
  const template = resolvePerdidoReativacaoTemplateBody(input.step, input.templateBody);
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

export const buildPerdidoReativacaoNota = (input: {
  enviadoEm: string;
  step: PerdidoReativacaoFopStep;
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

  return `[Automação] Follow-up de reativação FOP${input.step} enviado — ${enviadoBR}\nFesta alvo: ${input.targetPartyDate} (${mesFesta})`;
};
