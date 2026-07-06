const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface FinanceiroSummaryStatsProps {
  entradaTotal: number;
  margemPercent: number | null;
  resultado: number;
  saidaTotal: number;
}

export const FinanceiroSummaryStats = ({
  entradaTotal,
  margemPercent,
  resultado,
  saidaTotal,
}: FinanceiroSummaryStatsProps) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    <MiniStat label="Entrada Total" value={formatCurrency(entradaTotal)} />
    <MiniStat label="Saída Total" value={formatCurrency(saidaTotal)} negative={saidaTotal > 0} />
    <MiniStat
      label="Resultado Festa"
      value={formatCurrency(resultado)}
      highlight
      negative={resultado < 0}
    />
    <MiniStat
      label="Margem"
      value={margemPercent == null ? "—" : `${margemPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
      highlight={margemPercent != null && margemPercent >= 0}
      negative={margemPercent != null && margemPercent < 0}
    />
  </div>
);

const MiniStat = ({
  label,
  value,
  highlight = false,
  negative = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) => (
  <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p
      className={`mt-1 text-lg font-semibold ${
        negative ? "text-destructive" : highlight ? "text-primary" : "text-foreground"
      }`}
    >
      {value}
    </p>
  </div>
);

export { formatCurrency as formatFinanceiroCurrency };
