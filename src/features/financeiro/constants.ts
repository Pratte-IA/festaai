export const FINANCEIRO_CATEGORIAS_ENTRADA = {
  entrada_contrato: "Entrada Contrato",
  pagamento_contrato: "Pagamento Contrato",
} as const;

export const FINANCEIRO_CATEGORIAS_SAIDA = {
  buffet_salgados: "Buffet - Salgados",
  buffet_doces: "Buffet - Doces",
  buffet_bebidas: "Buffet - Bebidas",
  decoracao: "Decoração",
  equipe: "Equipe",
  infraestrutura_investimentos: "Infraestrutura - Investimentos",
  gastos_fixos: "Gastos Fixos",
} as const;

/** Rótulos legados para lançamentos já gravados com categorias antigas. */
const FINANCEIRO_CATEGORIAS_LEGADAS: Record<string, string> = {
  aluguel: "Gastos Fixos",
  assinaturas: "Gastos Fixos",
  buffet: "Buffet - Salgados",
  contrato: "Entrada Contrato",
  impostos: "Gastos Fixos",
  manutencao: "Infraestrutura - Investimentos",
  marketing: "Gastos Fixos",
  outros: "Gastos Fixos",
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

export const isFinanceiroCategoriaSaida = (categoria: string): categoria is FinanceiroCategoriaSaida =>
  categoria in FINANCEIRO_CATEGORIAS_SAIDA;
