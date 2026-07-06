import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { LancamentoFormDialog } from "@/components/financeiro/LancamentoFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildTenantFinanceiroPeriodSummary,
  getFinanceiroCategoriaLabel,
  useDeleteFinanceiroLancamento,
  useFinanceiroLancamentos,
} from "@/features/financeiro";
import { formatIsoDateBR, getTodayAtNoon } from "@/lib/date";
import { toast } from "@/hooks/use-toast";

const getMonthRange = (monthValue: string) => {
  const [year, month] = monthValue.split("-").map(Number);
  const from = `${monthValue}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${monthValue}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
};

const FinanceiroLancamentos = () => {
  const today = getTodayAtNoon();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [despesaDialogOpen, setDespesaDialogOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);

  const { from, to } = useMemo(() => getMonthRange(month), [month]);
  const { data: lancamentos = [], isLoading } = useFinanceiroLancamentos({ from, to });
  const deleteLancamento = useDeleteFinanceiroLancamento();

  const periodSummary = useMemo(() => buildTenantFinanceiroPeriodSummary(lancamentos), [lancamentos]);

  const handleDelete = async (id: number, eventoId: number | null) => {
    if (!window.confirm("Remover este lancamento?")) {
      return;
    }

    try {
      await deleteLancamento.mutateAsync({ eventoId, id });
      toast({ title: "Lancamento removido" });
    } catch {
      toast({
        title: "Nao foi possivel remover",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link to="/financeiro">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao financeiro
          </Link>
        </Button>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lancamentos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Extrato completo por data de lancamento.</p>
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

        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <MiniCard label="Entradas" value={formatFinanceiroCurrency(periodSummary.entradas)} />
          <MiniCard label="Saidas" value={formatFinanceiroCurrency(periodSummary.saidas)} negative />
          <MiniCard label="Resultado" value={formatFinanceiroCurrency(periodSummary.resultado)} highlight />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Extrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm italic text-muted-foreground">Carregando...</p>
            ) : lancamentos.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Nenhum lancamento neste periodo.</p>
            ) : (
              lancamentos.map((item) => {
                const canDelete = item.origem !== "pagamento";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-muted/20 p-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {getFinanceiroCategoriaLabel(item.categoria)}
                        {item.descricao ? ` · ${item.descricao}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatIsoDateBR(item.data_lancamento)}
                        {item.evento_id ? (
                          <>
                            {" · "}
                            <Link className="underline" to={`/crm/evento/${item.evento_id}/financeiro`}>
                              Festa #{item.evento_id}
                            </Link>
                          </>
                        ) : (
                          " · Geral"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${item.tipo === "saida" ? "text-destructive" : ""}`}>
                        {item.tipo === "saida" ? "-" : "+"}
                        {formatFinanceiroCurrency(item.valor)}
                      </span>
                      {canDelete ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(item.id, item.evento_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <LancamentoFormDialog open={despesaDialogOpen} onOpenChange={setDespesaDialogOpen} mode="despesa_geral" />
      <LancamentoFormDialog open={entradaDialogOpen} onOpenChange={setEntradaDialogOpen} mode="entrada_geral" />
    </AppLayout>
  );
};

const MiniCard = ({
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
  <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-lg font-semibold ${negative ? "text-destructive" : highlight ? "text-primary" : ""}`}>
      {value}
    </p>
  </div>
);

export default FinanceiroLancamentos;
