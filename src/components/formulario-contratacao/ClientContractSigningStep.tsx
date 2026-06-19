import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileSignature, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  useAcceptClientContract,
  type ClientContractAcceptResult,
  type ClientContractFormSubmitResult,
  type PublicAcceptanceTerm,
} from "@/features/public-contract-form";
import { CONTRACT_ACCEPTANCE_DECLARATION } from "@/features/eventos/contracts/contract-types";
import { cn } from "@/lib/utils";

interface ClientContractSigningStepProps {
  onSuccess?: (result: ClientContractAcceptResult) => void;
  submitResult: ClientContractFormSubmitResult;
  tenantSlug: string;
}

export const ClientContractSigningStep = ({
  onSuccess,
  submitResult,
  tenantSlug,
}: ClientContractSigningStepProps) => {
  const acceptContract = useAcceptClientContract();

  const signingTerms = useMemo(
    () => submitResult.signingTerms.filter((term) => term.active),
    [submitResult.signingTerms],
  );

  const [acceptedByName, setAcceptedByName] = useState(submitResult.clientName ?? "");
  const [acceptedByCpf, setAcceptedByCpf] = useState(submitResult.clientCpf ?? "");
  const [acceptedByEmail, setAcceptedByEmail] = useState(submitResult.clientEmail ?? "");
  const [acceptedByPhone, setAcceptedByPhone] = useState(submitResult.clientPhone ?? "");
  const [acceptanceText, setAcceptanceText] = useState(CONTRACT_ACCEPTANCE_DECLARATION);
  const [termAcceptances, setTermAcceptances] = useState<Record<string, boolean>>({});
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    signingTerms.forEach((term) => {
      initial[term.id] = false;
    });
    setTermAcceptances(initial);
  }, [signingTerms]);

  const toggleTerm = (termId: string, checked: boolean) => {
    setTermAcceptances((current) => ({ ...current, [termId]: checked }));
  };

  const requiredTermsMissing = signingTerms.some(
    (term) => term.isRequired && !termAcceptances[term.id],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!acceptedByName.trim()) {
      setError("Informe seu nome completo para assinar o contrato.");
      return;
    }

    if (!declarationAccepted) {
      setError("Confirme a declaração de aceite para continuar.");
      return;
    }

    if (requiredTermsMissing) {
      setError("Aceite todos os termos obrigatórios antes de assinar.");
      return;
    }

    const clientPhone = submitResult.clientPhone ?? acceptedByPhone;
    if (!clientPhone?.trim()) {
      setError("Telefone do cadastro não encontrado. Volte ao formulário e informe seu telefone.");
      return;
    }

    try {
      const result = await acceptContract.mutateAsync({
        acceptedByCpf: acceptedByCpf.trim() || undefined,
        acceptedByEmail: acceptedByEmail.trim() || undefined,
        acceptedByName: acceptedByName.trim(),
        acceptedByPhone: acceptedByPhone.trim() || undefined,
        acceptanceText,
        clientPhone: clientPhone.trim(),
        contractId: submitResult.contractId,
        eventoId: submitResult.eventoId,
        tenantSlug,
        termAcceptances: signingTerms.map((term) => ({
          accepted: termAcceptances[term.id] ?? false,
          termId: Number(term.id),
        })),
      });

      onSuccess?.(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível assinar o contrato.");
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/40 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-2 mb-2">
            <FileSignature className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-lg font-semibold text-foreground">Assinatura do contrato</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Contrato <span className="font-medium text-foreground">{submitResult.contractNumber}</span>.
            Leia atentamente o documento abaixo e confirme sua assinatura eletrônica.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <ScrollArea className="h-[min(60vh,520px)] rounded-xl border border-border/60 bg-muted/10">
            <div
              className={cn(
                "p-5 text-sm leading-relaxed",
                "[&_.contract-document_h1]:text-lg [&_.contract-document_h1]:font-bold [&_.contract-document_h1]:mb-3",
                "[&_.contract-document_h2]:text-sm [&_.contract-document_h2]:font-semibold [&_.contract-document_h2]:mt-4 [&_.contract-document_h2]:mb-1",
                "[&_.contract-document_pre]:whitespace-pre-wrap [&_.contract-document_pre]:text-xs",
              )}
              dangerouslySetInnerHTML={{ __html: submitResult.contractHtml }}
            />
          </ScrollArea>

          <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-4">
            <p className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
              Dados do signatário
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="signing-name">Nome completo *</Label>
                <Input
                  id="signing-name"
                  value={acceptedByName}
                  onChange={(event) => setAcceptedByName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signing-cpf">CPF</Label>
                <Input
                  id="signing-cpf"
                  value={acceptedByCpf}
                  onChange={(event) => setAcceptedByCpf(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signing-phone">Telefone</Label>
                <Input
                  id="signing-phone"
                  value={acceptedByPhone}
                  onChange={(event) => setAcceptedByPhone(event.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="signing-email">E-mail</Label>
                <Input
                  id="signing-email"
                  type="email"
                  value={acceptedByEmail}
                  onChange={(event) => setAcceptedByEmail(event.target.value)}
                />
              </div>
            </div>
          </div>

          {signingTerms.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Aceite do contrato</p>
              {signingTerms.map((term: PublicAcceptanceTerm) => (
                <label
                  key={term.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3 cursor-pointer"
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
            <Label htmlFor="signing-declaration">Declaração de aceite</Label>
            <Textarea
              id="signing-declaration"
              value={acceptanceText}
              onChange={(event) => setAcceptanceText(event.target.value)}
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
                Confirmo que li integralmente o contrato acima, compreendi todas as cláusulas e concordo
                com os termos estabelecidos. Autorizo o registro desta assinatura eletrônica com data, hora,
                endereço IP e demais evidências legais.
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full sm:w-auto" disabled={acceptContract.isPending}>
            {acceptContract.isPending ? "Registrando assinatura..." : "Assinar contrato"}
          </Button>
        </div>
      </div>
    </form>
  );
};
