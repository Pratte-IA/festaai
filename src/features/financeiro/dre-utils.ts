import { getFinanceiroCategoriaLabel } from "./constants";
import { FinanceiroDisplayItem } from "./display-types";

export interface DreCategoriaTotal {
  categoria: string;
  label: string;
  total: number;
}

export const groupDisplayItemsByCategoria = (
  items: Pick<FinanceiroDisplayItem, "categoria" | "valor">[],
): DreCategoriaTotal[] => {
  const totals = new Map<string, number>();

  for (const item of items) {
    totals.set(item.categoria, (totals.get(item.categoria) ?? 0) + item.valor);
  }

  return [...totals.entries()]
    .map(([categoria, total]) => ({
      categoria,
      label: getFinanceiroCategoriaLabel(categoria),
      total,
    }))
    .sort((a, b) => b.total - a.total);
};

/** @deprecated Use groupDisplayItemsByCategoria */
export const groupLancamentosByCategoria = (
  lancamentos: { categoria: string; tipo: string; valor: number }[],
  tipo: "entrada" | "saida",
) =>
  groupDisplayItemsByCategoria(
    lancamentos
      .filter((item) => item.tipo === tipo)
      .map((item) => ({ categoria: item.categoria, valor: item.valor })),
  );
