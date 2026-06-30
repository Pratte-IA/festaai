import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PublicCheckoutStatus,
  useActivateSubscriptionCheckout,
  useCreateSetupPayment,
  usePaymentCheckoutDetails,
} from "@/features/billing";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { contratarCtaGradientClass, formatContratarBRL } from "@/pages/contratar-commercial-data";

import { CheckoutStepIndicator } from "./CheckoutStepIndicator";
import { InlinePaymentPanel } from "./InlinePaymentPanel";

interface CommercialCheckoutWizardProps {
  checkout: PublicCheckoutStatus;
  className?: string;
  externalReference: string;
  isPolling?: boolean;
}

const resolveWizardStep = (phase: PublicCheckoutStatus["checkoutPhase"]): 1 | 2 | 3 | 4 => {
  if (phase === "completed") return 4;
  if (phase === "subscription_pending") return 3;
  if (phase === "setup_paid") return 2;
  return 1;
};

export const CommercialCheckoutWizard = ({
  checkout,
  className,
  externalReference,
  isPolling = false,
}: CommercialCheckoutWizardProps) => {
  const createSetupPayment = useCreateSetupPayment();
  const activateSubscription = useActivateSubscriptionCheckout();
  const [chosenInstallments, setChosenInstallments] = useState(
    checkout.selectedSetupInstallments ?? checkout.maxSetupInstallments,
  );
  const [hasTriggeredActivation, setHasTriggeredActivation] = useState(false);

  const wizardStep = resolveWizardStep(checkout.checkoutPhase);
  const allowsInstallmentChoice = checkout.maxSetupInstallments > 1;
  const activeInstallments = checkout.selectedSetupInstallments ?? chosenInstallments;
  const hasSetupPayment = Boolean(checkout.setupPaymentId);

  const setupDetails = usePaymentCheckoutDetails(
    externalReference,
    "setup",
    wizardStep === 1 && hasSetupPayment,
  );

  const subscriptionDetails = usePaymentCheckoutDetails(
    externalReference,
    "subscription",
    wizardStep === 3 && Boolean(checkout.subscriptionPaymentId),
  );

  const installmentOptions = useMemo(
    () => Array.from({ length: checkout.maxSetupInstallments }, (_, index) => index + 1),
    [checkout.maxSetupInstallments],
  );

  const previewInstallmentValue = useMemo(() => {
    if (!checkout.setupPrice || checkout.setupPrice <= 0) return null;
    return checkout.setupPrice / activeInstallments;
  }, [activeInstallments, checkout.setupPrice]);

  const displayInstallmentValue = checkout.setupInstallmentValue ?? previewInstallmentValue;

  useEffect(() => {
    setChosenInstallments(checkout.selectedSetupInstallments ?? checkout.maxSetupInstallments);
  }, [checkout.maxSetupInstallments, checkout.selectedSetupInstallments]);

  const generateSetupPayment = async (installments: number) => {
    try {
      await createSetupPayment.mutateAsync({
        externalReference,
        setupInstallments: installments,
      });
    } catch (error) {
      toast({
        title: "Não foi possível gerar a cobrança",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (wizardStep !== 1 || hasSetupPayment || checkout.maxSetupInstallments !== 1) return;
    void generateSetupPayment(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalReference, hasSetupPayment, wizardStep, checkout.maxSetupInstallments]);

  useEffect(() => {
    if (wizardStep !== 2 || hasTriggeredActivation || activateSubscription.isPending) return;

    setHasTriggeredActivation(true);
    void activateSubscription.mutateAsync(externalReference).catch((error) => {
      setHasTriggeredActivation(false);
      toast({
        title: "Não foi possível iniciar a mensalidade",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    });
  }, [activateSubscription, externalReference, hasTriggeredActivation, wizardStep]);

  return (
    <div className={cn("space-y-8", className)}>
      <CheckoutStepIndicator activeStep={wizardStep} />

      <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5158e7]/20">
            <ShieldCheck className="h-5 w-5 text-[#8b9dff]" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Pagamento seguro</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Você paga a implementação, efetivamos seu cadastro e, em seguida, conclui a
              mensalidade — tudo aqui no FestaAI.
            </p>
          </div>
        </div>
      </div>

      {(checkout.setupPrice != null || checkout.monthlyPrice != null) && wizardStep < 4 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {checkout.setupPrice != null && checkout.setupPrice > 0 ? (
            <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Implementação</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">
                {formatContratarBRL(checkout.setupPrice)}
              </p>
              <p className="text-xs text-zinc-500">
                {checkout.maxSetupInstallments > 1
                  ? `em até ${checkout.maxSetupInstallments}x · `
                  : null}
                cobrança única · depois, só mensalidade
              </p>
            </div>
          ) : null}
          {checkout.monthlyPrice != null ? (
            <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mensalidade</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">
                {formatContratarBRL(Number(checkout.monthlyPrice))}
              </p>
              {checkout.subscriptionMaxPayments != null && checkout.subscriptionCommitmentTotal != null ? (
                <p className="text-xs text-zinc-500">
                  {checkout.subscriptionMaxPayments}x de {formatContratarBRL(Number(checkout.monthlyPrice))} (
                  {formatContratarBRL(checkout.subscriptionCommitmentTotal)} no total)
                </p>
              ) : (
                <p className="text-xs text-zinc-500">renovação automática mensal</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {wizardStep === 1 && checkout.setupPrice != null && checkout.setupPrice > 0 ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#5158e7]/30 bg-[#5158e7]/10 p-5 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#8b9dff]">
                Passo 1 — Implementação (setup)
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                Total:{" "}
                <span className="font-semibold text-white">
                  {formatContratarBRL(checkout.setupPrice)}
                </span>
                {checkout.setupPaymentMethods ? (
                  <span className="mt-1 block text-xs text-zinc-400">{checkout.setupPaymentMethods}</span>
                ) : null}
              </p>
            </div>

            {allowsInstallmentChoice && !hasSetupPayment ? (
              <div className="space-y-2">
                <Label htmlFor="setup-installments" className="text-zinc-200">
                  Parcelar em quantas vezes?
                </Label>
                <Select
                  value={String(chosenInstallments)}
                  onValueChange={(value) => setChosenInstallments(Number(value))}
                >
                  <SelectTrigger
                    id="setup-installments"
                    className="border-white/15 bg-[#07070c] text-white"
                  >
                    <SelectValue placeholder="Selecione o parcelamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}x de {formatContratarBRL(checkout.setupPrice! / option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {displayInstallmentValue != null ? (
              <div className="rounded-lg border border-white/10 bg-[#07070c]/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Valor da parcela</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {formatContratarBRL(displayInstallmentValue)}
                </p>
              </div>
            ) : null}

            {!hasSetupPayment ? (
              createSetupPayment.isPending ? (
                <div className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md text-sm text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Gerando cobrança...
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => void generateSetupPayment(chosenInstallments)}
                  className={cn("min-h-[48px] w-full border-0", contratarCtaGradientClass)}
                >
                  Gerar cobrança da implementação
                </Button>
              )
            ) : null}
          </div>

          {hasSetupPayment ? (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {isPolling ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                <span>Aguardando confirmação do pagamento da implementação.</span>
              </div>
              <InlinePaymentPanel
                details={setupDetails.data}
                externalReference={externalReference}
                isLoading={setupDetails.isLoading}
                paymentKind="setup"
                title="Pague a implementação"
              />
            </>
          ) : null}
        </div>
      ) : null}

      {wizardStep === 2 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <Building2 className="h-7 w-7 text-emerald-400" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">Cadastro efetivado!</h2>
          <p className="mt-2 text-sm text-emerald-100/90">
            Recebemos o pagamento da implementação e criamos sua casa de festas no FestaAI.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-200/80">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Preparando checkout da mensalidade...
          </div>
        </div>
      ) : null}

      {wizardStep === 3 ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#5158e7]/30 bg-[#5158e7]/10 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#8b9dff]">
              Passo 3 — Mensalidade FestaAI
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              Autorize o pagamento da mensalidade para ativar sua assinatura.
              {checkout.subscriptionPaymentMethods ? (
                <span className="mt-1 block text-xs text-zinc-400">
                  {checkout.subscriptionPaymentMethods}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {isPolling ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            <span>Aguardando confirmação do pagamento da mensalidade.</span>
          </div>

          {activateSubscription.isPending || !checkout.subscriptionPaymentId ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Gerando cobrança da mensalidade...
            </div>
          ) : (
            <InlinePaymentPanel
              details={subscriptionDetails.data}
              externalReference={externalReference}
              isLoading={subscriptionDetails.isLoading}
              paymentKind="subscription"
              title="Pague a mensalidade"
            />
          )}
        </div>
      ) : null}

      {wizardStep === 4 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Tudo pronto!</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Implementação e mensalidade confirmadas. Nossa equipe entrará em contato para concluir o
            onboarding da sua casa de festas.
          </p>
        </div>
      ) : null}
    </div>
  );
};
