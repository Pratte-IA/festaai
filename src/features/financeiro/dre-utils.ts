import { getFinanceiroCategoriaLabel } from "./constants";
import { FinanceiroLancamento } from "./types";

export interface DreCategoriaTotal {
  categoria: string;
  label: string;
  total: number;
}

export const groupLancamentosByCategoria = (
  lancamentos: Pick<FinanceiroLancamento, "categoria" | "tipo" | "valor">[],
  tipo: FinanceiroLancamento["tipo"],
): DreCategoriaTotal[] => {
  const totals = new Map<string, number>();

  for (const item of lancamentos) {
    if (item.tipo !== tipo) {
      continue;
    }

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
