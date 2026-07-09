import { getFinanceiroCategoriaLabel } from "./constants";
import { DreStatement, FinanceiroDisplayItem } from "./display-types";
import { formatFinanceiroMonthLabel } from "./month-range";

export interface FinanceiroExportData {
  dreStatement: DreStatement;
  entradasFestas: FinanceiroDisplayItem[];
  entradasManuais: FinanceiroDisplayItem[];
  from: string;
  month: string;
  saidasFestas: FinanceiroDisplayItem[];
  saidasGerais: FinanceiroDisplayItem[];
  to: string;
}

const escapeCsvCell = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const formatCsvRow = (cells: string[]): string => cells.map(escapeCsvCell).join(",");

const formatMoneyCsv = (value: number): string => value.toFixed(2);

const formatOrigemLabel = (item: FinanceiroDisplayItem): string => {
  if (item.origem === "contrato") {
    return "Contrato";
  }

  if (item.evento_id != null) {
    return `Festa #${item.evento_id}`;
  }

  return "Geral";
};

const mapLancamentoRows = (items: FinanceiroDisplayItem[]): string[][] =>
  items.map((item) => [
    item.data_lancamento,
    getFinanceiroCategoriaLabel(item.categoria),
    item.descricao ?? "",
    formatOrigemLabel(item),
    formatMoneyCsv(item.valor),
  ]);

const appendSection = (
  lines: string[],
  title: string,
  headers: string[],
  rows: string[][],
): void => {
  lines.push(title);
  lines.push(formatCsvRow(headers));

  if (rows.length === 0) {
    lines.push(formatCsvRow(["Nenhum lancamento no periodo"]));
  } else {
    for (const row of rows) {
      lines.push(formatCsvRow(row));
    }
  }

  lines.push("");
};

export const buildFinanceiroReportCsv = ({
  dreStatement,
  entradasFestas,
  entradasManuais,
  from,
  month,
  saidasFestas,
  saidasGerais,
  to,
}: FinanceiroExportData): string => {
  const lines: string[] = [
    `Relatorio Financeiro - ${formatFinanceiroMonthLabel(month)}`,
    `Periodo,${from},${to}`,
    "",
  ];

  appendSection(
    lines,
    "DRE - Demonstrativo do Resultado",
    ["Item", "Valor (R$)"],
    dreStatement.lines
      .filter((line) => line.kind !== "header")
      .map((line) => [
        `${line.level === 1 ? "  " : ""}${line.label}`,
        formatMoneyCsv(line.value),
      ]),
  );

  appendSection(
    lines,
    "Entradas - Festas (automatico)",
    ["Data", "Categoria", "Complemento", "Origem", "Valor (R$)"],
    mapLancamentoRows(entradasFestas),
  );

  appendSection(
    lines,
    "Entradas - Empresa (manual)",
    ["Data", "Categoria", "Complemento", "Origem", "Valor (R$)"],
    mapLancamentoRows(entradasManuais),
  );

  appendSection(
    lines,
    "Saidas - Empresa (manual)",
    ["Data", "Categoria", "Complemento", "Origem", "Valor (R$)"],
    mapLancamentoRows(saidasGerais),
  );

  appendSection(
    lines,
    "Saidas - Festas",
    ["Data", "Categoria", "Complemento", "Origem", "Valor (R$)"],
    mapLancamentoRows(saidasFestas),
  );

  return `${lines.join("\n")}\n`;
};

export const getFinanceiroReportFilename = (month: string): string => `financeiro-${month}.csv`;

export const downloadFinanceiroReport = (data: FinanceiroExportData): void => {
  const content = buildFinanceiroReportCsv(data);
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getFinanceiroReportFilename(data.month);
  anchor.click();
  URL.revokeObjectURL(url);
};
