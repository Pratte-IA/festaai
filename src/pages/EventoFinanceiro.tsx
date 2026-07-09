import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Percent, Pencil, Plus, Trash2 } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { EventoContratoFinanceiroInfo } from "@/components/financeiro/EventoContratoFinanceiroInfo";
import { FinanceiroSummaryStats, formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import { LancamentoInlineForm } from "@/components/financeiro/LancamentoInlineForm";
import {
  PagamentoRecebidoInlineForm,
  type PagamentoRecebidoFormTarget,
} from "@/components/financeiro/PagamentoRecebidoInlineForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getEventBalanceFromReceivable,
  getEventDisplayTotalPaid,
  getEventoEntradaDescricao,
  getEventoEntradaReferenceDate,
  useDeleteEventoPagamento,
  useEvento,
  useEventoContract,
  useEventoPagamentos,
  useUpdateEvento,
} from "@/features/eventos";
import {
  getFinanceiroCategoriaLabel,
  useDeleteFinanceiroLancamento,
  useEventoFinanceiroSummary,
} from "@/features/financeiro";
import { formatIsoDateBR } from "@/lib/date";
import { toast } from "@/hooks/use-toast";

type PagamentoRecebidoItem =
  | {
      data: string;
      descricao: string;
      id: "entrada-contrato";
      kind: "entrada";
      valor: number;
    }
  | {
      data: string;
      descricao: string;
      id: string;
      kind: "pagamento";
      pagamentoId: number;
      valor: number;
    };

type PagamentoRecebidoDeleteTarget =
  | { descricao: string; kind: "entrada" }
  | { descricao: string; kind: "pagamento"; pagamentoId: number };

type ExpandedForm =
  | { type: "despesa" }
  | { type: "entrada-desconto" }
  | { type: "entrada-manual" }
  | { type: "pagamento-create" }
  | { type: "pagamento-edit"; itemId: string };

const EventoFinanceiro = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventoId = id ? Number(id) : null;
  const isValidEventoId = Number.isInteger(eventoId) && Number(eventoId) > 0;
  const validEventoId = isValidEventoId ? Number(eventoId) : null;

  const { data: event, error, isLoading } = useEvento(validEventoId);
  const { data: contract } = useEventoContract(validEventoId);
  const { data: payments = [] } = useEventoPagamentos(validEventoId);
  const { isLoading: isSummaryLoading, lancamentos, summary } = useEventoFinanceiroSummary(event);
  const deletePagamento = useDeleteEventoPagamento();
  const deleteLancamento = useDeleteFinanceiroLancamento();
  const updateEvento = useUpdateEvento();

  const [expandedForm, setExpandedForm] = useState<ExpandedForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PagamentoRecebidoDeleteTarget | null>(null);

  const adicionaisManuais = useMemo(
    () =>
      lancamentos.filter(
        (item) =>
          item.tipo === "entrada" &&
          item.origem === "manual" &&
          item.categoria !== "desconto" &&
          item.categoria !== "pagamento_contrato",
      ),
    [lancamentos],
  );

  const descontosManuais = useMemo(
    () =>
      lancamentos.filter(
        (item) => item.tipo === "entrada" && item.origem === "manual" && item.categoria === "desconto",
      ),
    [lancamentos],
  );

  const despesas = useMemo(
    () => lancamentos.filter((item) => item.tipo === "saida"),
    [lancamentos],
  );

  const pagamentosRecebidos = useMemo((): PagamentoRecebidoItem[] => {
    const items: PagamentoRecebidoItem[] = [];

    if (event && event.valor_entrada > 0) {
      items.push({
        data: getEventoEntradaReferenceDate(event),
        descricao: getEventoEntradaDescricao(event),
        id: "entrada-contrato",
        kind: "entrada",
        valor: event.valor_entrada,
      });
    }

    for (const payment of payments) {
      const detalhes = [payment.observacao?.trim(), payment.metodo?.trim()].filter(Boolean);
      items.push({
        data: payment.data_pagamento,
        descricao: detalhes.length > 0 ? detalhes.join(" · ") : "Pagamento",
        id: `pagamento-${payment.id}`,
        kind: "pagamento",
        pagamentoId: payment.id,
        valor: payment.valor,
      });
    }

    return items.sort((a, b) => b.data.localeCompare(a.data) || b.valor - a.valor);
  }, [event, payments]);

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
  const receivableTotal = summary?.entradaTotal ?? event.valor_total;
  const totalPaid = getEventDisplayTotalPaid(event, additionalPayments);
  const balance = getEventBalanceFromReceivable(event, receivableTotal, additionalPayments);

  const closeForm = () => setExpandedForm(null);

  const toggleForm = (type: ExpandedForm["type"]) => {
    setExpandedForm((current) => (current?.type === type ? null : ({ type } as ExpandedForm)));
  };

  const openEditPagamento = (item: PagamentoRecebidoItem) => {
    setExpandedForm({ itemId: item.id, type: "pagamento-edit" });
  };

  const getPagamentoFormTarget = (itemId: string): PagamentoRecebidoFormTarget | null => {
    if (itemId === "entrada-contrato") {
      return { evento, eventoId: validEventoId, kind: "entrada" };
    }

    const pagamentoId = Number(itemId.replace("pagamento-", ""));
    const pagamento = payments.find((payment) => payment.id === pagamentoId);

    if (!pagamento) {
      return null;
    }

    return { eventoId: validEventoId, kind: "pagamento", pagamento };
  };

  const openDeletePagamento = (item: PagamentoRecebidoItem) => {
    if (item.kind === "entrada") {
      setDeleteTarget({ descricao: item.descricao, kind: "entrada" });
      return;
    }

    setDeleteTarget({
      descricao: item.descricao,
      kind: "pagamento",
      pagamentoId: item.pagamentoId,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      if (deleteTarget.kind === "entrada") {
        await updateEvento.mutateAsync({
          eventoId: validEventoId,
          values: {
            forma_pagamento_entrada: null,
            valor_entrada: 0,
          },
        });
        toast({ title: "Entrada removida" });
      } else {
        await deletePagamento.mutateAsync({
          eventoId: validEventoId,
          id: deleteTarget.pagamentoId,
        });
        toast({ title: "Pagamento removido" });
      }

      if (expandedForm?.type === "pagamento-edit") {
        closeForm();
      }

      setDeleteTarget(null);
    } catch {
      toast({
        title: "Nao foi possivel remover",
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

  const pagamentoEditTarget =
    expandedForm?.type === "pagamento-edit" ? getPagamentoFormTarget(expandedForm.itemId) : null;

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
            <EventoContratoFinanceiroInfo
              contract={contract}
              descontoTotal={summary?.descontoTotal ?? 0}
              event={event}
              receivableTotal={receivableTotal}
              upsellTotal={summary?.upsellTotal ?? 0}
            />

            <AdicionaisSectionHeader
              descontoActive={expandedForm?.type === "entrada-desconto"}
              novoAdicionalActive={expandedForm?.type === "entrada-manual"}
              onDesconto={() => toggleForm("entrada-desconto")}
              onNovoAdicional={() => toggleForm("entrada-manual")}
            />

            {expandedForm?.type === "entrada-manual" ? (
              <LancamentoInlineForm
                eventoId={validEventoId}
                mode="entrada_evento"
                onCancel={closeForm}
                onSuccess={closeForm}
                variant="adicional"
              />
            ) : null}

            {expandedForm?.type === "entrada-desconto" ? (
              <LancamentoInlineForm
                eventoId={validEventoId}
                mode="entrada_evento"
                onCancel={closeForm}
                onSuccess={closeForm}
                variant="desconto"
              />
            ) : null}

            {adicionaisManuais.length === 0 ? (
              <EmptyLine text="Nenhum adicional contratado registrado." />
            ) : (
              adicionaisManuais.map((item) => (
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

            {descontosManuais.length > 0 ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descontos aplicados</p>
                {descontosManuais.map((item) => (
                  <LancamentoRow
                    key={item.id}
                    categoria={getFinanceiroCategoriaLabel(item.categoria)}
                    data={item.data_lancamento}
                    descricao={item.descricao}
                    negative
                    onDelete={() => handleDeleteLancamento(item.id)}
                    valor={item.valor}
                  />
                ))}
              </div>
            ) : null}

            <Separator />

            <SectionHeader
              actionActive={expandedForm?.type === "pagamento-create"}
              actionLabel="Registrar pagamento"
              onAction={() => toggleForm("pagamento-create")}
              title="Pagamentos recebidos"
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <InfoItem label="Total pago" value={formatFinanceiroCurrency(totalPaid)} />
              <InfoItem label="Saldo devedor" value={formatFinanceiroCurrency(balance)} negative={balance > 0} />
            </div>

            {expandedForm?.type === "pagamento-create" ? (
              <PagamentoRecebidoInlineForm
                onCancel={closeForm}
                onSuccess={closeForm}
                target={{ eventoId: validEventoId, kind: "create" }}
              />
            ) : null}

            {pagamentosRecebidos.length === 0 ? (
              <EmptyLine text="Nenhum pagamento registrado." />
            ) : (
              pagamentosRecebidos.map((item) => (
                <div key={item.id} className="space-y-2">
                  <PagamentoRecebidoRow
                    data={item.data}
                    descricao={item.descricao}
                    isEditing={expandedForm?.type === "pagamento-edit" && expandedForm.itemId === item.id}
                    onDelete={() => openDeletePagamento(item)}
                    onEdit={() => openEditPagamento(item)}
                    valor={item.valor}
                  />
                  {expandedForm?.type === "pagamento-edit" &&
                  expandedForm.itemId === item.id &&
                  pagamentoEditTarget ? (
                    <PagamentoRecebidoInlineForm
                      onCancel={closeForm}
                      onSuccess={closeForm}
                      target={pagamentoEditTarget}
                    />
                  ) : null}
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
            <SectionHeader
              actionActive={expandedForm?.type === "despesa"}
              actionLabel="Nova despesa"
              onAction={() => toggleForm("despesa")}
              title="Lancamentos"
            />

            {expandedForm?.type === "despesa" ? (
              <LancamentoInlineForm
                eventoId={validEventoId}
                mode="despesa_evento"
                onCancel={closeForm}
                onSuccess={closeForm}
                variant="despesa"
              />
            ) : null}

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

      <AlertDialog onOpenChange={(open) => !open && setDeleteTarget(null)} open={Boolean(deleteTarget)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remover "${deleteTarget.descricao}"? Esta acao nao pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePagamento.isPending || updateEvento.isPending}
              onClick={() => void handleConfirmDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

const AdicionaisSectionHeader = ({
  descontoActive = false,
  novoAdicionalActive = false,
  onDesconto,
  onNovoAdicional,
}: {
  descontoActive?: boolean;
  novoAdicionalActive?: boolean;
  onDesconto: () => void;
  onNovoAdicional: () => void;
}) => (
  <div className="flex items-center justify-between gap-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Novos adicionais contratados
    </p>
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        size="sm"
        variant={descontoActive ? "secondary" : "outline"}
        className="gap-2"
        onClick={onDesconto}
      >
        <Percent className="h-4 w-4" />
        Desconto
      </Button>
      <Button
        size="sm"
        variant={novoAdicionalActive ? "secondary" : "outline"}
        className="gap-2"
        onClick={onNovoAdicional}
      >
        <Plus className="h-4 w-4" />
        Novo adicional
      </Button>
    </div>
  </div>
);

const SectionHeader = ({
  actionActive = false,
  actionLabel,
  onAction,
  title,
}: {
  actionActive?: boolean;
  actionLabel: string;
  onAction: () => void;
  title: string;
}) => (
  <div className="flex items-center justify-between gap-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
    <Button
      size="sm"
      variant={actionActive ? "secondary" : "outline"}
      className="gap-2"
      onClick={onAction}
    >
      <Plus className="h-4 w-4" />
      {actionLabel}
    </Button>
  </div>
);

const EmptyLine = ({ text }: { text: string }) => (
  <p className="text-sm italic text-muted-foreground">{text}</p>
);

const PagamentoRecebidoRow = ({
  data,
  descricao,
  isEditing = false,
  onDelete,
  onEdit,
  valor,
}: {
  data: string;
  descricao: string;
  isEditing?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  valor: number;
}) => (
  <div
    className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 ${
      isEditing ? "border-primary/40 bg-primary/5" : "border-border/30 bg-muted/40"
    }`}
  >
    <div>
      <p className="text-sm font-medium text-foreground">{descricao}</p>
      <p className="text-xs text-muted-foreground">{formatIsoDateBR(data)}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{formatFinanceiroCurrency(valor)}</span>
      <Button size="icon" variant={isEditing ? "secondary" : "ghost"} className="h-8 w-8" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const LancamentoRow = ({
  categoria,
  data,
  descricao,
  negative = false,
  onDelete,
  valor,
}: {
  categoria: string;
  data: string;
  descricao: string | null;
  negative?: boolean;
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
      <span className={`text-sm font-medium ${negative ? "text-destructive" : ""}`}>
        {formatFinanceiroCurrency(valor)}
      </span>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default EventoFinanceiro;
