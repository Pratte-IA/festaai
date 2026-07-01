import { FormEvent, useState } from "react";
import { FileSignature, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  useAcceptClientContract,
  type ClientContractAcceptResult,
  type ClientContractFormSubmitResult,
} from "@/features/public-contract-form";
import { CONTRACT_ACCEPTANCE_DECLARATION } from "@/features/eventos/contracts/contract-types";
import { toBrazilPhoneInputValue } from "@/lib/phone";
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

  const [acceptedByName, setAcceptedByName] = useState(submitResult.clientName ?? "");
  const [acceptedByCpf, setAcceptedByCpf] = useState(submitResult.clientCpf ?? "");
  const [acceptedByEmail, setAcceptedByEmail] = useState(submitResult.clientEmail ?? "");
  const [acceptedByPhone, setAcceptedByPhone] = useState(
    toBrazilPhoneInputValue(submitResult.clientPhone),
  );
  const [acceptanceText, setAcceptanceText] = useState(CONTRACT_ACCEPTANCE_DECLARATION);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        termAcceptances: submitResult.signingTerms
          .filter((term) => term.active)
          .map((term) => ({
            accepted: true,
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
                <PhoneInput
                  id="signing-phone"
                  value={acceptedByPhone}
                  onChange={setAcceptedByPhone}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
