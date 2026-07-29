export const FINANCEIRO_CATEGORIAS_ENTRADA = {
  adicional_contratado: "Adicional contratado",
  entrada_contrato: "Entrada Contrato",
  outras_receitas: "Outras receitas",
  pagamento_contrato: "Pagamento Contrato",
  retencao_sinal_multa: "Retenção de sinal / multa de cancelamento",
  desconto: "Desconto",
} as const;

export const FINANCEIRO_CATEGORIAS_SAIDA = {
  buffet_salgados: "Buffet - Salgados",
  buffet_doces: "Buffet - Doces",
  buffet_bebidas: "Buffet - Bebidas",
  decoracao: "Decoração",
  devolucao_cliente: "Devolução de cliente",
  equipe: "Equipe",
  estorno: "Estorno",
  infraestrutura_investimentos: "Infraestrutura - Investimentos",
  marketing: "Marketing",
  gastos_fixos: "Gastos Fixos",
  impostos: "Impostos",
  prolabore: "Pro-labore",
  outros: "Outros",
} as const;

/** Rótulos legados para lançamentos já gravados com categorias antigas. */
const FINANCEIRO_CATEGORIAS_LEGADAS: Record<string, string> = {
  aluguel: "Gastos Fixos",
  assinaturas: "Gastos Fixos",
  buffet: "Buffet - Salgados",
  contrato: "Entrada Contrato",
  manutencao: "Infraestrutura - Investimentos",
  marketing: "Marketing",
  outros: "Outros",
  pagamento: "Pagamento Contrato",
  produtos: "Buffet - Salgados",
  salarios: "Gastos Fixos",
  terceiros: "Equipe",
  upsell: "Pagamento Contrato",
  utilidades: "Gastos Fixos",
};

export type FinanceiroCategoriaEntrada = keyof typeof FINANCEIRO_CATEGORIAS_ENTRADA;
export type FinanceiroCategoriaSaida = keyof typeof FINANCEIRO_CATEGORIAS_SAIDA;

export const getFinanceiroCategoriaLabel = (categoria: string) =>
  FINANCEIRO_CATEGORIAS_ENTRADA[categoria as FinanceiroCategoriaEntrada] ??
  FINANCEIRO_CATEGORIAS_SAIDA[categoria as FinanceiroCategoriaSaida] ??
  FINANCEIRO_CATEGORIAS_LEGADAS[categoria] ??
  categoria;

export const getFinanceiroCategoriaOptions = (tipo: "entrada" | "saida") =>
  tipo === "entrada" ? FINANCEIRO_CATEGORIAS_ENTRADA : FINANCEIRO_CATEGORIAS_SAIDA;

export const isFinanceiroCategoriaEntrada = (categoria: string): categoria is FinanceiroCategoriaEntrada =>
  categoria in FINANCEIRO_CATEGORIAS_ENTRADA;

export const isFinanceiroCategoriaDesconto = (categoria: string): categoria is "desconto" =>
  categoria === "desconto";

/** Converte valor informado em lancamento: desconto sempre negativo. */
export const resolveFinanceiroLancamentoValor = (categoria: string, valor: number) => {
  if (!Number.isFinite(valor) || valor === 0) {
    return null;
  }

  if (isFinanceiroCategoriaDesconto(categoria)) {
    return -Math.abs(valor);
  }

  return Math.abs(valor);
};
