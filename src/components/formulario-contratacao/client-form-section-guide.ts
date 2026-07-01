import type { ClosingFormSection } from "@/features/configuracoes/closing-form-types";

interface ClientFormSectionGuide {
  description: string;
  title: string;
}

export const clientFormSectionGuide: Record<
  Extract<
    ClosingFormSection,
    "cliente" | "aniversariante" | "festa" | "pacote" | "adicionais" | "pagamento" | "aceites"
  >,
  ClientFormSectionGuide
> = {
  aceites: {
    description:
      "📋 Leia com atenção e confirme os termos necessários para seguir com a contratação.",
    title: "Aceites e regras",
  },
  adicionais: {
    description:
      "➕ Quer incluir algo a mais? Marque os itens opcionais que deseja contratar junto com o pacote.",
    title: "Itens adicionais",
  },
  aniversariante: {
    description:
      "🎂 Informe quem está comemorando. Esses dados ajudam a personalizar a festa e constam no contrato.",
    title: "Dados do aniversariante",
  },
  cliente: {
    description:
      "💡 Preencha com os dados de quem será responsável pela contratação e pelo pagamento da festa. Essa pessoa deve ser maior de 18 anos e estar legalmente apta a assinar o contrato.",
    title: "Dados do Responsável pelo Pagamento",
  },
  festa: {
    description:
      "📅 Conte-nos quando e como será a celebração: data, horário e quantidade de convidados.",
    title: "Detalhes da festa",
  },
  pacote: {
    description:
      "✨ Selecione o pacote que melhor combina com o tamanho e o estilo da sua festa.",
    title: "Escolha do pacote",
  },
  pagamento: {
    description:
      "💳 Informe como pretende pagar a entrada e o saldo, conforme as opções disponíveis no espaço.",
    title: "Condições de pagamento",
  },
};

export const getClientFormSectionGuide = (section: ClosingFormSection): ClientFormSectionGuide => {
  if (section in clientFormSectionGuide) {
    return clientFormSectionGuide[section as keyof typeof clientFormSectionGuide];
  }

  return {
    description: "",
    title: section,
  };
};
