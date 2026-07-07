export interface SettingsPageMeta {
  breadcrumb: string;
  title: string;
  description: string;
}

export const SETTINGS_PAGE_META = {
  pacotes: {
    breadcrumb: "Pacotes",
    title: "Pacotes comerciais",
    description:
      "Monte os pacotes que serão vendidos pela casa: valores, dias da semana, buffet, equipe e faixas por número de convidados.",
  },
  adicionais: {
    breadcrumb: "Adicionais",
    title: "Adicionais opcionais",
    description:
      "Cadastre itens extras que o cliente pode contratar junto com o pacote: valores, pacotes elegíveis e disponibilidade.",
  },
  estrutura: {
    breadcrumb: "Estrutura",
    title: "Estrutura padrão",
    description:
      "Defina brinquedos, espaço e decoração aplicados automaticamente a todos os pacotes ativos.",
  },
  checklist: {
    breadcrumb: "Checklist",
    title: "Checklist por pacote",
    description:
      "Monte categorias e itens de preparação para cada pacote — replique entre pacotes quando fizer sentido.",
  },
  contrato: {
    breadcrumb: "Contrato",
    title: "Modelos e parâmetros do contrato",
    description:
      "Revise os modelos, parâmetros do espaço e termos do módulo. Alterações passam a valer para novos contratos gerados.",
  },
  "formulario-contratacao": {
    breadcrumb: "Formulário de Contratação",
    title: "Formulário de contratação",
    description:
      "Configure campos, pacotes, adicionais, pagamento e aceites que o cliente preenche ao contratar a festa.",
  },
  financeiro: {
    breadcrumb: "Financeiro",
    title: "Regras financeiras",
    description:
      "Configure entrada, formas de pagamento do restante e limites de parcelamento padrão da casa.",
  },
  "followup-proposta": {
    breadcrumb: "Follow-ups de Proposta",
    title: "Follow-ups de proposta",
    description:
      "Configure as mensagens automáticas enviadas após a proposta — regras de disparo, validação de data e textos personalizáveis.",
  },
  "pesquisa-avaliacao": {
    breadcrumb: "Pesquisa de Avaliação",
    title: "Pesquisa de satisfação",
    description:
      "Configure as perguntas enviadas após a festa para medir NPS, experiência e coletar depoimentos das famílias.",
  },
  "integracoes/whatsapp": {
    breadcrumb: "WhatsApp",
    title: "Conexões WhatsApp",
    description:
      "Conecte números da casa para disparos automáticos e comunicação com clientes.",
  },
  automacoes: {
    breadcrumb: "Automações",
    title: "Automações WhatsApp",
    description:
      "Vincule cada template de automação ao número WhatsApp que envia ou recebe as mensagens da sua casa.",
  },
  "configuracao-inicial": {
    breadcrumb: "Configuração inicial",
    title: "Configuração guiada",
    description:
      "Configure empresa, pacotes, financeiro, contrato, formulário, follow-ups, pesquisa de avaliação e integrações em etapas sequenciais.",
  },
} as const satisfies Record<string, SettingsPageMeta>;

export type SettingsPageKey = keyof typeof SETTINGS_PAGE_META;

export const getSettingsPageMeta = (relativePath: string): SettingsPageMeta | undefined =>
  SETTINGS_PAGE_META[relativePath as SettingsPageKey] ??
  SETTINGS_PAGE_META[relativePath.split("/")[0] as SettingsPageKey];
