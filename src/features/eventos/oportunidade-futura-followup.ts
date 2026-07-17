/**
 * FOF = Follow-up Oportunidade Futura
 * Clientes no funil Executadas → etapa Oportunidade Futura (já festejaram conosco).
 * Distinto de FOP (reativação de leads Perdidos no funil Vendas).
 */

export const OPORTUNIDADE_FUTURA_TEMPLATE_KEY = "follow-up-perdido-reativacao";

export const OPORTUNIDADE_FUTURA_FOF1_TEMPLATE = "follow-up-oportunidade-futura-fof1";

export const OPORTUNIDADE_FUTURA_FOF2_TEMPLATE = "follow-up-oportunidade-futura-fof2";

export const OPORTUNIDADE_FUTURA_FOF3_TEMPLATE = "follow-up-oportunidade-futura-fof3";

export const OPORTUNIDADE_FUTURA_FOF1_EVENT = "oportunidade_futura.fof1";

export const OPORTUNIDADE_FUTURA_FOF2_EVENT = "oportunidade_futura.fof2";

export const OPORTUNIDADE_FUTURA_FOF3_EVENT = "oportunidade_futura.fof3";

export type OportunidadeFuturaFofStatus = "ativo" | "pausado_resposta" | "cancelado";

export type OportunidadeFuturaFofStep = 1 | 2 | 3;

export const oportunidadeFuturaFofStatusLabels: Record<OportunidadeFuturaFofStatus, string> = {
  ativo: "FOF ativo",
  cancelado: "FOF encerrado",
  pausado_resposta: "Cliente respondeu",
};

export {
  OPORTUNIDADE_FUTURA_FOF1_MONTHS_BEFORE,
  OPORTUNIDADE_FUTURA_FOF2_DELAY_DAYS,
  OPORTUNIDADE_FUTURA_FOF3_DAYS_BEFORE,
} from "./oportunidade-futura-schedule";

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

export const getOportunidadeFuturaFofKanbanBadge = (evento: {
  etapa: string;
  fof1_enviado_em?: string | null;
  fof2_enviado_em?: string | null;
  fof3_enviado_em?: string | null;
  fof_status?: string | null;
}): { className: string; label: string } | null => {
  if (evento.etapa !== "oportunidade_futura") return null;
  if (evento.fof_status === "cancelado" || evento.fof_status === "pausado_resposta") {
    return null;
  }

  if (evento.fof3_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FOF3 ✓" };
  }

  if (evento.fof2_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FOF2 ✓" };
  }

  if (evento.fof1_enviado_em) {
    return { className: "bg-success/15 text-success", label: "FOF1 ✓" };
  }

  return null;
};

export const getOportunidadeFuturaFofRespondedKanbanBadge = (evento: {
  etapa: string;
  fof_resposta_cliente_em?: string | null;
  fof_status?: string | null;
}): { className: string; label: string } | null => {
  if (evento.etapa !== "oportunidade_futura") return null;
  if (evento.fof_status !== "pausado_resposta") return null;
  if (!evento.fof_resposta_cliente_em) return null;

  return { className: "bg-primary/15 text-primary", label: "Respondeu" };
};
