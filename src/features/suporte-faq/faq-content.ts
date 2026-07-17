export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  /** Caminho no menu, ex.: "Gestão → Configurações → Pacotes" */
  howToAccess?: string;
  /** Rota interna para abrir direto */
  href?: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    items: [
      {
        id: "o-que-e-festaai",
        question: "O que é o FestaAI e por onde começo?",
        answer:
          "O FestaAI é o sistema da sua casa de festas: CRM de eventos, agenda, contratos, formulários, financeiro, WhatsApp e automações. Se ainda não concluiu o setup, use a configuração guiada — ela leva você pelas etapas essenciais (empresa, pacotes, financeiro, contrato, formulário e integrações).",
        howToAccess: "Configurações → Configuração inicial (ou o banner de configuração guiada)",
        href: "/configuracao-inicial",
      },
      {
        id: "onde-esta-suporte",
        question: "Onde peço ajuda ou abro um chamado?",
        answer:
          "No menu Sistema → Suporte. Lá você encontra dúvidas frequentes (esta página), pedidos de ajuste do agente WhatsApp, reporte de erros e solicitação de atendimento.",
        howToAccess: "Sistema → Suporte",
        href: "/suporte",
      },
      {
        id: "usuarios-acesso",
        question: "Como convido alguém da equipe para usar o sistema?",
        answer:
          "Administradores do tenant podem gerenciar usuários da casa: convidar, definir perfil e acompanhar quem tem acesso. Usuários comuns não veem a área de Suporte nem o Financeiro completo.",
        howToAccess: "Sistema → Usuários",
        href: "/usuarios",
      },
    ],
  },
  {
    id: "vendas",
    title: "Vendas: CRM e Agenda",
    items: [
      {
        id: "crm-o-que-faz",
        question: "Para que serve o CRM?",
        answer:
          "O CRM concentra os eventos/oportunidades da casa: leads, status comercial, dados da festa e o que falta para fechar. A partir de um evento você acessa detalhes, tarefas, financeiro do evento e ações do funil.",
        howToAccess: "Vendas → CRM",
        href: "/crm",
      },
      {
        id: "abrir-evento",
        question: "Como abro ou edito um evento?",
        answer:
          "Em CRM, clique no evento desejado. A tela de detalhe reúne informações da festa, status e atalhos para o que precisa fazer a seguir (contrato, formulário, follow-ups etc.).",
        howToAccess: "Vendas → CRM → clique no evento",
        href: "/crm",
      },
      {
        id: "agenda",
        question: "Como vejo a agenda de festas?",
        answer:
          "A Agenda mostra a visão calendário dos eventos da casa, para planejar datas e evitar conflitos. Use em conjunto com o CRM quando precisar do detalhe comercial de uma festa.",
        howToAccess: "Vendas → Agenda",
        href: "/agenda",
      },
    ],
  },
  {
    id: "gestao",
    title: "Gestão do dia a dia",
    items: [
      {
        id: "tarefas",
        question: "Onde vejo e organizo as tarefas?",
        answer:
          "Em Tarefas você acompanha o que precisa ser feito nos eventos (preparação, follow-ups, pendências). Também dá para trabalhar tarefas no contexto de um evento pelo CRM.",
        howToAccess: "Gestão → Tarefas",
        href: "/tarefas",
      },
      {
        id: "relatorios",
        question: "Onde estão os relatórios?",
        answer:
          "Em Relatórios você consulta indicadores e visões consolidadas da operação. Use para acompanhar desempenho comercial e operacional da casa.",
        howToAccess: "Gestão → Relatórios",
        href: "/relatorios",
      },
      {
        id: "formularios",
        question: "Como funcionam os formulários de contratação?",
        answer:
          "Os formulários são o link que a família preenche para contratar. Em Formulários você gerencia os envios/respostas; a montagem dos campos, pacotes e aceites fica em Configurações → Formulário de Contratação.",
        howToAccess: "Gestão → Formulários (envios) · Configurações → Formulário de Contratação (montagem)",
        href: "/formularios",
      },
      {
        id: "contratos",
        question: "Onde gero e acompanho contratos?",
        answer:
          "Em Contratos você acompanha os contratos gerados. Os modelos, parâmetros do espaço e termos padrão ficam em Configurações → Contrato. Alterações de modelo passam a valer para novos contratos.",
        howToAccess: "Gestão → Contratos · Configurações → Contrato",
        href: "/contratos",
      },
      {
        id: "pesquisa",
        question: "Como funciona a pesquisa de avaliação pós-festa?",
        answer:
          "A pesquisa de satisfação é enviada após a festa (via automação WhatsApp, quando configurada). Em Pesquisa de avaliação você acompanha; as perguntas e a prévia do envio ficam em Configurações → Pesquisa de Avaliação.",
        howToAccess: "Gestão → Pesquisa de avaliação · Configurações → Pesquisa de Avaliação",
        href: "/pesquisa-avaliacao",
      },
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações da casa",
    items: [
      {
        id: "pacotes",
        question: "Como cadastro pacotes e preços?",
        answer:
          "Em Pacotes você monta o que a casa vende: valores, dias da semana, buffet, equipe e faixas por número de convidados. Esses pacotes alimentam proposta, formulário e contrato.",
        howToAccess: "Gestão → Configurações → Pacotes",
        href: "/configuracoes/pacotes",
      },
      {
        id: "adicionais",
        question: "Como cadastro adicionais (extras)?",
        answer:
          "Em Adicionais você cadastra itens opcionais (valores, pacotes elegíveis e disponibilidade). Eles aparecem no formulário e na comercialização junto com o pacote.",
        howToAccess: "Gestão → Configurações → Adicionais",
        href: "/configuracoes/adicionais",
      },
      {
        id: "estrutura-checklist",
        question: "O que são Estrutura e Checklist?",
        answer:
          "Estrutura define brinquedos, espaço e decoração padrão aplicados aos pacotes ativos. Checklist monta categorias e itens de preparação por pacote — útil para a equipe no dia a dia.",
        howToAccess: "Gestão → Configurações → Estrutura / Checklist",
        href: "/configuracoes/estrutura",
      },
      {
        id: "financeiro-regras",
        question: "Onde configuro entrada, parcelamento e formas de pagamento?",
        answer:
          "Em Configurações → Financeiro você define regras padrão da casa: entrada, formas de pagamento do restante e limites de parcelamento. O módulo Financeiro (menu lateral) é para acompanhar valores e movimentos.",
        howToAccess: "Gestão → Configurações → Financeiro · Financeiro (menu)",
        href: "/configuracoes/financeiro",
      },
      {
        id: "followups",
        question: "Como funcionam os follow-ups automáticos?",
        answer:
          "Follow-ups são mensagens e regras de disparo por etapa: comercial (proposta/assinatura), oportunidade, execução da festa e pós-festa. Configure textos e regras em Configurações → Follow-ups, e vincule o WhatsApp em Automações.",
        howToAccess: "Gestão → Configurações → Follow-ups",
        href: "/configuracoes/followups",
      },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp e automações",
    items: [
      {
        id: "conectar-whatsapp",
        question: "Como conecto o WhatsApp da casa?",
        answer:
          "Em Integrações WhatsApp você conecta os números usados para disparos e comunicação com clientes. Sem conexão ativa, as automações não conseguem enviar mensagens.",
        howToAccess: "Gestão → Configurações → WhatsApp (integrações)",
        href: "/configuracoes/integracoes/whatsapp",
      },
      {
        id: "automacoes",
        question: "O que são as Automações?",
        answer:
          "Automações vinculam cada template (follow-ups, pesquisa etc.) ao número WhatsApp que envia ou recebe. Depois de conectar o WhatsApp, revise Automações para garantir que cada fluxo está no número certo.",
        howToAccess: "Gestão → Configurações → Automações",
        href: "/configuracoes/automacoes",
      },
      {
        id: "agente-whatsapp",
        question: "Como peço ajuste no agente do WhatsApp (tom, respostas, regras)?",
        answer:
          "Use Suporte → Agente. Lá você solicita melhorias no agente FestaAI do WhatsApp e acompanha status dos pedidos. Não use essa área para dúvidas gerais de uso — para isso, use esta FAQ ou Solicitar Atendimento.",
        howToAccess: "Sistema → Suporte → Agente",
        href: "/suporte/agente",
      },
    ],
  },
  {
    id: "financeiro-assinatura",
    title: "Financeiro e assinatura",
    items: [
      {
        id: "financeiro-menu",
        question: "O que tem no menu Financeiro?",
        answer:
          "O menu Financeiro (visível para administradores) concentra o acompanhamento financeiro da operação. As regras padrão (entrada, parcelas) ficam em Configurações → Financeiro; o detalhe por festa também aparece no contexto do evento no CRM.",
        howToAccess: "Financeiro (menu lateral)",
        href: "/financeiro",
      },
      {
        id: "assinatura",
        question: "Onde vejo meu plano e cobrança do FestaAI?",
        answer:
          "Em Assinatura você consulta o plano contratado, status e informações da sua assinatura com a FestaAI.",
        howToAccess: "Sistema → Assinatura",
        href: "/minha-assinatura",
      },
    ],
  },
  {
    id: "suporte-ajuda",
    title: "Quando abrir um chamado",
    items: [
      {
        id: "quando-faq",
        question: "Quando uso a FAQ e quando abro atendimento?",
        answer:
          "Use a FAQ para dúvidas de “onde fica” e “como fazer” no dia a dia. Se algo não funcionar como esperado, reporte em Erros. Se precisar de ajuda da equipe FestaAI em um caso específico, use Solicitar Atendimento. Ajustes do agente WhatsApp vão em Agente.",
        howToAccess: "Sistema → Suporte",
        href: "/suporte",
      },
      {
        id: "reportar-erro",
        question: "Como reporto um erro ou falha no sistema?",
        answer:
          "Em Suporte → Erros, descreva o que aconteceu (com título claro) e anexe prints se possível. Isso ajuda a equipe a reproduzir e corrigir mais rápido.",
        howToAccess: "Sistema → Suporte → Erros",
        href: "/suporte/erros",
      },
      {
        id: "solicitar-atendimento",
        question: "Como abro uma solicitação de atendimento?",
        answer:
          "Em Suporte → Solicitar Atendimento você abre um pedido para a equipe FestaAI. Prefira ser específico: o que tentou, o que esperava e o que ocorreu.",
        howToAccess: "Sistema → Suporte → Solicitar Atendimento",
        href: "/suporte/novo",
      },
    ],
  },
];
