import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import type { EventoContract } from "@/features/eventos/contracts/contract-types";
import { formatContractHashShort } from "@/features/eventos/contracts/contract-hash";

interface ContractViewDialogProps {
  contract: EventoContract | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const ContractViewDialog = ({ contract, onOpenChange, open }: ContractViewDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
      <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
        <DialogTitle>Contrato da festa</DialogTitle>
        <DialogDescription>
          {contract
            ? `${contract.contractNumber} · Gerado em ${formatDateTime(contract.generatedAt)}`
            : "Visualização do contrato gerado."}
        </DialogDescription>
      </DialogHeader>

      {contract && (
        <div className="px-6 py-3 border-b border-border/40 bg-muted/30 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Status:{" "}
            <strong className="text-foreground">
              {contract.status === "accepted" ? "Aceito" : "Aguardando aceite"}
            </strong>
          </span>
          {contract.acceptedAt && (
            <span>
              Aceito em: <strong className="text-foreground">{formatDateTime(contract.acceptedAt)}</strong>
            </span>
          )}
          <span>
            Hash: <code className="text-foreground">{formatContractHashShort(contract.contractHash)}</code>
          </span>
        </div>
      )}

      <ScrollArea className="flex-1 max-h-[calc(90vh-10rem)]">
        {contract ? (
          <div className="px-6 py-5">
            <ContractDocumentView html={contract.contractHtml} />
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-muted-foreground">Nenhum contrato disponível.</p>
        )}
      </ScrollArea>
    </DialogContent>
  </Dialog>
);
