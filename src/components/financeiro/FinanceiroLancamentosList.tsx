import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { FinanceiroDisplayItem, getFinanceiroCategoriaLabel } from "@/features/financeiro";
import { formatIsoDateBR } from "@/lib/date";

interface FinanceiroLancamentosListProps {
  emptyMessage: string;
  isLoading?: boolean;
  items: FinanceiroDisplayItem[];
  onDelete?: (item: FinanceiroDisplayItem) => void;
}

export const FinanceiroLancamentosList = ({
  emptyMessage,
  isLoading = false,
  items,
  onDelete,
}: FinanceiroLancamentosListProps) => {
  if (isLoading) {
    return <p className="text-sm italic text-muted-foreground">Carregando lancamentos...</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm italic text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const canDelete = onDelete && item.deletable && item.ledgerId != null;

        return (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-muted/20 p-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {getFinanceiroCategoriaLabel(item.categoria)}
                {item.descricao ? ` · ${item.descricao}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatIsoDateBR(item.data_lancamento)}
                {item.origem === "contrato" ? " · Assinatura do contrato" : null}
                {item.evento_id ? (
                  <>
                    {" · "}
                    <Link className="underline" to={`/crm/evento/${item.evento_id}/financeiro`}>
                      Festa #{item.evento_id}
                    </Link>
                  </>
                ) : item.origem !== "contrato" ? (
                  " · Geral"
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-sm font-medium ${item.tipo === "saida" ? "text-destructive" : "text-foreground"}`}>
                {item.tipo === "saida" ? "-" : "+"}
                {formatFinanceiroCurrency(item.valor)}
              </span>
              {canDelete ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
