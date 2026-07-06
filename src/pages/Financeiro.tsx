import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Wallet } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { LancamentoFormDialog } from "@/components/financeiro/LancamentoFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildEventoFinanceiroSummary,
  buildTenantFinanceiroPeriodSummary,
  getFinanceiroCategoriaLabel,
  useFinanceiroLancamentos,
} from "@/features/financeiro";
import { useEventos } from "@/features/eventos";
import { formatIsoDateBR, getTodayAtNoon } from "@/lib/date";

const eventLancamentosHasActivity = (eventoId: number, lancamentos: { evento_id: number | null }[]) =>
  lancamentos.some((item) => item.evento_id === eventoId);

const getMonthRange = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  const from = `${monthValue}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${monthValue}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
};

const Financeiro = () => {
  const today = getTodayAtNoon();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [despesaDialogOpen, setDespesaDialogOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);

  const { from, to } = useMemo(() => getMonthRange(month), [month]);
  const { data: lancamentos = [], isLoading } = useFinanceiroLancamentos({ from, to });
  const { data: eventos = [] } = useEventos();

  const periodSummary = useMemo(() => buildTenantFinanceiroPeriodSummary(lancamentos), [lancamentos]);

  const festasOverview = useMemo(() => {
    const festaEventos = eventos.filter((event) => event.funil === "festa" || event.funil === "executadas");

    return festaEventos
      .map((event) => {
        const eventLancamentos = lancamentos.filter((item) => item.evento_id === event.id);
        const summary = buildEventoFinanceiroSummary(event, eventLancamentos);

        return {
          event,
          summary,
        };
      })
      .filter(({ event }) => {
        if (!event.data_evento) {
          return eventLancamentosHasActivity(event.id, lancamentos);
        }

        return event.data_evento >= from && event.data_evento <= to;
      })
      .sort((a, b) => (a.event.data_evento ?? "").localeCompare(b.event.data_evento ?? ""));
  }, [eventos, from, lancamentos, to]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visao geral de entradas, saidas e resultado do tenant.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setEntradaDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Entrada geral
            </Button>
            <Button className="gap-2" onClick={() => setDespesaDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Despesa geral
            </Button>
          </div>
        </div>

        <div className="mb-4 max-w-xs">
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Entradas no periodo" value={formatFinanceiroCurrency(periodSummary.entradas)} />
          <SummaryCard label="Saidas no periodo" value={formatFinanceiroCurrency(periodSummary.saidas)} negative />
          <SummaryCard
            label="Resultado do periodo"
            value={formatFinanceiroCurrency(periodSummary.resultado)}
            highlight
            negative={periodSummary.resultado < 0}
          />
        </div>

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Wallet className="h-4 w-4 text-festa-blue" />
              Por festa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {festasOverview.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Nenhuma festa encontrada neste periodo.</p>
            ) : (
              festasOverview.map(({ event, summary }) => (
                <Link
                  key={event.id}
                  to={`/crm/evento/${event.id}/financeiro`}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatIsoDateBR(event.data_evento)} · Resultado {formatFinanceiroCurrency(summary.resultadoFesta)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">Lancamentos do periodo</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/financeiro/lancamentos">Ver extrato completo</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm italic text-muted-foreground">Carregando lancamentos...</p>
            ) : lancamentos.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Nenhum lancamento neste periodo.</p>
            ) : (
              lancamentos.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {getFinanceiroCategoriaLabel(item.categoria)}
                      {item.descricao ? ` · ${item.descricao}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatIsoDateBR(item.data_lancamento)}
                      {item.evento_id ? ` · Festa #${item.evento_id}` : " · Geral"}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${item.tipo === "saida" ? "text-destructive" : "text-foreground"}`}>
                    {item.tipo === "saida" ? "-" : "+"}
                    {formatFinanceiroCurrency(item.valor)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <LancamentoFormDialog open={despesaDialogOpen} onOpenChange={setDespesaDialogOpen} mode="despesa_geral" />
      <LancamentoFormDialog open={entradaDialogOpen} onOpenChange={setEntradaDialogOpen} mode="entrada_geral" />
    </AppLayout>
  );
};

const SummaryCard = ({
  highlight = false,
  label,
  negative = false,
  value,
}: {
  highlight?: boolean;
  label: string;
  negative?: boolean;
  value: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${negative ? "text-destructive" : highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </CardContent>
  </Card>
);

export default Financeiro;
