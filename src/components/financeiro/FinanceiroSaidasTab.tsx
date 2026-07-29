import { type ReactNode, useState } from "react";
import { Plus } from "lucide-react";

import { FinanceiroLancamentosList } from "@/components/financeiro/FinanceiroLancamentosList";
import { LancamentoGeralInlineForm } from "@/components/financeiro/LancamentoGeralInlineForm";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceiroDisplayItem, sumDisplayItems } from "@/features/financeiro";

interface FinanceiroSaidasTabProps {
  isLoading: boolean;
  onDelete?: (item: FinanceiroDisplayItem) => void;
  saidasFestas: FinanceiroDisplayItem[];
  saidasGerais: FinanceiroDisplayItem[];
}

export const FinanceiroSaidasTab = ({
  isLoading,
  onDelete,
  saidasFestas,
  saidasGerais,
}: FinanceiroSaidasTabProps) => {
  const [showDespesaForm, setShowDespesaForm] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Saidas do periodo</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Despesas gerais da empresa sao lancadas aqui (aluguel, investimentos, marketing etc.). No
          Fluxo de Caixa entram pela data de pagamento; na Competencia, pelo mes informado no cadastro.
          Despesas de cada festa seguem a mesma regra de datas e aparecem a partir do financeiro do
          evento.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <LedgerSection
          action={
            <Button
              className="gap-2"
              size="sm"
              variant={showDespesaForm ? "secondary" : "default"}
              onClick={() => setShowDespesaForm((current) => !current)}
            >
              <Plus className="h-4 w-4" />
              Nova despesa geral
            </Button>
          }
          emptyMessage="Nenhuma despesa geral registrada neste periodo."
          isLoading={isLoading}
          items={saidasGerais}
          negativeTotal
          onDelete={onDelete}
          subtitle="Custos da operacao sem vinculo com uma festa especifica."
          title="Empresa — manual"
          total={sumDisplayItems(saidasGerais)}
        >
          {showDespesaForm ? (
            <LancamentoGeralInlineForm
              mode="despesa_geral"
              onCancel={() => setShowDespesaForm(false)}
              onSuccess={() => setShowDespesaForm(false)}
            />
          ) : null}
        </LedgerSection>

        <LedgerSection
          emptyMessage="Nenhuma despesa de festa registrada neste periodo."
          isLoading={isLoading}
          items={saidasFestas}
          negativeTotal
          onDelete={onDelete}
          subtitle="Lancadas no financeiro de cada evento (buffet, equipe, decoracao etc.)."
          title="Festas — automatico / por evento"
          total={sumDisplayItems(saidasFestas)}
        />
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
  negativeTotal = false,
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
  negativeTotal?: boolean;
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
      <p
        className={`mt-1 text-lg font-bold tabular-nums ${negativeTotal ? "text-destructive" : "text-foreground"}`}
      >
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
