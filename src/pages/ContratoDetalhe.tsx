import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { ContractModuleGate } from "@/components/contracts/ContractModuleGate";
import { ContractAcceptanceDialog } from "@/components/eventos/ContractAcceptanceDialog";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { ContractStatusBadge } from "@/features/eventos/contracts/contract-status";
import { formatContractHashShort } from "@/features/eventos/contracts/contract-hash";
import { useEvento } from "@/features/eventos/use-evento";
import {
  useGenerateEventoContract,
} from "@/features/eventos/use-evento-contract";
import {
  useContractAcceptance,
  useContractById,
  useEventoContractHistory,
} from "@/features/eventos/use-tenant-contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return "—";
  return value.slice(0, 5);
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-medium">{value}</p>
  </div>
);

const ContratoDetalhe = () => {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const numericContractId = contractId ? Number(contractId) : null;

  const { data: contract, error, isLoading } = useContractById(numericContractId);
  const eventoId = contract ? Number(contract.eventoId) : null;
  const { data: evento } = useEvento(eventoId);
  const { data: acceptance } = useContractAcceptance(contract?.id ?? null);
  const { data: history = [] } = useEventoContractHistory(eventoId);
  const generateContract = useGenerateEventoContract();

  const [acceptOpen, setAcceptOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("acao") === "aceite" && contract?.status === "generated") {
      setAcceptOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [contract?.status, searchParams, setSearchParams]);

  const summary = useMemo(() => {
    if (!contract) return null;

    const snap = contract.contractSnapshot.evento as Record<string, unknown>;

    return {
      adicionais: formatCurrency(
        typeof snap.valor_adicionais === "number" ? snap.valor_adicionais : evento?.valor_adicionais,
      ),
      aniversariante:
        evento?.aniversariante_nome ??
        (typeof snap.aniversariante_nome === "string" ? snap.aniversariante_nome : "—"),
      cliente:
        evento?.cliente_nome ?? (typeof snap.cliente_nome === "string" ? snap.cliente_nome : "—"),
      dataEvento: formatDate(evento?.data_evento ?? (typeof snap.data_evento === "string" ? snap.data_evento : null)),
      entrada: formatCurrency(
        typeof snap.valor_entrada === "number" ? snap.valor_entrada : evento?.valor_entrada,
      ),
      formaEntrada:
        evento?.forma_pagamento_entrada ??
        (typeof snap.forma_pagamento_entrada === "string" ? snap.forma_pagamento_entrada : "—"),
      formaSaldo:
        evento?.forma_pagamento_saldo ??
        (typeof snap.forma_pagamento_saldo === "string" ? snap.forma_pagamento_saldo : "—"),
      horaEvento: formatTime(evento?.hora_evento ?? (typeof snap.hora_evento === "string" ? snap.hora_evento : null)),
      horaTermino: formatTime(
        evento?.hora_termino ?? (typeof snap.hora_termino === "string" ? snap.hora_termino : null),
      ),
      pacote:
        evento?.pacote_nome ??
        contract.contractSnapshot.package?.name ??
        (typeof snap.pacote_nome === "string" ? snap.pacote_nome : "—"),
      saldo: formatCurrency(typeof snap.valor_saldo === "number" ? snap.valor_saldo : evento?.valor_saldo),
      total: formatCurrency(typeof snap.valor_total === "number" ? snap.valor_total : evento?.valor_total),
    };
  }, [contract, evento]);

  const historyItems = history.filter((item) => item.id !== contract?.id);

  const handleRegenerate = async () => {
    if (!evento || !contract || contract.status !== "generated") return;

    try {
      const regenerated = await generateContract.mutateAsync(evento);
      toast({ title: "Contrato regerado com sucesso." });
      navigate(`/contratos/${regenerated.id}`);
    } catch (regenerateError) {
      toast({
        title: "Não foi possível regerar o contrato.",
        description: regenerateError instanceof Error ? regenerateError.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <ContractModuleGate>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Carregando contrato...
          </div>
        </ContractModuleGate>
      </AppLayout>
    );
  }

  if (error || !contract) {
    return (
      <AppLayout>
        <ContractModuleGate>
          <div className="space-y-4">
            <Button variant="ghost" className="gap-2" onClick={() => navigate("/contratos")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Contrato não encontrado ou indisponível.
            </div>
          </div>
        </ContractModuleGate>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ContractModuleGate>
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/contratos")}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <ContractStatusBadge status={contract.status} />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{contract.contractNumber}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cliente: <strong className="text-foreground">{summary?.cliente}</strong>
              {summary?.aniversariante !== "—" && (
                <>
                  {" "}
                  · Aniversariante: <strong className="text-foreground">{summary.aniversariante}</strong>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gerado em {formatDateTime(contract.generatedAt)} · Hash{" "}
              <code>{formatContractHashShort(contract.contractHash)}</code>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" asChild>
              <Link to={`/crm/evento/${contract.eventoId}`}>
                <ExternalLink className="h-4 w-4" />
                Abrir evento
              </Link>
            </Button>
            {contract.status === "generated" && evento && (
              <>
                <Button className="gap-2" onClick={() => setAcceptOpen(true)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Registrar aceite
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleRegenerate}
                  disabled={generateContract.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                  {generateContract.isPending ? "Regerando..." : "Regerar contrato"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Resumo da contratação</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <InfoItem label="Contratante" value={summary?.cliente ?? "—"} />
              <InfoItem label="Aniversariante" value={summary?.aniversariante ?? "—"} />
              <InfoItem label="Data da festa" value={summary?.dataEvento ?? "—"} />
              <InfoItem
                label="Horário"
                value={`${summary?.horaEvento ?? "—"} às ${summary?.horaTermino ?? "—"}`}
              />
              <InfoItem label="Pacote" value={summary?.pacote ?? "—"} />
              <InfoItem label="Valor total" value={summary?.total ?? "—"} />
              <InfoItem label="Entrada" value={summary?.entrada ?? "—"} />
              <InfoItem label="Saldo" value={summary?.saldo ?? "—"} />
              <InfoItem label="Adicionais" value={summary?.adicionais ?? "—"} />
              <InfoItem label="Pagamento entrada" value={summary?.formaEntrada ?? "—"} />
              <InfoItem label="Pagamento saldo" value={summary?.formaSaldo ?? "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Aceite formal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {contract.status === "generated" && (
                <p className="text-muted-foreground">
                  Este contrato ainda não foi aceito formalmente. Registre o aceite quando o cliente confirmar
                  as condições.
                </p>
              )}

              {contract.status === "accepted" && acceptance && (
                <div className="space-y-3">
                  <InfoItem label="Aceito em" value={formatDateTime(acceptance.acceptedAt)} />
                  <InfoItem label="Aceitante" value={acceptance.acceptedByName} />
                  <InfoItem label="CPF" value={acceptance.acceptedByCpf ?? "—"} />
                  <InfoItem label="E-mail" value={acceptance.acceptedByEmail ?? "—"} />
                  <InfoItem label="Telefone" value={acceptance.acceptedByPhone ?? "—"} />
                  <Separator />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Evidências</p>
                    <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                      {acceptance.acceptanceText}
                    </p>
                    {acceptance.userAgent && (
                      <p className="mt-2 text-[11px] text-muted-foreground break-all">
                        User agent: {acceptance.userAgent}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {contract.status === "accepted" && !acceptance && (
                <p className="text-muted-foreground">Aceite registrado, mas detalhes não disponíveis.</p>
              )}
            </CardContent>
          </Card>

          {historyItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Histórico do evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.contractNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.generatedAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ContractStatusBadge status={item.status} />
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link to={`/contratos/${item.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documento do contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-muted/20 p-4 sm:p-6">
              <div className="mx-auto max-w-3xl rounded-xl border border-border/60 bg-white p-6 shadow-sm sm:p-8">
                <ContractDocumentView html={contract.contractHtml} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {evento && contract.status === "generated" && (
        <ContractAcceptanceDialog
          contract={contract}
          evento={evento}
          open={acceptOpen}
          onOpenChange={setAcceptOpen}
          onSuccess={() => navigate(`/contratos/${contract.id}`, { replace: true })}
        />
      )}
      </ContractModuleGate>
    </AppLayout>
  );
};

export default ContratoDetalhe;
