import { funnelTabs, stageMap } from "./constants";
import { getDefaultStageForFunnel } from "./stage-validation";
import { FunnelType, Stage } from "./types";

/** Colunas do modelo alinhadas ao EventoFormDialog e ao parser de importacao. */
export const LEAD_IMPORT_CSV_HEADERS = [
  "funil",
  "etapa",
  "nome",
  "telefone",
  "email",
  "origem",
  "tipo_evento",
  "data_evento",
  "hora",
  "aniversariante",
  "nascimento",
  "convidados",
  "pacote_nome",
  "valor_pacote",
  "valor_adicionais",
  "valor_entrada",
  "observacoes",
] as const;

const escapeCsvCell = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const formatCsvRow = (cells: string[]): string => cells.map(escapeCsvCell).join(",");

export const getLeadImportCsvFilename = (funnel: FunnelType): string =>
  `modelo-importacao-${funnel}.csv`;

export const getLeadImportFunnelLabel = (funnel: FunnelType): string =>
  funnelTabs.find((tab) => tab.key === funnel)?.label ?? funnel;

export const getLeadImportStageLabel = (funnel: FunnelType, stage: Stage): string =>
  stageMap[funnel].find((item) => item.key === stage)?.label ?? stage;

export const buildLeadImportCsvTemplate = (
  funnel: FunnelType,
  defaultStage: Stage = getDefaultStageForFunnel(funnel),
): string => {
  const exampleRow = LEAD_IMPORT_CSV_HEADERS.map((header) => {
    switch (header) {
      case "funil":
        return funnel;
      case "etapa":
        return defaultStage;
      case "nome":
        return "Maria Silva";
      case "telefone":
        return "11999998888";
      case "email":
        return "maria@exemplo.com";
      case "origem":
        return "Instagram";
      case "tipo_evento":
        return "festa";
      case "data_evento":
        return "15/06/2026";
      case "hora":
        return "14:30";
      case "aniversariante":
        return "Julia";
      case "nascimento":
        return "12/03/2019";
      case "convidados":
        return "40";
      case "pacote_nome":
        return "Pacote Ouro";
      case "valor_pacote":
        return "5500";
      case "valor_adicionais":
        return "";
      case "valor_entrada":
        return "";
      case "observacoes":
        return "";
      default:
        return "";
    }
  });

  return `${formatCsvRow([...LEAD_IMPORT_CSV_HEADERS])}\n${formatCsvRow(exampleRow)}`;
};

export const downloadLeadImportCsvTemplate = (
  funnel: FunnelType,
  defaultStage?: Stage,
): void => {
  const content = buildLeadImportCsvTemplate(funnel, defaultStage);
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getLeadImportCsvFilename(funnel);
  anchor.click();
  URL.revokeObjectURL(url);
};
