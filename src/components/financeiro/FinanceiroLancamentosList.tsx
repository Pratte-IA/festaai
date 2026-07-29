import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FinanceiroDisplayItem,
  getFinanceiroCategoriaLabel,
  isFinanceiroCategoriaDesconto,
  isFluxoCaixaLegacyItem,
  LEGADO_DATA_ESTIMADA_TOOLTIP,
} from "@/features/financeiro";
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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        {items.map((item) => {
          const canDelete = onDelete && item.deletable && item.ledgerId != null;
          const isLegacy = isFluxoCaixaLegacyItem(item);

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-muted/20 p-2.5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {getFinanceiroCategoriaLabel(item.categoria)}
                  </p>
                  {isLegacy ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help text-[10px] font-normal">
                          Data estimada
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        {LEGADO_DATA_ESTIMADA_TOOLTIP}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                {item.descricao ? (
                  <p className="truncate text-xs text-muted-foreground">{item.descricao}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {isLegacy ? (
                    <>Data estimada: {formatIsoDateBR(item.data_lancamento)}</>
                  ) : (
                    <>Data do movimento: {formatIsoDateBR(item.data_lancamento)}</>
                  )}
                  {item.evento_id ? (
                    <>
                      {" · "}
                      <Link className="underline" to={`/crm/evento/${item.evento_id}/financeiro`}>
                        Festa #{item.evento_id}
                      </Link>
                    </>
                  ) : !isLegacy ? (
                    " · Geral"
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`text-sm font-medium tabular-nums ${
                    item.valor < 0 || isFinanceiroCategoriaDesconto(item.categoria)
                      ? "text-destructive"
                      : item.tipo === "saida"
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  {item.valor < 0
                    ? formatFinanceiroCurrency(item.valor)
                    : `${item.tipo === "saida" ? "-" : "+"}${formatFinanceiroCurrency(item.valor)}`}
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
    </TooltipProvider>
  );
};
