import { Plus } from "lucide-react";

import { FinanceiroLancamentosList } from "@/components/financeiro/FinanceiroLancamentosList";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceiroDisplayItem, sumDisplayItems } from "@/features/financeiro";

interface FinanceiroEntradasTabProps {
  entradas: FinanceiroDisplayItem[];
  isLoading: boolean;
  onAddEntrada: () => void;
  onDelete?: (item: FinanceiroDisplayItem) => void;
}

export const FinanceiroEntradasTab = ({
  entradas,
  isLoading,
  onAddEntrada,
  onDelete,
}: FinanceiroEntradasTabProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
      <div>
        <CardTitle className="text-base font-semibold">Entradas do periodo</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Receitas de contrato pela data de assinatura (valor da entrada), vendas extras e entradas manuais.
          O saldo da festa deve ser lançado manualmente na semana do evento.
        </p>
      </div>
      <Button variant="outline" className="shrink-0 gap-2" onClick={onAddEntrada}>
        <Plus className="h-4 w-4" />
        Nova entrada
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de entradas</p>
        <p className="mt-1 text-xl font-bold text-foreground">
          {formatFinanceiroCurrency(sumDisplayItems(entradas))}
        </p>
      </div>

      <FinanceiroLancamentosList
        emptyMessage="Nenhuma entrada registrada neste periodo."
        isLoading={isLoading}
        items={entradas}
        onDelete={onDelete}
      />
    </CardContent>
  </Card>
);
