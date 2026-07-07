import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";

import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildDashboardEntradaRows,
  buildDashboardSaidaRows,
  buildDrePeriodSummary,
  FinanceiroDisplayItem,
} from "@/features/financeiro";

interface FinanceiroDashboardProps {
  entradas: FinanceiroDisplayItem[];
  isLoading: boolean;
  saidas: FinanceiroDisplayItem[];
}

export const FinanceiroDashboard = ({ entradas, isLoading, saidas }: FinanceiroDashboardProps) => {
  const summary = buildDrePeriodSummary(entradas, saidas);
  const entradaRows = buildDashboardEntradaRows(entradas);
  const saidaRows = buildDashboardSaidaRows(saidas);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={ArrowUpCircle}
          label="Total de entradas"
          loading={isLoading}
          tone="entrada"
          value={formatFinanceiroCurrency(summary.entradas)}
        />
        <SummaryCard
          icon={ArrowDownCircle}
          label="Total de saidas"
          loading={isLoading}
          tone="saida"
          value={formatFinanceiroCurrency(summary.saidas)}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Resultado do mes"
          loading={isLoading}
          tone="resultado"
          value={formatFinanceiroCurrency(summary.resultado)}
          negative={summary.resultado < 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DescricaoBreakdownCard isLoading={isLoading} rows={entradaRows} title="Entradas" type="entrada" />
        <DescricaoBreakdownCard isLoading={isLoading} rows={saidaRows} title="Saidas" type="saida" />
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon: Icon,
  label,
  loading,
  negative = false,
  tone,
  value,
}: {
  icon: typeof ArrowUpCircle;
  label: string;
  loading: boolean;
  negative?: boolean;
  tone: "entrada" | "saida" | "resultado";
  value: string;
}) => {
  const toneClass =
    tone === "saida"
      ? "text-destructive"
      : tone === "resultado" && negative
        ? "text-destructive"
        : tone === "resultado"
          ? "text-primary"
          : "text-foreground";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${loading ? "text-muted-foreground" : toneClass}`}>
              {loading ? "..." : value}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <Icon className={`h-5 w-5 ${tone === "saida" ? "text-destructive" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DescricaoBreakdownCard = ({
  isLoading,
  rows,
  title,
  type,
}: {
  isLoading: boolean;
  rows: { label: string; total: number }[];
  title: string;
  type: "entrada" | "saida";
}) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">Item a item por descricao do mes</p>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <p className="text-sm italic text-muted-foreground">Carregando...</p>
        ) : (
          rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/30"
          >
            <span className={`text-sm ${row.total > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {row.label}
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                row.total <= 0
                  ? "text-muted-foreground/70"
                  : type === "saida"
                    ? "text-destructive"
                    : "text-foreground"
              }`}
            >
              {formatFinanceiroCurrency(row.total)}
            </span>
          </div>
          ))
        )}
      </CardContent>
    </Card>
);
