import { type ReactNode } from "react";
import { ArrowDownCircle, ArrowUpCircle, Percent, TrendingUp } from "lucide-react";

import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DashboardDescricaoRow,
  DreStatement,
  formatFinanceiroMonthLabel,
} from "@/features/financeiro";

interface FinanceiroDashboardProps {
  contratoCount: number;
  isLoading: boolean;
  month: string;
  saidaRows: DashboardDescricaoRow[];
  statement: DreStatement;
}

export const FinanceiroDashboard = ({
  contratoCount,
  isLoading,
  month,
  saidaRows,
  statement,
}: FinanceiroDashboardProps) => {
  const saidasAtivas = saidaRows.filter((row) => row.total > 0).sort((a, b) => b.total - a.total);
  const margemLiquida =
    statement.receitaLiquida > 0 ? (statement.resultadoLiquido / statement.receitaLiquida) * 100 : null;
  const maiorDespesa = saidasAtivas[0] ?? null;
  const maiorDespesaPercent =
    maiorDespesa && statement.despesasTotal > 0 ? (maiorDespesa.total / statement.despesasTotal) * 100 : null;

  const entradasCards = [
    {
      hint: "Sinal na assinatura do contrato para reservar a data",
      label: "Entrada de contrato",
      negative: false,
      value: statement.reservasTotal,
    },
    {
      hint: "Parcelas e saldo recebidos das festas no periodo",
      label: "Pagamento de festa",
      negative: false,
      value: statement.pagamentosSaldoTotal,
    },
    {
      hint: "Vendas extras e adicionais lancados nas festas",
      label: "Adicionais contratados",
      negative: false,
      value: statement.adicionaisTotal,
    },
    {
      hint: "Receitas avulsas da empresa (ex.: venda de estoque)",
      label: "Outras receitas",
      negative: false,
      value: statement.outrasReceitasTotal,
    },
    {
      hint: "Descontos concedidos no periodo",
      label: "Descontos",
      negative: true,
      value: statement.descontosTotal,
    },
  ].filter((item) => item.label !== "Descontos" || item.value < 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={ArrowUpCircle}
          label="Receita liquida"
          loading={isLoading}
          tone="entrada"
          value={formatFinanceiroCurrency(statement.receitaLiquida)}
        />
        <SummaryCard
          icon={ArrowDownCircle}
          label="Despesas"
          loading={isLoading}
          tone="saida"
          value={formatFinanceiroCurrency(statement.despesasTotal)}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Resultado do mes"
          loading={isLoading}
          tone="resultado"
          value={formatFinanceiroCurrency(statement.resultadoLiquido)}
          negative={statement.resultadoLiquido < 0}
        />
      </div>

      <DashboardRow
        subtitle={`Recebimentos de ${formatFinanceiroMonthLabel(month)}`}
        title="Entradas do mes"
      >
        {isLoading ? (
          <p className="text-sm italic text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {entradasCards.map((item) => (
              <MetricCard
                key={item.label}
                hint={item.hint}
                label={item.label}
                loading={isLoading}
                negative={item.negative}
                value={item.value}
              />
            ))}
          </div>
        )}
      </DashboardRow>

      <DashboardRow subtitle="Despesas por descricao no periodo" title="Saidas do mes">
        {isLoading ? (
          <p className="text-sm italic text-muted-foreground">Carregando...</p>
        ) : saidasAtivas.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Nenhuma despesa registrada neste periodo.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {saidasAtivas.map((row) => (
              <MetricCard
                key={row.label}
                label={row.label}
                loading={isLoading}
                negative
                value={row.total}
              />
            ))}
          </div>
        )}
      </DashboardRow>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resultado do mes</p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums ${
                isLoading
                  ? "text-muted-foreground"
                  : statement.resultadoLiquido < 0
                    ? "text-destructive"
                    : "text-primary"
              }`}
            >
              {isLoading ? "..." : formatFinanceiroCurrency(statement.resultadoLiquido)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Receita liquida menos despesas operacionais de {formatFinanceiroMonthLabel(month)}.
            </p>
          </div>
          {!isLoading && margemLiquida != null ? (
            <div className="rounded-lg border border-border/40 bg-background/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Margem liquida</p>
              <p className={`mt-1 text-xl font-bold ${margemLiquida < 0 ? "text-destructive" : "text-foreground"}`}>
                {margemLiquida.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Analise rapida</CardTitle>
          <p className="text-sm text-muted-foreground">Indicadores para leitura executiva do mes.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <InsightTile
            icon={ArrowUpCircle}
            label="Contratos com entrada"
            loading={isLoading}
            value={isLoading ? "..." : String(contratoCount)}
            hint={contratoCount === 1 ? "festa reservada no periodo" : "festas reservadas no periodo"}
          />
          <InsightTile
            icon={Percent}
            label="Maior despesa"
            loading={isLoading}
            value={maiorDespesa ? maiorDespesa.label : "—"}
            hint={
              maiorDespesa && maiorDespesaPercent != null
                ? `${formatFinanceiroCurrency(maiorDespesa.total)} · ${maiorDespesaPercent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% das saidas`
                : "Sem despesas no periodo"
            }
          />
          <InsightTile
            icon={TrendingUp}
            label="Relacao despesa / receita"
            loading={isLoading}
            value={
              isLoading || statement.receitaLiquida <= 0
                ? "—"
                : `${((statement.despesasTotal / statement.receitaLiquida) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
            }
            hint="Quanto das entradas foi consumido por despesas"
          />
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardRow = ({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) => (
  <section className="space-y-3">
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {children}
  </section>
);

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
            <p className={`mt-2 text-2xl font-bold tabular-nums ${loading ? "text-muted-foreground" : toneClass}`}>
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

const MetricCard = ({
  hint,
  label,
  loading,
  negative = false,
  value,
}: {
  hint?: string;
  label: string;
  loading: boolean;
  negative?: boolean;
  value: number;
}) => {
  const isZero = value === 0;
  const valueClass =
    loading || isZero
      ? "text-muted-foreground"
      : negative || value < 0
        ? "text-destructive"
        : "text-foreground";

  return (
    <Card className={isZero && !loading ? "border-dashed border-border/50 bg-muted/10" : ""}>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 text-xl font-bold tabular-nums ${valueClass}`}>
          {loading ? "..." : formatFinanceiroCurrency(value)}
        </p>
        {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
};

const InsightTile = ({
  hint,
  icon: Icon,
  label,
  loading,
  value,
}: {
  hint: string;
  icon: typeof ArrowUpCircle;
  label: string;
  loading: boolean;
  value: string;
}) => (
  <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
    </div>
    <p className={`text-sm font-semibold ${loading ? "text-muted-foreground" : "text-foreground"}`}>{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
  </div>
);
