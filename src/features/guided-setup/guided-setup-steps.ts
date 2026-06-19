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
    key: "contrato",
    order: 6,
    title: "Contrato",
    description: "Escolha os modelos de contrato e aceite os termos do módulo",
  },
  {
    key: "checklist",
    order: 7,
    title: "Checklist",
    description: "Revise o checklist padrão gerado para seus pacotes",
  },
  {
    key: "whatsapp",
    order: 8,
    title: "Conectar o WhatsApp",
    description: "Vincule um número WhatsApp para disparos automáticos",
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
  "contrato",
  "checklist",
  "whatsapp",
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
