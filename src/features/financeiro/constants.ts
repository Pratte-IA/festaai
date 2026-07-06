export const FINANCEIRO_CATEGORIAS_ENTRADA = {
  contrato: "Entrada do contrato",
  pagamento: "Pagamento recebido",
  upsell: "Venda extra",
  outros: "Outros",
} as const;

export const FINANCEIRO_CATEGORIAS_SAIDA_EVENTO = {
  buffet: "Buffet / alimentação",
  decoracao: "Decoração",
  equipe: "Equipe",
  produtos: "Produtos / insumos",
  terceiros: "Terceiros",
  outros: "Outros",
} as const;

export const FINANCEIRO_CATEGORIAS_SAIDA_GERAL = {
  aluguel: "Aluguel",
  impostos: "Impostos / taxas",
  marketing: "Marketing",
  salarios: "Salários",
  utilidades: "Utilidades",
  manutencao: "Manutenção",
  assinaturas: "Assinaturas",
  outros: "Outros",
} as const;

export type FinanceiroCategoriaEntrada = keyof typeof FINANCEIRO_CATEGORIAS_ENTRADA;
export type FinanceiroCategoriaSaidaEvento = keyof typeof FINANCEIRO_CATEGORIAS_SAIDA_EVENTO;
export type FinanceiroCategoriaSaidaGeral = keyof typeof FINANCEIRO_CATEGORIAS_SAIDA_GERAL;

export const getFinanceiroCategoriaLabel = (categoria: string) =>
  FINANCEIRO_CATEGORIAS_ENTRADA[categoria as FinanceiroCategoriaEntrada] ??
  FINANCEIRO_CATEGORIAS_SAIDA_EVENTO[categoria as FinanceiroCategoriaSaidaEvento] ??
  FINANCEIRO_CATEGORIAS_SAIDA_GERAL[categoria as FinanceiroCategoriaSaidaGeral] ??
  categoria;
