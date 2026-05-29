import { useNavigate } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, FileText } from "lucide-react";

import { ContractStatusBadge } from "@/features/eventos/contracts/contract-status";
import { formatContractHashShort } from "@/features/eventos/contracts/contract-hash";
import {
  useEventoContract,
  useEventoContractAcceptance,
  useGenerateEventoContract,
} from "@/features/eventos/use-evento-contract";
import { Evento } from "@/features/eventos/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const navigate = useNavigate();
  const { data: contract, isLoading } = useEventoContract(evento.id);
  const { data: acceptance } = useEventoContractAcceptance(contract?.id ?? null);
  const generateContract = useGenerateEventoContract();

  const handleGenerate = async () => {
    try {
      const generated = await generateContract.mutateAsync(evento);
      toast({
        title: contract ? "Contrato regerado com sucesso." : "Contrato gerado com sucesso.",
      });
      navigate(`/contratos/${generated.id}`);
    } catch (error) {
      toast({
        title: "Não foi possível gerar o contrato.",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-festa-blue" />
            Contrato da Festa
          </CardTitle>
          {contract && <ContractStatusBadge status={contract.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground italic">Carregando contrato...</p>
        )}

        {!isLoading && !contract && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gere o contrato formal com os dados de fechamento. A gestão completa fica na área de
              Contratos.
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
                    {acceptance?.acceptedByName && (
                      <span className="text-muted-foreground font-normal">· {acceptance.acceptedByName}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => navigate(`/contratos/${contract.id}`)}
              >
                <ArrowUpRight className="w-4 h-4" />
                Abrir contrato
              </Button>

              {contract.status === "generated" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleGenerate}
                  disabled={generateContract.isPending}
                >
                  {generateContract.isPending ? "Regerando..." : "Regerar contrato"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const shouldShowEventoContractCard = (evento: Evento): boolean =>
  Boolean(evento.fechamento_confirmado_em) || evento.funil === "festa";
