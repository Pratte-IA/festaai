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
  followups: {
    breadcrumb: "Follow-ups",
    title: "Follow-ups automáticos",
    description:
      "Escolha a área para configurar mensagens e regras de disparo — comercial, oportunidade, execução da festa ou pós-festa.",
  },
  "followups/comercial": {
    breadcrumb: "Follow-ups · Comercial",
    title: "Follow-ups comerciais",
    description:
      "Proposta (FU0–FU4), assinatura de contrato — regras de disparo, textos e prévia das mensagens.",
  },
  "followups/oportunidade": {
    breadcrumb: "Follow-ups · Oportunidade",
    title: "Follow-ups de oportunidade",
    description:
      "Reativação de leads perdidos — FUP1 (festa futura, 60 dias antes) e FOP1/FOP2/FOP3 (festa já realizada).",
  },
  "followups/execucao": {
    breadcrumb: "Follow-ups · Execução",
    title: "Execução de festa",
    description:
      "Boas Vindas após assinatura do contrato e lembrete 7 dias antes da festa — regras e vínculo WhatsApp.",
  },
  "followups/pos-festa": {
    breadcrumb: "Follow-ups · Pós Festa",
    title: "Pós festa",
    description:
      "Envio da pesquisa de satisfação e lembrete automático quando a família não responde.",
  },
  "pesquisa-avaliacao": {
    breadcrumb: "Pesquisa de Avaliação",
    title: "Pesquisa de satisfação",
    description:
      "Monte as perguntas da pesquisa pós-festa e revise a prévia do envio inicial no WhatsApp.",
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

const FOLLOWUPS_SUBPAGE_LABELS: Record<string, string> = {
  comercial: "Comercial",
  oportunidade: "Oportunidade",
  execucao: "Execução de Festa",
  "pos-festa": "Pós Festa",
};

export const getSettingsPageMeta = (relativePath: string): SettingsPageMeta | undefined => {
  const direct = SETTINGS_PAGE_META[relativePath as SettingsPageKey];
  if (direct) return direct;

  const followupsMatch = relativePath.match(/^followups\/([^/]+)$/);
  if (followupsMatch) {
    const subKey = `followups/${followupsMatch[1]}` as SettingsPageKey;
    return SETTINGS_PAGE_META[subKey];
  }

  return SETTINGS_PAGE_META[relativePath.split("/")[0] as SettingsPageKey];
};

export const getFollowupsSubpageLabel = (segment: string): string | undefined =>
  FOLLOWUPS_SUBPAGE_LABELS[segment];
