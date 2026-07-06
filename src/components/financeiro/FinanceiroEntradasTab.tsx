import { Plus } from "lucide-react";

import { FinanceiroLancamentosList } from "@/components/financeiro/FinanceiroLancamentosList";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceiroLancamento } from "@/features/financeiro";

interface FinanceiroEntradasTabProps {
  isLoading: boolean;
  lancamentos: FinanceiroLancamento[];
  onAddEntrada: () => void;
  onDelete?: (item: FinanceiroLancamento) => void;
  total: number;
}

export const FinanceiroEntradasTab = ({
  isLoading,
  lancamentos,
  onAddEntrada,
  onDelete,
  total,
}: FinanceiroEntradasTabProps) => {
  const entradas = lancamentos.filter((item) => item.tipo === "entrada");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Entradas do periodo</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Pagamentos recebidos, vendas extras e entradas gerais por data de lancamento.
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={onAddEntrada}>
          <Plus className="h-4 w-4" />
          Nova entrada
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de entradas</p>
          <p className="mt-1 text-xl font-bold text-foreground">{formatFinanceiroCurrency(total)}</p>
        </div>

        <FinanceiroLancamentosList
          emptyMessage="Nenhuma entrada registrada neste periodo."
          isLoading={isLoading}
          lancamentos={entradas}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
};
