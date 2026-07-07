import {
  FINANCEIRO_CATEGORIAS_ENTRADA,
  FINANCEIRO_CATEGORIAS_SAIDA,
  getFinanceiroCategoriaLabel,
} from "./constants";
import { FinanceiroDisplayItem } from "./display-types";

export interface DreCategoriaTotal {
  categoria: string;
  label: string;
  total: number;
}

export interface DashboardDescricaoRow {
  label: string;
  total: number;
}

/** Agrupa pelo rótulo unificado da descricao para consolidar categorias legadas. */
export const groupDisplayItemsByCategoria = (
  items: Pick<FinanceiroDisplayItem, "categoria" | "valor">[],
): DreCategoriaTotal[] => {
  const totals = new Map<string, { categoria: string; total: number }>();

  for (const item of items) {
    const label = getFinanceiroCategoriaLabel(item.categoria);
    const current = totals.get(label);

    if (current) {
      current.total += item.valor;
      continue;
    }

    totals.set(label, { categoria: item.categoria, total: item.valor });
  }

  return [...totals.entries()]
    .map(([label, { categoria, total }]) => ({
      categoria,
      label,
      total,
    }))
    .sort((a, b) => b.total - a.total);
};

export const buildDashboardDescricaoRows = (
  items: Pick<FinanceiroDisplayItem, "categoria" | "valor">[],
  catalog: Record<string, string>,
): DashboardDescricaoRow[] => {
  const totalsByLabel = new Map(
    groupDisplayItemsByCategoria(items).map((row) => [row.label, row.total]),
  );

  const catalogLabels = Object.values(catalog);
  const rows = catalogLabels.map((label) => ({
    label,
    total: totalsByLabel.get(label) ?? 0,
  }));

  for (const [label, total] of totalsByLabel) {
    if (!catalogLabels.includes(label)) {
      rows.push({ label, total });
    }
  }

  return rows;
};

export const buildDashboardEntradaRows = (
  items: Pick<FinanceiroDisplayItem, "categoria" | "valor">[],
) => buildDashboardDescricaoRows(items, FINANCEIRO_CATEGORIAS_ENTRADA);

export const buildDashboardSaidaRows = (
  items: Pick<FinanceiroDisplayItem, "categoria" | "valor">[],
) => buildDashboardDescricaoRows(items, FINANCEIRO_CATEGORIAS_SAIDA);

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
