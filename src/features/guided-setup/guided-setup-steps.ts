export const GUIDED_SETUP_STEPS = [
  {
    key: "company_profile",
    order: 1,
    title: "Dados da empresa",
    description: "Informações da empresa, endereço e representante legal",
  },
  {
    key: "packages",
    order: 2,
    title: "Pacotes",
    description: "Configure seu primeiro pacote de festa com buffet, preços e equipe",
  },
  {
    key: "adicionais",
    order: 3,
    title: "Adicionais",
    description: "Cadastre itens extras opcionais para incluir nas propostas",
  },
  {
    key: "estrutura",
    order: 4,
    title: "Estrutura",
    description: "Monte a lista padrão de brinquedos aplicada aos pacotes",
  },
  {
    key: "financeiro",
    order: 5,
    title: "Financeiro",
    description: "Defina entrada, parcelas e regras de pagamento padrão",
  },
  {
    key: "checklist",
    order: 6,
    title: "Checklist",
    description:
      "Tarefas para organizar cada festa — revise o checklist padrão gerado para seus pacotes",
  },
  {
    key: "contrato",
    order: 7,
    title: "Contrato",
    description: "Escolha os modelos de contrato e aceite os termos do módulo",
  },
  {
    key: "formulario",
    order: 8,
    title: "Formulário de contratação",
    description:
      "Configure o formulário que o cliente preenche com os dados da festa para organização e contrato",
  },
  {
    key: "followup_proposta",
    order: 9,
    title: "Follow-ups de proposta",
    description:
      "Mensagens automáticas de retorno para leads em Proposta Enviada — começando 48h após o envio",
  },
  {
    key: "pesquisa_avaliacao",
    order: 10,
    title: "Pesquisa de avaliação",
    description:
      "Monte a pesquisa de satisfação enviada após a festa — NPS, experiência e depoimentos",
  },
  {
    key: "whatsapp",
    order: 11,
    title: "Conectar o WhatsApp",
    description: "Vincule um número WhatsApp para disparos automáticos",
  },
  {
    key: "automacoes",
    order: 12,
    title: "Automações",
    description: "Vincule cada automação ao número WhatsApp que envia ou recebe as mensagens",
  },
] as const;

export type GuidedSetupStepKey = (typeof GUIDED_SETUP_STEPS)[number]["key"];

export const GUIDED_SETUP_STEP_KEYS = GUIDED_SETUP_STEPS.map((step) => step.key);

export const GUIDED_SETUP_ROUTE = "/configuracao-inicial";

export const GUIDED_SETUP_WIDE_STEPS: GuidedSetupStepKey[] = [
  "packages",
  "adicionais",
  "estrutura",
  "financeiro",
  "checklist",
  "contrato",
  "formulario",
  "followup_proposta",
  "pesquisa_avaliacao",
  "whatsapp",
  "automacoes",
];

export const isGuidedSetupStepKey = (value: string): value is GuidedSetupStepKey =>
  GUIDED_SETUP_STEPS.some((step) => step.key === value);

export const getNextGuidedSetupStep = (completedSteps: GuidedSetupStepKey[]): GuidedSetupStepKey | null => {
  const pending = GUIDED_SETUP_STEPS.find((step) => !completedSteps.includes(step.key));
  return pending?.key ?? null;
};

export const getActiveGuidedSetupStep = (
  completedSteps: GuidedSetupStepKey[] | undefined,
): GuidedSetupStepKey | null => getNextGuidedSetupStep(completedSteps ?? []);

export const isGuidedSetupComplete = (completedSteps: GuidedSetupStepKey[]) =>
  GUIDED_SETUP_STEPS.every((step) => completedSteps.includes(step.key));
