import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EventoContract } from "@/features/eventos/contracts/contract-types";
import { formatContractHashShort } from "@/features/eventos/contracts/contract-hash";
import { cn } from "@/lib/utils";

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
          <div
            className={cn(
              "px-6 py-5 text-sm leading-relaxed text-foreground",
              "[&_.contract-document_h1]:text-xl [&_.contract-document_h1]:font-bold [&_.contract-document_h1]:mb-4",
              "[&_.contract-document_h2]:text-base [&_.contract-document_h2]:font-semibold [&_.contract-document_h2]:mt-6 [&_.contract-document_h2]:mb-2",
              "[&_.contract-document_p]:mb-2",
              "[&_.contract-document_ul]:list-disc [&_.contract-document_ul]:pl-5 [&_.contract-document_ul]:mb-3",
              "[&_.contract-document_pre]:whitespace-pre-wrap [&_.contract-document_pre]:rounded-md [&_.contract-document_pre]:bg-muted/50 [&_.contract-document_pre]:p-3 [&_.contract-document_pre]:text-xs",
            )}
            dangerouslySetInnerHTML={{ __html: contract.contractHtml }}
          />
        ) : (
          <p className="px-6 py-8 text-sm text-muted-foreground">Nenhum contrato disponível.</p>
        )}
      </ScrollArea>
    </DialogContent>
  </Dialog>
);
