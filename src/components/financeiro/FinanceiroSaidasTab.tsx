import { Plus } from "lucide-react";

import { FinanceiroLancamentosList } from "@/components/financeiro/FinanceiroLancamentosList";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceiroDisplayItem, sumDisplayItems } from "@/features/financeiro";

interface FinanceiroSaidasTabProps {
  isLoading: boolean;
  onAddDespesa: () => void;
  onDelete?: (item: FinanceiroDisplayItem) => void;
  saidas: FinanceiroDisplayItem[];
}

export const FinanceiroSaidasTab = ({
  isLoading,
  onAddDespesa,
  onDelete,
  saidas,
}: FinanceiroSaidasTabProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
      <div>
        <CardTitle className="text-base font-semibold">Saidas do periodo</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Despesas das festas e despesas gerais do tenant por data de lancamento.
        </p>
      </div>
      <Button className="shrink-0 gap-2" onClick={onAddDespesa}>
        <Plus className="h-4 w-4" />
        Nova despesa
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de saidas</p>
        <p className="mt-1 text-xl font-bold text-destructive">{formatFinanceiroCurrency(sumDisplayItems(saidas))}</p>
      </div>

      <FinanceiroLancamentosList
        emptyMessage="Nenhuma saida registrada neste periodo."
        isLoading={isLoading}
        items={saidas}
        onDelete={onDelete}
      />
    </CardContent>
  </Card>
);
