import type { AutomationTemplateDefinition, AutomationTemplateKey } from "./types";

export const AUTOMATION_TEMPLATE_CATALOG: AutomationTemplateDefinition[] = [
  {
    key: "atendimento",
    title: "Atendimento",
    description:
      "Responde mensagens de clientes interessados e conduz o atendimento comercial pelo WhatsApp.",
    direction: "inbound",
  },
  {
    key: "boas-vindas",
    title: "Boas Vindas",
    description: "Envia mensagem de boas-vindas após o primeiro contato ou fechamento da festa.",
    direction: "outbound",
  },
  {
    key: "sete-dias-antes",
    title: "7 dias Antes da Festa",
    description:
      "Dispara lembretes e orientações uma semana antes da data da festa para o cliente.",
    direction: "outbound",
  },
  {
    key: "passar-para-vendedor",
    title: "Passar para o Vendedor",
    description:
      "Encaminha a conversa para o número do vendedor quando o cliente precisa falar com alguém da equipe.",
    direction: "outbound",
  },
];

export const isAutomationTemplateKey = (value: string): value is AutomationTemplateKey =>
  AUTOMATION_TEMPLATE_CATALOG.some((template) => template.key === value);

export const getAutomationTemplate = (key: AutomationTemplateKey) =>
  AUTOMATION_TEMPLATE_CATALOG.find((template) => template.key === key);
