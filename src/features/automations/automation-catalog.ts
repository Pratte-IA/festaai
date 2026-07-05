import type { AutomationTemplateDefinition, AutomationTemplateKey } from "./types";

export const AUTOMATION_TEMPLATE_CATALOG: AutomationTemplateDefinition[] = [
  {
    bindingMode: "whatsapp_connection",
    key: "atendimento",
    title: "Atendimento",
    description:
      "Responde mensagens de clientes interessados e conduz o atendimento comercial pelo WhatsApp.",
    direction: "inbound",
  },
  {
    bindingMode: "whatsapp_connection",
    key: "boas-vindas",
    title: "Boas Vindas",
    description: "Envia mensagem de boas-vindas após o fechamento da festa.",
    direction: "outbound",
  },
  {
    bindingMode: "whatsapp_connection",
    key: "follow-up-proposta",
    title: "Follow-up de Proposta",
    description:
      "Envia follow-ups automáticos de proposta (FU1 após 48h) para leads em Proposta Enviada sem retorno.",
    direction: "outbound",
  },
  {
    bindingMode: "whatsapp_connection",
    key: "sete-dias-antes",
    title: "7 dias Antes da Festa",
    description:
      "Dispara lembretes e orientações uma semana antes da data da festa para o cliente.",
    direction: "outbound",
  },
  {
    bindingMode: "whatsapp_connection",
    key: "pesquisa-satisfacao",
    title: "Pesquisa de Satisfação",
    description:
      "Número que envia o link da pesquisa pós-festa pelo WhatsApp, no dia seguinte à festa, quando o lead entra em Aguardando Feedback.",
    direction: "outbound",
  },
  {
    bindingMode: "phone_number",
    key: "passar-para-vendedor",
    title: "Passar para o Vendedor",
    description:
      "Informe o celular particular do vendedor para onde a conversa será encaminhada quando o cliente precisar falar com alguém da equipe.",
    direction: "outbound",
  },
];

export const isAutomationTemplateKey = (value: string): value is AutomationTemplateKey =>
  AUTOMATION_TEMPLATE_CATALOG.some((template) => template.key === value);

export const getAutomationTemplate = (key: AutomationTemplateKey) =>
  AUTOMATION_TEMPLATE_CATALOG.find((template) => template.key === key);
