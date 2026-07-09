import { type ReactNode, useState } from "react";
import { Plus } from "lucide-react";

import { FinanceiroLancamentosList } from "@/components/financeiro/FinanceiroLancamentosList";
import { LancamentoGeralInlineForm } from "@/components/financeiro/LancamentoGeralInlineForm";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceiroDisplayItem, sumDisplayItems } from "@/features/financeiro";

interface FinanceiroEntradasTabProps {
  entradasFestas: FinanceiroDisplayItem[];
  entradasManuais: FinanceiroDisplayItem[];
  isLoading: boolean;
  onDelete?: (item: FinanceiroDisplayItem) => void;
}

export const FinanceiroEntradasTab = ({
  entradasFestas,
  entradasManuais,
  isLoading,
  onDelete,
}: FinanceiroEntradasTabProps) => {
  const [showEntradaForm, setShowEntradaForm] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Entradas do periodo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <LedgerSection
          emptyMessage="Nenhuma entrada de reserva registrada neste periodo."
          isLoading={isLoading}
          items={entradasFestas}
          subtitle="Informacoes atualizadas automaticamente com base no registro por festa."
          title="Festas — automatico"
          total={sumDisplayItems(entradasFestas)}
        />

        <LedgerSection
          action={
            <Button
              className="gap-2"
              size="sm"
              variant={showEntradaForm ? "secondary" : "outline"}
              onClick={() => setShowEntradaForm((current) => !current)}
            >
              <Plus className="h-4 w-4" />
              Nova entrada avulsa
            </Button>
          }
          emptyMessage="Nenhuma entrada avulsa registrada neste periodo."
          isLoading={isLoading}
          items={entradasManuais}
          onDelete={onDelete}
          subtitle="Receitas da operacao fora do fluxo de festas."
          title="Empresa — manual"
          total={sumDisplayItems(entradasManuais)}
        >
          {showEntradaForm ? (
            <LancamentoGeralInlineForm
              mode="entrada_geral"
              onCancel={() => setShowEntradaForm(false)}
              onSuccess={() => setShowEntradaForm(false)}
            />
          ) : null}
        </LedgerSection>
      </CardContent>
    </Card>
  );
};

const LedgerSection = ({
  action,
  children,
  emptyMessage,
  isLoading,
  items,
  onDelete,
  subtitle,
  title,
  total,
}: {
  action?: ReactNode;
  children?: ReactNode;
  emptyMessage: string;
  isLoading: boolean;
  items: FinanceiroDisplayItem[];
  onDelete?: (item: FinanceiroDisplayItem) => void;
  subtitle: string;
  title: string;
  total: number;
}) => (
  <section className="space-y-3 rounded-lg border border-border/40 bg-muted/10 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>

    {children}

    <div className="rounded-lg border border-border/40 bg-background/60 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Subtotal</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
        {isLoading ? "..." : formatFinanceiroCurrency(total)}
      </p>
    </div>

    <FinanceiroLancamentosList
      emptyMessage={emptyMessage}
      isLoading={isLoading}
      items={items}
      onDelete={onDelete}
    />
  </section>
);
