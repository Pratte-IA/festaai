import { type ReactNode, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { FinanceiroLancamentosList } from "@/components/financeiro/FinanceiroLancamentosList";
import { LancamentoGeralInlineForm } from "@/components/financeiro/LancamentoGeralInlineForm";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildFluxoCaixaEntradasSummary,
  filterFluxoCaixaByConfiabilidade,
  FinanceiroDisplayItem,
  FluxoCaixaConfiabilidadeFilter,
  sumDisplayItems,
} from "@/features/financeiro";

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
  const [confiabilidadeFilter, setConfiabilidadeFilter] =
    useState<FluxoCaixaConfiabilidadeFilter>("todos");

  const todasEntradas = useMemo(
    () => [...entradasFestas, ...entradasManuais],
    [entradasFestas, entradasManuais],
  );

  const entradasFestasFiltradas = useMemo(
    () => filterFluxoCaixaByConfiabilidade(entradasFestas, confiabilidadeFilter),
    [confiabilidadeFilter, entradasFestas],
  );

  const entradasManuaisFiltradas = useMemo(
    () => filterFluxoCaixaByConfiabilidade(entradasManuais, confiabilidadeFilter),
    [confiabilidadeFilter, entradasManuais],
  );

  const periodoSummary = useMemo(
    () => buildFluxoCaixaEntradasSummary(todasEntradas),
    [todasEntradas],
  );

  const summary = useMemo(
    () =>
      buildFluxoCaixaEntradasSummary(
        filterFluxoCaixaByConfiabilidade(todasEntradas, confiabilidadeFilter),
      ),
    [confiabilidadeFilter, todasEntradas],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Confiabilidade da data</p>
          <p className="text-xs text-muted-foreground">
            Separe movimentos com data real de pagamento dos sinais legados com data estimada.
          </p>
        </div>
        <Select
          value={confiabilidadeFilter}
          onValueChange={(value) => setConfiabilidadeFilter(value as FluxoCaixaConfiabilidadeFilter)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="confirmados">Confirmados</SelectItem>
            <SelectItem value="legados">Legados com data estimada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {periodoSummary.legadasCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          Este período contém {periodoSummary.legadasCount} movimento
          {periodoSummary.legadasCount === 1 ? "" : "s"} com data estimada.{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setConfiabilidadeFilter("legados")}
          >
            Ver apenas legados
          </button>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <EntradaSummaryCard
          hint="Com data real de lançamento/pagamento no ledger"
          isLoading={isLoading}
          label="Entradas confirmadas"
          value={summary.confirmadasTotal}
        />
        <EntradaSummaryCard
          hint="Sinais históricos sem data real de pagamento"
          isLoading={isLoading}
          label="Entradas legadas (data estimada)"
          value={summary.legadasTotal}
        />
        <EntradaSummaryCard
          hint={
            summary.legadasCount > 0
              ? "Soma das confirmadas e legadas. Parte do total usa data estimada."
              : "Soma das entradas do período filtrado"
          }
          isLoading={isLoading}
          label="Total de entradas"
          value={summary.total}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Entradas do periodo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <LedgerSection
            emptyMessage="Nenhuma entrada de festa neste filtro."
            isLoading={isLoading}
            items={entradasFestasFiltradas}
            subtitle="Pagamentos confirmados do ledger e sinais legados com data estimada."
            title="Festas"
            total={sumDisplayItems(entradasFestasFiltradas)}
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
            emptyMessage="Nenhuma entrada avulsa neste filtro."
            isLoading={isLoading}
            items={entradasManuaisFiltradas}
            onDelete={onDelete}
            subtitle="Receitas da operação fora do fluxo de festas (data real de lançamento)."
            title="Empresa — manual"
            total={sumDisplayItems(entradasManuaisFiltradas)}
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
    </div>
  );
};

const EntradaSummaryCard = ({
  hint,
  isLoading,
  label,
  value,
}: {
  hint: string;
  isLoading: boolean;
  label: string;
  value: number;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </CardHeader>
    <CardContent>
      <p className="text-xl font-semibold tabular-nums">
        {isLoading ? "..." : formatFinanceiroCurrency(value)}
      </p>
    </CardContent>
  </Card>
);

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
