import { useState } from "react";
import { CheckCircle2, FileText, RefreshCw, ShieldCheck } from "lucide-react";

import { ContractAcceptanceDialog } from "@/components/eventos/ContractAcceptanceDialog";
import { ContractViewDialog } from "@/components/eventos/ContractViewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatContractHashShort } from "@/features/eventos/contracts/contract-hash";
import {
  useEventoContract,
  useEventoContractAcceptance,
  useGenerateEventoContract,
} from "@/features/eventos/use-evento-contract";
import { Evento } from "@/features/eventos/types";
import { toast } from "@/hooks/use-toast";

interface EventoContractCardProps {
  evento: Evento;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const EventoContractCard = ({ evento }: EventoContractCardProps) => {
  const { data: contract, isLoading, refetch } = useEventoContract(evento.id);
  const { data: acceptance } = useEventoContractAcceptance(contract?.id ?? null);
  const generateContract = useGenerateEventoContract();

  const [viewOpen, setViewOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateContract.mutateAsync(evento);
      toast({
        title: contract ? "Contrato regerado com sucesso." : "Contrato gerado com sucesso.",
      });
      void refetch();
    } catch (error) {
      toast({
        title: "Não foi possível gerar o contrato.",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const statusBadge =
    contract?.status === "accepted" ? (
      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15">
        Aceito
      </Badge>
    ) : contract?.status === "generated" ? (
      <Badge variant="outline" className="border-warning/50 text-warning">
        Aguardando aceite
      </Badge>
    ) : null;

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-festa-blue" />
              Contrato da Festa
            </CardTitle>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground italic">Carregando contrato...</p>
          )}

          {!isLoading && !contract && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Gere o contrato formal com os dados de fechamento, pacote, adicionais, pagamento e termos
                configurados para esta festa.
              </p>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleGenerate}
                disabled={generateContract.isPending}
              >
                <FileText className="w-4 h-4" />
                {generateContract.isPending ? "Gerando..." : "Gerar contrato"}
              </Button>
            </div>
          )}

          {!isLoading && contract && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Número</p>
                  <p className="font-medium">{contract.contractNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Gerado em</p>
                  <p className="font-medium">{formatDateTime(contract.generatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Hash</p>
                  <p className="font-mono text-xs">{formatContractHashShort(contract.contractHash)}</p>
                </div>
                {contract.status === "accepted" && contract.acceptedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Aceito em</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      {formatDateTime(contract.acceptedAt)}
                    </p>
                  </div>
                )}
              </div>

              {contract.status === "accepted" && acceptance && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Aceite registrado
                  </p>
                  <p className="text-sm">
                    <strong>{acceptance.acceptedByName}</strong>
                    {acceptance.acceptedByCpf && ` · CPF ${acceptance.acceptedByCpf}`}
                  </p>
                  {(acceptance.acceptedByEmail || acceptance.acceptedByPhone) && (
                    <p className="text-xs text-muted-foreground">
                      {[acceptance.acceptedByEmail, acceptance.acceptedByPhone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setViewOpen(true)}>
                  <FileText className="w-4 h-4" />
                  Visualizar contrato
                </Button>

                {contract.status === "generated" && (
                  <>
                    <Button size="sm" className="gap-2" onClick={() => setAcceptOpen(true)}>
                      <CheckCircle2 className="w-4 h-4" />
                      Registrar aceite
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2"
                      onClick={handleGenerate}
                      disabled={generateContract.isPending}
                    >
                      <RefreshCw className="w-4 h-4" />
                      {generateContract.isPending ? "Regerando..." : "Regerar contrato"}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ContractViewDialog contract={contract ?? null} open={viewOpen} onOpenChange={setViewOpen} />

      {contract && contract.status === "generated" && (
        <ContractAcceptanceDialog
          contract={contract}
          evento={evento}
          open={acceptOpen}
          onOpenChange={setAcceptOpen}
          onSuccess={() => void refetch()}
        />
      )}
    </>
  );
};

export const shouldShowEventoContractCard = (evento: Evento): boolean =>
  Boolean(evento.fechamento_confirmado_em) || evento.funil === "festa";
