import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { FinanceiroSummaryStats, formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { LancamentoFormDialog } from "@/components/financeiro/LancamentoFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  getEventBalance,
  getEventDisplayTotalPaid,
  useCreateEventoPagamento,
  useEvento,
  useEventoPagamentos,
} from "@/features/eventos";
import {
  getFinanceiroCategoriaLabel,
  useDeleteFinanceiroLancamento,
  useEventoFinanceiroSummary,
} from "@/features/financeiro";
import { formatIsoDateBR } from "@/lib/date";
import { toast } from "@/hooks/use-toast";

const EventoFinanceiro = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventoId = id ? Number(id) : null;
  const isValidEventoId = Number.isInteger(eventoId) && Number(eventoId) > 0;
  const validEventoId = isValidEventoId ? Number(eventoId) : null;

  const { data: event, error, isLoading } = useEvento(validEventoId);
  const { data: payments = [] } = useEventoPagamentos(validEventoId);
  const { isLoading: isSummaryLoading, lancamentos, summary } = useEventoFinanceiroSummary(event);
  const createPagamento = useCreateEventoPagamento();
  const deleteLancamento = useDeleteFinanceiroLancamento();

  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [despesaDialogOpen, setDespesaDialogOpen] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPaymentDate, setNewPaymentDate] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");

  const entradasManuais = useMemo(
    () => lancamentos.filter((item) => item.tipo === "entrada" && item.origem === "manual"),
    [lancamentos],
  );

  const despesas = useMemo(
    () => lancamentos.filter((item) => item.tipo === "saida"),
    [lancamentos],
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Carregando financeiro da festa...</p>
        </div>
      </AppLayout>
    );
  }

  if (!isValidEventoId || error || !event || !validEventoId) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Evento nao encontrado.</p>
          <Button variant="ghost" onClick={() => navigate("/crm")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao CRM
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (event.funil !== "festa" && event.funil !== "executadas") {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-muted-foreground">
            O controle financeiro da festa fica disponivel nos funis Festa e Executadas.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to={`/crm/evento/${validEventoId}`}>Voltar ao evento</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const additionalPayments = payments.reduce((sum, payment) => sum + payment.valor, 0);
  const totalPaid = getEventDisplayTotalPaid(event, additionalPayments);
  const balance = getEventBalance(event, additionalPayments);

  const addPayment = async () => {
    const valor = Number(newPaymentAmount);

    if (!newPaymentDate || !Number.isFinite(valor) || valor <= 0) {
      toast({
        title: "Dados invalidos",
        description: "Informe data e valor validos.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPagamento.mutateAsync({
        data_pagamento: newPaymentDate,
        eventoId: validEventoId,
        valor,
      });
      setNewPaymentDate("");
      setNewPaymentAmount("");
      setShowPaymentForm(false);
      toast({ title: "Pagamento registrado" });
    } catch {
      toast({
        title: "Nao foi possivel salvar o pagamento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLancamento = async (lancamentoId: number) => {
    try {
      await deleteLancamento.mutateAsync({ eventoId: validEventoId, id: lancamentoId });
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
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link to={`/crm/evento/${validEventoId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao evento
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Financeiro da Festa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.cliente_nome} · {formatIsoDateBR(event.data_evento)}
          </p>
        </div>

        {isSummaryLoading || !summary ? (
          <p className="text-sm italic text-muted-foreground">Carregando resumo...</p>
        ) : (
          <FinanceiroSummaryStats
            entradaTotal={summary.entradaTotal}
            margemPercent={summary.margemPercent}
            resultado={summary.resultadoFesta}
            saidaTotal={summary.saidaTotal}
          />
        )}

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-festa-blue" />
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrato (informativo)</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <InfoItem label="Pacote" value={formatFinanceiroCurrency(event.valor_pacote)} />
                <InfoItem label="Adicionais" value={formatFinanceiroCurrency(event.valor_adicionais)} />
                <InfoItem label="Total contratado" value={formatFinanceiroCurrency(event.valor_total)} highlight />
              </div>
            </div>

            <SectionHeader
              title="Entradas manuais"
              actionLabel="Nova entrada"
              onAction={() => setEntradaDialogOpen(true)}
            />
            {entradasManuais.length === 0 ? (
              <EmptyLine text="Nenhuma entrada manual registrada." />
            ) : (
              entradasManuais.map((item) => (
                <LancamentoRow
                  key={item.id}
                  categoria={getFinanceiroCategoriaLabel(item.categoria)}
                  data={item.data_lancamento}
                  descricao={item.descricao}
                  onDelete={() => handleDeleteLancamento(item.id)}
                  valor={item.valor}
                />
              ))
            )}

            <Separator />

            <SectionHeader title="Pagamentos recebidos" actionLabel="Registrar pagamento" onAction={() => setShowPaymentForm(true)} />
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoItem label="Total pago" value={formatFinanceiroCurrency(totalPaid)} />
              <InfoItem label="Saldo devedor" value={formatFinanceiroCurrency(balance)} negative={balance > 0} />
            </div>

            {showPaymentForm ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row">
                <Input type="date" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} />
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addPayment} disabled={createPagamento.isPending}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowPaymentForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}

            {payments.length === 0 ? (
              <EmptyLine text="Nenhum pagamento registrado." />
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/40 p-2.5"
                >
                  <div>
                    <p className="text-sm text-foreground">{formatIsoDateBR(payment.data_pagamento)}</p>
                    {payment.observacao ? (
                      <p className="text-xs text-muted-foreground">{payment.observacao}</p>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium">{formatFinanceiroCurrency(payment.valor)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Despesas da festa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SectionHeader title="Lancamentos" actionLabel="Nova despesa" onAction={() => setDespesaDialogOpen(true)} />
            {despesas.length === 0 ? (
              <EmptyLine text="Nenhuma despesa registrada." />
            ) : (
              despesas.map((item) => (
                <LancamentoRow
                  key={item.id}
                  categoria={getFinanceiroCategoriaLabel(item.categoria)}
                  data={item.data_lancamento}
                  descricao={item.descricao}
                  onDelete={() => handleDeleteLancamento(item.id)}
                  valor={item.valor}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <LancamentoFormDialog
        open={entradaDialogOpen}
        onOpenChange={setEntradaDialogOpen}
        mode="entrada_evento"
        eventoId={validEventoId}
      />
      <LancamentoFormDialog
        open={despesaDialogOpen}
        onOpenChange={setDespesaDialogOpen}
        mode="despesa_evento"
        eventoId={validEventoId}
      />
    </AppLayout>
  );
};

const InfoItem = ({
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
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-sm font-medium ${negative ? "text-destructive" : highlight ? "text-primary" : ""}`}>
      {value}
    </p>
  </div>
);

const SectionHeader = ({
  actionLabel,
  onAction,
  title,
}: {
  actionLabel: string;
  onAction: () => void;
  title: string;
}) => (
  <div className="flex items-center justify-between gap-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
    <Button size="sm" variant="outline" className="gap-2" onClick={onAction}>
      <Plus className="h-4 w-4" />
      {actionLabel}
    </Button>
  </div>
);

const EmptyLine = ({ text }: { text: string }) => (
  <p className="text-sm italic text-muted-foreground">{text}</p>
);

const LancamentoRow = ({
  categoria,
  data,
  descricao,
  onDelete,
  valor,
}: {
  categoria: string;
  data: string;
  descricao: string | null;
  onDelete: () => void;
  valor: number;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-muted/40 p-2.5">
    <div>
      <p className="text-sm font-medium text-foreground">
        {categoria}
        {descricao ? ` · ${descricao}` : ""}
      </p>
      <p className="text-xs text-muted-foreground">{formatIsoDateBR(data)}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{formatFinanceiroCurrency(valor)}</span>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default EventoFinanceiro;
