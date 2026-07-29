import { isFinanceiroCategoriaDesconto } from "./constants";
import { buildDashboardSaidaRows } from "./dre-utils";
import { FinanceiroContratoEntrada, DreStatement, DreStatementLine } from "./display-types";
import { shouldIncludeLedgerEntradaContrato } from "./fluxo-caixa";
import { FinanceiroLancamento } from "./types";

const sumValues = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

const isPagamentoSaldoLancamento = (item: FinanceiroLancamento) =>
  item.tipo === "entrada" && (item.origem === "pagamento" || item.categoria === "pagamento_contrato");

const isEntradaManualGeral = (item: FinanceiroLancamento) =>
  item.tipo === "entrada" && item.origem === "manual" && item.evento_id == null;

const isAdicionalLancamento = (item: FinanceiroLancamento) =>
  item.tipo === "entrada" &&
  item.evento_id != null &&
  !isFinanceiroCategoriaDesconto(item.categoria) &&
  !isPagamentoSaldoLancamento(item) &&
  item.categoria !== "entrada_contrato";

/**
 * DRE do Fluxo de Caixa.
 * Reservas = sinal legado (valor_entrada) + entrada_contrato no ledger só quando o evento não tem valor_entrada.
 * Pagamentos = somente ledger (sync de evento_pagamentos) — nunca soma as duas tabelas.
 */
export const buildDreStatement = (
  contratoEntradas: FinanceiroContratoEntrada[],
  lancamentos: FinanceiroLancamento[],
  valorEntradaByEvento: Map<number, number> = new Map(),
): DreStatement => {
  const entradaLancamentos = lancamentos.filter((item) => item.tipo === "entrada");

  const reservasLegado = sumValues(contratoEntradas.map((item) => item.valorEntrada));
  const reservasManuais = sumValues(
    entradaLancamentos
      .filter((item) => {
        if (item.categoria !== "entrada_contrato") {
          return false;
        }
        if (item.evento_id == null) {
          return true;
        }
        const valorEntrada = valorEntradaByEvento.get(item.evento_id) ?? 0;
        return shouldIncludeLedgerEntradaContrato(valorEntrada);
      })
      .map((item) => item.valor),
  );
  const reservas = reservasLegado + reservasManuais;

  const pagamentosSaldo = sumValues(
    entradaLancamentos.filter(isPagamentoSaldoLancamento).map((item) => item.valor),
  );

  const adicionais = sumValues(
    entradaLancamentos.filter(isAdicionalLancamento).map((item) => item.valor),
  );

  const outrasReceitas = sumValues(
    entradaLancamentos.filter(isEntradaManualGeral).map((item) => item.valor),
  );

  const descontosTotal = sumValues(
    entradaLancamentos.filter((item) => isFinanceiroCategoriaDesconto(item.categoria)).map((item) => item.valor),
  );

  const receitaBruta = reservas + pagamentosSaldo + adicionais + outrasReceitas;
  const receitaLiquida = receitaBruta + descontosTotal;

  const saidaRows = buildDashboardSaidaRows(
    lancamentos
      .filter((item) => item.tipo === "saida")
      .map((item) => ({ categoria: item.categoria, valor: item.valor })),
  );
  const despesasTotal = sumValues(saidaRows.map((row) => row.total));
  const resultadoLiquido = receitaLiquida - despesasTotal;

  const lines: DreStatementLine[] = [
    { id: "header-receita", kind: "header", label: "Receita operacional bruta", level: 0, value: 0 },
  ];

  if (reservas > 0) {
    lines.push({
      id: "receita-reservas",
      kind: "revenue",
      label: "Entradas de reserva (contrato)",
      level: 1,
      value: reservas,
    });
  }

  if (pagamentosSaldo > 0) {
    lines.push({
      id: "receita-pagamentos",
      kind: "revenue",
      label: "Pagamentos de saldo",
      level: 1,
      value: pagamentosSaldo,
    });
  }

  if (adicionais > 0) {
    lines.push({
      id: "receita-adicionais",
      kind: "revenue",
      label: "Adicionais contratados",
      level: 1,
      value: adicionais,
    });
  }

  if (outrasReceitas > 0) {
    lines.push({
      id: "receita-outras",
      kind: "revenue",
      label: "Outras receitas",
      level: 1,
      value: outrasReceitas,
    });
  }

  lines.push({
    id: "subtotal-receita-bruta",
    kind: "subtotal",
    label: "Receita bruta",
    level: 0,
    value: receitaBruta,
  });

  if (descontosTotal < 0) {
    lines.push(
      { id: "header-deducoes", kind: "header", label: "Deducoes", level: 0, value: 0 },
      {
        id: "deducao-descontos",
        kind: "deduction",
        label: "Descontos concedidos",
        level: 1,
        value: descontosTotal,
      },
    );
  }

  lines.push({
    id: "subtotal-receita-liquida",
    kind: "subtotal",
    label: "Receita liquida",
    level: 0,
    value: receitaLiquida,
  });

  lines.push({ id: "header-despesas", kind: "header", label: "Despesas operacionais", level: 0, value: 0 });

  for (const row of saidaRows) {
    lines.push({
      id: `despesa-${row.label}`,
      kind: "expense",
      label: row.label,
      level: 1,
      value: row.total,
    });
  }

  lines.push(
    {
      id: "subtotal-despesas",
      kind: "subtotal",
      label: "Total de despesas",
      level: 0,
      value: despesasTotal,
    },
    {
      id: "total-resultado",
      kind: "total",
      label: "Resultado liquido do periodo",
      level: 0,
      value: resultadoLiquido,
    },
  );

  return {
    adicionaisTotal: adicionais,
    descontosTotal,
    despesasTotal,
    lines,
    outrasReceitasTotal: outrasReceitas,
    pagamentosSaldoTotal: pagamentosSaldo,
    receitaBruta,
    receitaLiquida,
    reservasTotal: reservas,
    resultadoLiquido,
  };
};
