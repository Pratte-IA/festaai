import { getFinanceiroCategoriaLabel } from "./constants";
import { DreStatement, FinanceiroDisplayItem } from "./display-types";
import { formatFinanceiroMonthLabel } from "./month-range";

export type FinanceiroExportFormat = "csv" | "pdf" | "xls";

export interface FinanceiroExportSections {
  dre: boolean;
  entradas: boolean;
  saidas: boolean;
}

export interface FinanceiroExportOptions {
  format: FinanceiroExportFormat;
  sections: FinanceiroExportSections;
}

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

interface ReportTable {
  headers: string[];
  rows: string[][];
  title: string;
  totalLabel?: string;
  totalValue?: number;
}

interface BuiltReport {
  monthLabel: string;
  periodFrom: string;
  periodTo: string;
  tables: ReportTable[];
  title: string;
}

export const DEFAULT_FINANCEIRO_EXPORT_SECTIONS: FinanceiroExportSections = {
  dre: true,
  entradas: true,
  saidas: true,
};

const CSV_SEPARATOR = ";";

const escapeCsvCell = (value: string): string => {
  if (
    value.includes(CSV_SEPARATOR) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const formatCsvRow = (cells: string[]): string => cells.map(escapeCsvCell).join(CSV_SEPARATOR);

const formatMoneyBr = (value: number): string =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateBr = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day}/${month}/${year}`;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatOrigemLabel = (item: FinanceiroDisplayItem): string => {
  if (item.origem === "contrato") {
    return "Contrato";
  }

  if (item.evento_id != null) {
    return `Festa #${item.evento_id}`;
  }

  return "Geral";
};

const sumItems = (items: FinanceiroDisplayItem[]): number =>
  items.reduce((total, item) => total + item.valor, 0);

const mapLancamentoRows = (items: FinanceiroDisplayItem[]): string[][] =>
  items.map((item) => [
    formatDateBr(item.data_lancamento),
    getFinanceiroCategoriaLabel(item.categoria),
    item.descricao ?? "",
    formatOrigemLabel(item),
    formatMoneyBr(item.valor),
  ]);

const LANCAMENTO_HEADERS = ["Data", "Categoria", "Complemento", "Origem", "Valor (R$)"];

const hasSelectedSections = (sections: FinanceiroExportSections): boolean =>
  sections.dre || sections.entradas || sections.saidas;

export const buildFinanceiroReport = (
  data: FinanceiroExportData,
  sections: FinanceiroExportSections = DEFAULT_FINANCEIRO_EXPORT_SECTIONS,
): BuiltReport => {
  const tables: ReportTable[] = [];

  if (sections.dre) {
    tables.push({
      headers: ["Item", "Valor (R$)"],
      rows: data.dreStatement.lines
        .filter((line) => line.kind !== "header")
        .map((line) => [
          `${line.level === 1 ? "  " : ""}${line.label}`,
          formatMoneyBr(line.value),
        ]),
      title: "DRE - Demonstrativo do Resultado",
    });
  }

  if (sections.entradas) {
    const entradasFestasRows = mapLancamentoRows(data.entradasFestas);
    const entradasManuaisRows = mapLancamentoRows(data.entradasManuais);
    const entradasTotal = sumItems(data.entradasFestas) + sumItems(data.entradasManuais);

    tables.push({
      headers: LANCAMENTO_HEADERS,
      rows: entradasFestasRows,
      title: "Entradas - Festas (automático)",
      totalLabel: entradasFestasRows.length > 0 ? "Subtotal festas" : undefined,
      totalValue: entradasFestasRows.length > 0 ? sumItems(data.entradasFestas) : undefined,
    });

    tables.push({
      headers: LANCAMENTO_HEADERS,
      rows: entradasManuaisRows,
      title: "Entradas - Empresa (manual)",
      totalLabel: "Total de entradas",
      totalValue: entradasTotal,
    });
  }

  if (sections.saidas) {
    const saidasGeraisRows = mapLancamentoRows(data.saidasGerais);
    const saidasFestasRows = mapLancamentoRows(data.saidasFestas);
    const saidasTotal = sumItems(data.saidasGerais) + sumItems(data.saidasFestas);

    tables.push({
      headers: LANCAMENTO_HEADERS,
      rows: saidasGeraisRows,
      title: "Saídas - Empresa (manual)",
      totalLabel: saidasGeraisRows.length > 0 ? "Subtotal empresa" : undefined,
      totalValue: saidasGeraisRows.length > 0 ? sumItems(data.saidasGerais) : undefined,
    });

    tables.push({
      headers: LANCAMENTO_HEADERS,
      rows: saidasFestasRows,
      title: "Saídas - Festas",
      totalLabel: "Total de saídas",
      totalValue: saidasTotal,
    });
  }

  return {
    monthLabel: formatFinanceiroMonthLabel(data.month),
    periodFrom: formatDateBr(data.from),
    periodTo: formatDateBr(data.to),
    tables,
    title: `Relatório Financeiro - ${formatFinanceiroMonthLabel(data.month)}`,
  };
};

export const buildFinanceiroReportCsv = (
  data: FinanceiroExportData,
  sections: FinanceiroExportSections = DEFAULT_FINANCEIRO_EXPORT_SECTIONS,
): string => {
  const report = buildFinanceiroReport(data, sections);
  const lines: string[] = [
    report.title,
    `Período${CSV_SEPARATOR}${report.periodFrom}${CSV_SEPARATOR}${report.periodTo}`,
    "",
  ];

  for (const table of report.tables) {
    lines.push(table.title);
    lines.push(formatCsvRow(table.headers));

    if (table.rows.length === 0) {
      lines.push(formatCsvRow(["Nenhum lançamento no período"]));
    } else {
      for (const row of table.rows) {
        lines.push(formatCsvRow(row));
      }
    }

    if (table.totalLabel != null && table.totalValue != null) {
      const totalCells = Array.from({ length: table.headers.length }, (_, index) => {
        if (index === 0) {
          return table.totalLabel ?? "";
        }
        if (index === table.headers.length - 1) {
          return formatMoneyBr(table.totalValue ?? 0);
        }
        return "";
      });
      lines.push(formatCsvRow(totalCells));
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
};

const sheetNameFromTitle = (title: string, index: number): string => {
  const cleaned = title
    .replace(/[\\/*?[\]:]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28);
  return cleaned.length > 0 ? cleaned : `Secao ${index + 1}`;
};

const buildWorksheetXml = (table: ReportTable, index: number): string => {
  const rowsXml: string[] = [];

  rowsXml.push(`<Row><Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(table.title)}</Data></Cell></Row>`);
  rowsXml.push("<Row/>");

  rowsXml.push(
    `<Row>${table.headers
      .map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
      .join("")}</Row>`,
  );

  if (table.rows.length === 0) {
    rowsXml.push(
      `<Row><Cell><Data ss:Type="String">${escapeXml("Nenhum lançamento no período")}</Data></Cell></Row>`,
    );
  } else {
    for (const row of table.rows) {
      rowsXml.push(
        `<Row>${row
          .map((cell, cellIndex) => {
            const isMoney = cellIndex === row.length - 1 && table.headers[cellIndex]?.includes("Valor");
            if (isMoney) {
              const numeric = Number(cell.replace(/\./g, "").replace(",", "."));
              if (Number.isFinite(numeric)) {
                return `<Cell ss:StyleID="Money"><Data ss:Type="Number">${numeric}</Data></Cell>`;
              }
            }
            return `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
          })
          .join("")}</Row>`,
      );
    }
  }

  if (table.totalLabel != null && table.totalValue != null) {
    rowsXml.push("<Row/>");
    rowsXml.push(
      `<Row><Cell ss:StyleID="Total"><Data ss:Type="String">${escapeXml(table.totalLabel)}</Data></Cell>${table.headers
        .slice(1, -1)
        .map(() => "<Cell/>")
        .join("")}<Cell ss:StyleID="MoneyTotal"><Data ss:Type="Number">${table.totalValue}</Data></Cell></Row>`,
    );
  }

  return `
  <Worksheet ss:Name="${escapeXml(sheetNameFromTitle(table.title, index))}">
    <Table>
      <Column ss:AutoFitWidth="1" ss:Width="90"/>
      <Column ss:AutoFitWidth="1" ss:Width="160"/>
      <Column ss:AutoFitWidth="1" ss:Width="180"/>
      <Column ss:AutoFitWidth="1" ss:Width="100"/>
      <Column ss:AutoFitWidth="1" ss:Width="100"/>
      ${rowsXml.join("\n      ")}
    </Table>
  </Worksheet>`;
};

export const buildFinanceiroReportXls = (
  data: FinanceiroExportData,
  sections: FinanceiroExportSections = DEFAULT_FINANCEIRO_EXPORT_SECTIONS,
): string => {
  const report = buildFinanceiroReport(data, sections);
  const coverSheet = `
  <Worksheet ss:Name="Capa">
    <Table>
      <Column ss:AutoFitWidth="1" ss:Width="220"/>
      <Column ss:AutoFitWidth="1" ss:Width="140"/>
      <Row><Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(report.title)}</Data></Cell></Row>
      <Row/>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Período</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(`${report.periodFrom} a ${report.periodTo}`)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Seções</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(report.tables.map((table) => table.title).join(" | "))}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>`;

  const worksheets = report.tables.map((table, index) => buildWorksheetXml(table, index)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#EEEEEE" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Total">
      <Font ss:Bold="1"/>
    </Style>
    <Style ss:ID="Money">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
    <Style ss:ID="MoneyTotal">
      <Font ss:Bold="1"/>
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
  </Styles>
  ${coverSheet}
  ${worksheets}
</Workbook>`;
};

export const buildFinanceiroReportPdfHtml = (
  data: FinanceiroExportData,
  sections: FinanceiroExportSections = DEFAULT_FINANCEIRO_EXPORT_SECTIONS,
): string => {
  const report = buildFinanceiroReport(data, sections);

  const tablesHtml = report.tables
    .map((table) => {
      const bodyRows =
        table.rows.length === 0
          ? `<tr><td colspan="${table.headers.length}">Nenhum lançamento no período</td></tr>`
          : table.rows
              .map(
                (row) =>
                  `<tr>${row
                    .map((cell, index) => {
                      const align = index === row.length - 1 ? ' class="num"' : "";
                      return `<td${align}>${escapeHtml(cell)}</td>`;
                    })
                    .join("")}</tr>`,
              )
              .join("");

      const totalRow =
        table.totalLabel != null && table.totalValue != null
          ? `<tr class="total"><td colspan="${Math.max(table.headers.length - 1, 1)}">${escapeHtml(
              table.totalLabel,
            )}</td><td class="num">${escapeHtml(formatMoneyBr(table.totalValue))}</td></tr>`
          : "";

      return `
      <section>
        <h2>${escapeHtml(table.title)}</h2>
        <table>
          <thead>
            <tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${bodyRows}
            ${totalRow}
          </tbody>
        </table>
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page { margin: 16mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      margin: 24px;
      font-size: 12px;
    }
    h1 { font-size: 20px; margin: 0 0 8px; }
    .meta { color: #555; margin-bottom: 24px; }
    section { margin-bottom: 28px; page-break-inside: avoid; }
    h2 {
      font-size: 14px;
      margin: 0 0 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #ddd;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f3f3f3; font-weight: 700; }
    td.num, th:last-child { text-align: right; white-space: nowrap; }
    tr.total td { font-weight: 700; background: #fafafa; }
    @media print {
      body { margin: 0; }
      button { display: none !important; }
    }
    .actions { margin-bottom: 16px; }
    .actions button {
      border: 1px solid #ccc;
      background: #fff;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="actions">
    <button type="button" onclick="window.print()">Salvar / imprimir PDF</button>
  </div>
  <h1>${escapeHtml(report.title)}</h1>
  <p class="meta">Período: ${escapeHtml(report.periodFrom)} a ${escapeHtml(report.periodTo)}</p>
  ${tablesHtml}
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`;
};

export const getFinanceiroReportFilename = (
  month: string,
  format: FinanceiroExportFormat = "csv",
): string => `financeiro-${month}.${format}`;

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const openPdfPreview = (html: string): void => {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener,noreferrer");

  if (!popup) {
    URL.revokeObjectURL(url);
    throw new Error("popup_blocked");
  }

  // Revoga depois que a aba nova tiver tempo de carregar o blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const downloadFinanceiroReport = (
  data: FinanceiroExportData,
  options: FinanceiroExportOptions = {
    format: "csv",
    sections: DEFAULT_FINANCEIRO_EXPORT_SECTIONS,
  },
): void => {
  if (!hasSelectedSections(options.sections)) {
    throw new Error("no_sections");
  }

  const filename = getFinanceiroReportFilename(data.month, options.format);

  if (options.format === "csv") {
    const content = buildFinanceiroReportCsv(data, options.sections);
    triggerDownload(new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" }), filename);
    return;
  }

  if (options.format === "xls") {
    const content = buildFinanceiroReportXls(data, options.sections);
    triggerDownload(
      new Blob([content], {
        type: "application/vnd.ms-excel;charset=utf-8",
      }),
      filename,
    );
    return;
  }

  openPdfPreview(buildFinanceiroReportPdfHtml(data, options.sections));
};
