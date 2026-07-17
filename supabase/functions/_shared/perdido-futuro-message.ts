import { extractFirstName, formatCompanyDisplayName } from "./company-display-name.ts";
import {
  PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL,
  PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE,
  type PerdidoFuturoFup1Variante,
  perdidoFuturoFup1VarianteToTemplateKey,
} from "./perdido-futuro-constants.ts";

export const DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Lembrei da festa do(a) {{nome_aniversariante}}, prevista para {{data_festa}}, e passei para saber se vocês já decidiram onde será a comemoração. 🎉

Consultei nossa agenda e tenho uma boa notícia: essa data ainda está disponível para vocês. ✨

Como faltam cerca de 60 dias, este é um ótimo momento para organizar tudo com calma, definir os detalhes e garantir a data antes que ela seja reservada.

Vamos preparar uma festa linda e inesquecível para o(a) {{nome_aniversariante}} aqui na {{nome_empresa}}? 💛`;

export const DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL = `Oi, {{primeiro_nome}}! Tudo bem? 🥰

Lembrei da festa do(a) {{nome_aniversariante}}, prevista para {{data_festa}}, e passei para saber se vocês já decidiram onde será a comemoração. 🎉

Consultei nossa agenda e essa data já foi reservada, mas ainda temos outras opções próximas disponíveis. ✨

Como faltam cerca de 60 dias, ainda dá tempo de organizar uma festa linda, com tranquilidade e todo o carinho que esse momento merece.

Queremos muito receber vocês aqui na {{nome_empresa}} para comemorar esse dia especial! 💛

Vamos verificar uma nova data?`;

const defaultTemplateByKey: Record<string, string> = {
  [PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_LIVRE]: DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE,
  [PERDIDO_FUTURO_FUP1_TEMPLATE_DATA_INDISPONIVEL]: DEFAULT_PERDIDO_FUTURO_FUP1_DATA_INDISPONIVEL,
};

const resolveAniversarianteLabel = (nome: string | null): string => nome?.trim() || "seu filho(a)";

export const formatPerdidoFuturoDateBR = (dateIso: string): string => {
  const [year, month, day] = dateIso.split("-");
  if (!year || !month || !day) return dateIso;
  return `${day}/${month}/${year}`;
};

export interface BuildPerdidoFuturoFup1MessageInput {
  aniversarianteNome: string | null;
  clienteNome: string | null;
  companyLegalName: string;
  dataEvento: string;
  templateBody?: string | null;
  variante: PerdidoFuturoFup1Variante;
}

export const resolvePerdidoFuturoFup1TemplateBody = (
  variante: PerdidoFuturoFup1Variante,
  templateBody?: string | null,
): string => {
  const trimmed = templateBody?.trim();
  if (trimmed) return trimmed;

  const key = perdidoFuturoFup1VarianteToTemplateKey(variante);
  return defaultTemplateByKey[key] ?? DEFAULT_PERDIDO_FUTURO_FUP1_DATA_LIVRE;
};

export const buildPerdidoFuturoFup1Message = (input: BuildPerdidoFuturoFup1MessageInput): string => {
  const template = resolvePerdidoFuturoFup1TemplateBody(input.variante, input.templateBody);
  const primeiroNome = extractFirstName(input.clienteNome);
  const nomeAniversariante = resolveAniversarianteLabel(input.aniversarianteNome);
  const dataFesta = formatPerdidoFuturoDateBR(input.dataEvento);
  const nomeEmpresa = formatCompanyDisplayName(input.companyLegalName);

  return template
    .replaceAll("{{primeiro_nome}}", primeiroNome)
    .replaceAll("{{nome_aniversariante}}", nomeAniversariante)
    .replaceAll("{{data_festa}}", dataFesta)
    .replaceAll("{{nome_empresa}}", nomeEmpresa);
};

export const buildPerdidoFuturoFup1Nota = (input: {
  dataEvento: string;
  enviadoEm: string;
  variante: PerdidoFuturoFup1Variante;
}): string => {
  const dataBR = formatPerdidoFuturoDateBR(input.dataEvento);
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

  return `[Automação] Follow-up FUP1 enviado — ${enviadoBR}\nVariante: ${varianteLabel}\nData verificada: ${dataBR}`;
};
