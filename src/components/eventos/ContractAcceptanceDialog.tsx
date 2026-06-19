import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileSignature } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useTenantAcceptanceTerms, isSigningPhaseTerm } from "@/features/configuracoes";
import {
  CONTRACT_ACCEPTANCE_DECLARATION,
  type EventoContract,
} from "@/features/eventos/contracts/contract-types";
import { useAcceptEventoContract } from "@/features/eventos/use-evento-contract";
import { Evento } from "@/features/eventos/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ContractAcceptanceDialogProps {
  contract: EventoContract;
  evento: Evento;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
}

export const ContractAcceptanceDialog = ({
  contract,
  evento,
  onOpenChange,
  onSuccess,
  open,
}: ContractAcceptanceDialogProps) => {
  const { data: terms = [], isLoading: isTermsLoading } = useTenantAcceptanceTerms();
  const acceptContract = useAcceptEventoContract();

  const contractTerms = useMemo(
    () =>
      terms
        .filter((term) => isSigningPhaseTerm(term))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [terms],
  );

  const [acceptedByName, setAcceptedByName] = useState(evento.cliente_nome ?? "");
  const [acceptedByCpf, setAcceptedByCpf] = useState(evento.cliente_cpf ?? "");
  const [acceptedByEmail, setAcceptedByEmail] = useState(evento.cliente_email ?? "");
  const [acceptedByPhone, setAcceptedByPhone] = useState(evento.cliente_telefone ?? "");
  const [acceptanceText, setAcceptanceText] = useState(CONTRACT_ACCEPTANCE_DECLARATION);
  const [termAcceptances, setTermAcceptances] = useState<Record<string, boolean>>({});
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setAcceptedByName(evento.cliente_nome ?? "");
    setAcceptedByCpf(evento.cliente_cpf ?? "");
    setAcceptedByEmail(evento.cliente_email ?? "");
    setAcceptedByPhone(evento.cliente_telefone ?? "");
    setAcceptanceText(CONTRACT_ACCEPTANCE_DECLARATION);
    setDeclarationAccepted(false);

    const initial: Record<string, boolean> = {};
    contractTerms.forEach((term) => {
      initial[term.id] = false;
    });
    setTermAcceptances(initial);
  }, [contractTerms, evento, open]);

  const toggleTerm = (termId: string, checked: boolean) => {
    setTermAcceptances((current) => ({ ...current, [termId]: checked }));
  };

  const requiredTermsMissing = contractTerms.some(
    (term) => term.isRequired && !termAcceptances[term.id],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!acceptedByName.trim()) {
      toast({ title: "Informe o nome do aceitante.", variant: "destructive" });
      return;
    }

    if (!declarationAccepted) {
      toast({ title: "Confirme a declaração de aceite.", variant: "destructive" });
      return;
    }

    if (requiredTermsMissing) {
      toast({ title: "Aceite todos os termos obrigatórios.", variant: "destructive" });
      return;
    }

    try {
      await acceptContract.mutateAsync({
        acceptedByCpf: acceptedByCpf.trim() || undefined,
        acceptedByEmail: acceptedByEmail.trim() || undefined,
        acceptedByName: acceptedByName.trim(),
        acceptedByPhone: acceptedByPhone.trim() || undefined,
        acceptanceText,
        contractId: contract.id,
        eventoId: evento.id,
        termAcceptances: contractTerms.map((term) => ({
          accepted: termAcceptances[term.id] ?? false,
          termId: Number(term.id),
        })),
      });

      toast({ title: "Contrato aceito com sucesso." });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Não foi possível registrar o aceite.",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-festa-blue" />
            Aceitar contrato da festa
          </DialogTitle>
          <DialogDescription>
            Registre o aceite formal do contrato {contract.contractNumber}. O conteúdo abaixo é o snapshot
            congelado no momento da geração.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 max-h-[calc(90vh-14rem)]">
            <div className="px-6 py-4 space-y-6">
              <div
                className={cn(
                  "rounded-lg border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed",
                  "[&_.contract-document_h1]:text-lg [&_.contract-document_h1]:font-bold [&_.contract-document_h1]:mb-3",
                  "[&_.contract-document_h2]:text-sm [&_.contract-document_h2]:font-semibold [&_.contract-document_h2]:mt-4 [&_.contract-document_h2]:mb-1",
                  "[&_.contract-document_pre]:whitespace-pre-wrap [&_.contract-document_pre]:text-xs",
                )}
                dangerouslySetInnerHTML={{ __html: contract.contractHtml }}
              />

              <div className="space-y-4 rounded-lg border border-border/60 p-4">
                <p className="text-sm font-medium">Dados do aceitante</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="accepted-by-name">Nome completo *</Label>
                    <Input
                      id="accepted-by-name"
                      value={acceptedByName}
                      onChange={(e) => setAcceptedByName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="accepted-by-cpf">CPF</Label>
                    <Input
                      id="accepted-by-cpf"
                      value={acceptedByCpf}
                      onChange={(e) => setAcceptedByCpf(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="accepted-by-phone">Telefone</Label>
                    <Input
                      id="accepted-by-phone"
                      value={acceptedByPhone}
                      onChange={(e) => setAcceptedByPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="accepted-by-email">E-mail</Label>
                    <Input
                      id="accepted-by-email"
                      type="email"
                      value={acceptedByEmail}
                      onChange={(e) => setAcceptedByEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {!isTermsLoading && contractTerms.length > 0 && (
                <div className="space-y-3 rounded-lg border border-border/60 p-4">
                  <p className="text-sm font-medium">Termos do contrato</p>
                  {contractTerms.map((term) => (
                    <label
                      key={term.id}
                      className="flex items-start gap-3 rounded-md border border-border/40 p-3 cursor-pointer hover:bg-muted/30"
                    >
                      <Checkbox
                        checked={termAcceptances[term.id] ?? false}
                        onCheckedChange={(checked) => toggleTerm(term.id, checked === true)}
                        className="mt-0.5"
                      />
                      <span className="space-y-1">
                        <span className="text-sm font-medium block">
                          {term.title}
                          {term.isRequired && <span className="text-destructive ml-1">*</span>}
                        </span>
                        <span className="text-xs text-muted-foreground block whitespace-pre-wrap">
                          {term.content}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="acceptance-text">Declaração de aceite</Label>
                <Textarea
                  id="acceptance-text"
                  value={acceptanceText}
                  onChange={(e) => setAcceptanceText(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={declarationAccepted}
                    onCheckedChange={(checked) => setDeclarationAccepted(checked === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground">
                    Confirmo que o aceitante leu e concorda com a declaração acima e com o contrato exibido.
                  </span>
                </label>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t border-border/60">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={acceptContract.isPending}>
              {acceptContract.isPending ? "Registrando..." : "Confirmar aceite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
