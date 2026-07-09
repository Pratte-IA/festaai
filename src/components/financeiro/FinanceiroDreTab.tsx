import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DreStatement, DreStatementLine, formatFinanceiroMonthLabel } from "@/features/financeiro";

interface FinanceiroDreTabProps {
  isLoading: boolean;
  month: string;
  statement: DreStatement;
}

export const FinanceiroDreTab = ({ isLoading, month, statement }: FinanceiroDreTabProps) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold">DRE — Demonstrativo de Resultado</CardTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        Visao consolidada do mes de {formatFinanceiroMonthLabel(month)} com receitas, deducoes, despesas e
        resultado liquido.
      </p>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Receita liquida" loading={isLoading} value={statement.receitaLiquida} />
        <Metric label="Despesas" loading={isLoading} negative value={statement.despesasTotal} />
        <Metric
          highlight
          label="Resultado liquido"
          loading={isLoading}
          negative={statement.resultadoLiquido < 0}
          value={statement.resultadoLiquido}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border/40">
        {isLoading ? (
          <p className="p-4 text-sm italic text-muted-foreground">Carregando DRE...</p>
        ) : (
          <div className="divide-y divide-border/30">
            {statement.lines.map((line) => (
              <DreLine key={line.id} line={line} />
            ))}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const Metric = ({
  highlight = false,
  label,
  loading,
  negative = false,
  value,
}: {
  highlight?: boolean;
  label: string;
  loading: boolean;
  negative?: boolean;
  value: number;
}) => (
  <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p
      className={`mt-1 text-lg font-bold tabular-nums ${
        loading
          ? "text-muted-foreground"
          : negative
            ? "text-destructive"
            : highlight
              ? "text-primary"
              : "text-foreground"
      }`}
    >
      {loading ? "..." : formatFinanceiroCurrency(value)}
    </p>
  </div>
);

const DreLine = ({ line }: { line: DreStatementLine }) => {
  if (line.kind === "header") {
    return (
      <div className="bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{line.label}</p>
      </div>
    );
  }

  const isSubtotal = line.kind === "subtotal";
  const isTotal = line.kind === "total";
  const isDeduction = line.kind === "deduction";
  const isExpense = line.kind === "expense";
  const showValue = !isExpense || line.value > 0;

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
        isTotal ? "bg-primary/5" : isSubtotal ? "bg-muted/20" : ""
      }`}
    >
      <span
        className={`text-sm ${line.level === 1 ? "pl-3 text-muted-foreground" : ""} ${
          isSubtotal || isTotal ? "font-semibold text-foreground" : ""
        }`}
      >
        {isSubtotal || isTotal ? `(=) ${line.label}` : line.label}
      </span>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isTotal
            ? line.value < 0
              ? "text-destructive"
              : "text-primary"
            : isDeduction || isExpense
              ? line.value > 0
                ? "text-destructive"
                : "text-muted-foreground/70"
              : line.value <= 0
                ? "text-muted-foreground/70"
                : "text-foreground"
        }`}
      >
        {showValue ? formatFinanceiroCurrency(line.value) : formatFinanceiroCurrency(0)}
      </span>
    </div>
  );
};
