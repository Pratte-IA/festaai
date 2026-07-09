import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  downloadFinanceiroReport,
  FinanceiroExportData,
} from "@/features/financeiro/export-financeiro-report";
import { toast } from "@/hooks/use-toast";

interface FinanceiroExportButtonProps {
  data: FinanceiroExportData;
  disabled?: boolean;
}

export const FinanceiroExportButton = ({ data, disabled = false }: FinanceiroExportButtonProps) => {
  const handleExport = () => {
    try {
      downloadFinanceiroReport(data);
      toast({ title: "Relatorio exportado" });
    } catch {
      toast({
        title: "Nao foi possivel exportar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button className="gap-2" disabled={disabled} type="button" variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Exportar relatorio
    </Button>
  );
};
