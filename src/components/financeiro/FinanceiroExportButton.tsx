import { useMemo, useState } from "react";
import { Download, FileDown, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DEFAULT_FINANCEIRO_EXPORT_SECTIONS,
  downloadFinanceiroReport,
  FinanceiroExportData,
  FinanceiroExportFormat,
  FinanceiroExportSections,
  formatFinanceiroMonthLabel,
} from "@/features/financeiro";
import { toast } from "@/hooks/use-toast";

interface FinanceiroExportButtonProps {
  data: FinanceiroExportData;
  disabled?: boolean;
}

const FORMAT_OPTIONS: Array<{
  description: string;
  icon: typeof FileSpreadsheet;
  label: string;
  value: FinanceiroExportFormat;
}> = [
  {
    description: "Abas separadas por seção, ideal para análise no Excel.",
    icon: FileSpreadsheet,
    label: "Excel (.xls)",
    value: "xls",
  },
  {
    description: "Arquivo leve com separador compatível com Excel no Brasil.",
    icon: FileText,
    label: "CSV (.csv)",
    value: "csv",
  },
  {
    description: "Abre pré-visualização pronta para salvar como PDF.",
    icon: FileDown,
    label: "PDF (.pdf)",
    value: "pdf",
  },
];

const SECTION_OPTIONS: Array<{
  description: string;
  key: keyof FinanceiroExportSections;
  label: string;
}> = [
  {
    description: "Demonstrativo do resultado do período.",
    key: "dre",
    label: "DRE",
  },
  {
    description: "Entradas de festas e lançamentos manuais.",
    key: "entradas",
    label: "Entradas",
  },
  {
    description: "Saídas gerais e despesas de festas.",
    key: "saidas",
    label: "Saídas",
  },
];

export const FinanceiroExportButton = ({ data, disabled = false }: FinanceiroExportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<FinanceiroExportFormat>("xls");
  const [sections, setSections] = useState<FinanceiroExportSections>(DEFAULT_FINANCEIRO_EXPORT_SECTIONS);

  const selectedCount = useMemo(
    () => SECTION_OPTIONS.filter((option) => sections[option.key]).length,
    [sections],
  );

  const entradasCount = data.entradasFestas.length + data.entradasManuais.length;
  const saidasCount = data.saidasFestas.length + data.saidasGerais.length;

  const toggleSection = (key: keyof FinanceiroExportSections, checked: boolean) => {
    setSections((current) => ({ ...current, [key]: checked }));
  };

  const handleExport = () => {
    if (selectedCount === 0) {
      toast({
        title: "Selecione ao menos uma seção",
        description: "Marque DRE, Entradas ou Saídas para gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      downloadFinanceiroReport(data, { format, sections });
      setOpen(false);
      toast({
        title: format === "pdf" ? "Pré-visualização do PDF aberta" : "Relatório exportado",
        description:
          format === "pdf"
            ? "Use a impressão do navegador e escolha Salvar como PDF."
            : `Arquivo de ${formatFinanceiroMonthLabel(data.month)} gerado com ${selectedCount} seção(ões).`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast({
        title: "Não foi possível exportar",
        description:
          message === "popup_blocked"
            ? "Permita pop-ups neste site para gerar o PDF."
            : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={disabled} type="button" variant="outline">
          <Download className="h-4 w-4" />
          Exportar relatório
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar relatório</DialogTitle>
          <DialogDescription>
            Escolha o formato e as seções de {formatFinanceiroMonthLabel(data.month)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato</Label>
            <RadioGroup
              className="grid gap-2"
              value={format}
              onValueChange={(value) => setFormat(value as FinanceiroExportFormat)}
            >
              {FORMAT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = format === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                      selected ? "border-primary bg-primary/5" : "border-border"
                    }`}
                    htmlFor={`export-format-${option.value}`}
                  >
                    <RadioGroupItem
                      className="mt-0.5"
                      id={`export-format-${option.value}`}
                      value={option.value}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {option.label}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Incluir no relatório</Label>
              <span className="text-xs text-muted-foreground">{selectedCount} de 3</span>
            </div>

            <div className="grid gap-2">
              {SECTION_OPTIONS.map((option) => {
                const countLabel =
                  option.key === "entradas"
                    ? `${entradasCount} lançamento(s)`
                    : option.key === "saidas"
                      ? `${saidasCount} lançamento(s)`
                      : "resumo do período";

                return (
                  <label
                    key={option.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                      sections[option.key] ? "border-primary/60 bg-primary/5" : "border-border"
                    }`}
                    htmlFor={`export-section-${option.key}`}
                  >
                    <Checkbox
                      checked={sections[option.key]}
                      className="mt-0.5"
                      id={`export-section-${option.key}`}
                      onCheckedChange={(checked) => toggleSection(option.key, checked === true)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{option.label}</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {option.description} ({countLabel})
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button className="gap-2" disabled={selectedCount === 0} type="button" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Gerar arquivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
