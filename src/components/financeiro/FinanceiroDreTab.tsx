import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { FinanceiroLancamentosList } from "@/components/financeiro/FinanceiroLancamentosList";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  buildDrePeriodSummary,
  FinanceiroDisplayItem,
  groupDisplayItemsByCategoria,
} from "@/features/financeiro";

interface FinanceiroDreTabProps {
  entradas: FinanceiroDisplayItem[];
  isLoading: boolean;
  saidas: FinanceiroDisplayItem[];
}

export const FinanceiroDreTab = ({ entradas, isLoading, saidas }: FinanceiroDreTabProps) => {
  const [entradasExpanded, setEntradasExpanded] = useState(false);
  const [saidasExpanded, setSaidasExpanded] = useState(false);

  const summary = buildDrePeriodSummary(entradas, saidas);
  const entradasPorCategoria = groupDisplayItemsByCategoria(entradas);
  const saidasPorCategoria = groupDisplayItemsByCategoria(saidas);

  return (
    <div className="space-y-4">
      <DreSection
        expanded={entradasExpanded}
        isLoading={isLoading}
        items={entradas}
        onExpandedChange={setEntradasExpanded}
        rows={entradasPorCategoria}
        subtitle="Entrada do contrato na assinatura; saldo e demais valores entram manualmente"
        title="Entradas"
        total={summary.entradas}
        type="entrada"
      />

      <DreSection
        expanded={saidasExpanded}
        isLoading={isLoading}
        items={saidas}
        onExpandedChange={setSaidasExpanded}
        rows={saidasPorCategoria}
        subtitle="Despesas das festas e despesas gerais por data de lancamento"
        title="Saidas"
        total={summary.saidas}
        type="saida"
      />

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultado</p>
            <p className="mt-1 text-sm text-muted-foreground">Entradas menos saidas no periodo</p>
          </div>
          <p
            className={`text-2xl font-bold ${summary.resultado < 0 ? "text-destructive" : "text-primary"}`}
          >
            {formatFinanceiroCurrency(summary.resultado)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

interface DreSectionProps {
  expanded: boolean;
  isLoading: boolean;
  items: FinanceiroDisplayItem[];
  onExpandedChange: (expanded: boolean) => void;
  rows: { label: string; total: number }[];
  subtitle: string;
  title: string;
  total: number;
  type: "entrada" | "saida";
}

const DreSection = ({
  expanded,
  isLoading,
  items,
  onExpandedChange,
  rows,
  subtitle,
  title,
  total,
  type,
}: DreSectionProps) => (
  <Card>
    <CardContent className="p-0">
      <Collapsible open={expanded} onOpenChange={onExpandedChange}>
        <div className="flex items-center justify-between gap-3 border-b border-border/40 p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            <p className={`mt-1 text-xl font-bold ${type === "saida" ? "text-destructive" : "text-foreground"}`}>
              {formatFinanceiroCurrency(total)}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Ver detalhes
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className="space-y-2 p-4">
          {isLoading ? (
            <p className="text-sm italic text-muted-foreground">Carregando...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">Nenhum lancamento neste periodo.</p>
          ) : (
            rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`font-medium ${type === "saida" ? "text-destructive" : ""}`}>
                  {formatFinanceiroCurrency(row.total)}
                </span>
              </div>
            ))
          )}
        </div>

        <CollapsibleContent>
          <div className="border-t border-border/40 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Todos os lancamentos do mes
            </p>
            <FinanceiroLancamentosList
              emptyMessage={`Nenhuma ${type === "entrada" ? "entrada" : "saida"} neste periodo.`}
              isLoading={isLoading}
              items={items}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  </Card>
);
