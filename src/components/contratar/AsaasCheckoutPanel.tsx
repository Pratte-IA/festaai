import { useEffect, useMemo, useState } from "react";
import { Barcode, CreditCard, ExternalLink, Loader2, QrCode, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSetupPayment } from "@/features/billing";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { contratarCtaGradientClass, formatContratarBRL } from "@/pages/contratar-commercial-data";

const paymentMethods = [
  {
    description: "Confirmação em segundos",
    icon: QrCode,
    title: "Pix",
  },
  {
    description: "Compensação em até 3 dias úteis",
    icon: Barcode,
    title: "Boleto",
  },
  {
    description: "Crédito em até 12x (conforme Asaas)",
    icon: CreditCard,
    title: "Cartão",
  },
] as const;

const statusLabels: Record<string, string> = {
  active: "Pagamento confirmado",
  canceled: "Pagamento cancelado",
  failed: "Pagamento não concluído",
  past_due: "Pagamento em atraso",
  pending: "Aguardando pagamento",
  trialing: "Período de teste",
};

interface AsaasCheckoutPanelProps {
  checkoutUrl?: string | null;
  className?: string;
  externalReference: string;
  isLoading?: boolean;
  isPolling?: boolean;
  maxSetupInstallments?: number;
  monthlyPrice?: number | null;
  planName?: string | null;
  selectedSetupInstallments?: number | null;
  setupInstallmentValue?: number | null;
  setupPaymentMethods?: string | null;
  setupPrice?: number | null;
  status?: string;
  subscriptionCommitmentTotal?: number | null;
  subscriptionMaxPayments?: number | null;
  subscriptionPaymentMethods?: string | null;
}

export const AsaasCheckoutPanel = ({
  checkoutUrl,
  className,
  externalReference,
  isLoading = false,
  isPolling = false,
  maxSetupInstallments = 1,
  monthlyPrice,
  planName,
  selectedSetupInstallments,
  setupInstallmentValue,
  setupPaymentMethods,
  setupPrice,
  status = "pending",
  subscriptionCommitmentTotal,
  subscriptionMaxPayments,
  subscriptionPaymentMethods,
}: AsaasCheckoutPanelProps) => {
  const createSetupPayment = useCreateSetupPayment();
  const [chosenInstallments, setChosenInstallments] = useState(
    selectedSetupInstallments ?? maxSetupInstallments,
  );

  const isPaid = status === "active" || status === "trialing";
  const isFailed = status === "canceled" || status === "failed";
  const hasCheckoutUrl = Boolean(checkoutUrl);
  const allowsInstallmentChoice = maxSetupInstallments > 1;
  const activeInstallments = selectedSetupInstallments ?? chosenInstallments;

  const installmentOptions = useMemo(
    () => Array.from({ length: maxSetupInstallments }, (_, index) => index + 1),
    [maxSetupInstallments],
  );

  const previewInstallmentValue = useMemo(() => {
    if (!setupPrice || setupPrice <= 0) return null;
    return setupPrice / activeInstallments;
  }, [activeInstallments, setupPrice]);

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
    setChosenInstallments(selectedSetupInstallments ?? maxSetupInstallments);
  }, [maxSetupInstallments, selectedSetupInstallments]);

  useEffect(() => {
    if (isPaid || hasCheckoutUrl || isLoading || maxSetupInstallments !== 1) return;
    void generateSetupPayment(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalReference, hasCheckoutUrl, isLoading, isPaid, maxSetupInstallments]);

  const openCheckout = () => {
    if (!checkoutUrl) return;
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  };

  const displayInstallmentValue = setupInstallmentValue ?? previewInstallmentValue;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5158e7]/20">
            <ShieldCheck className="h-5 w-5 text-[#8b9dff]" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Pagamento seguro via Asaas</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Primeiro pague a implementação (setup) — cobrança única. Depois, a mensalidade FestaAI
              será cobrada automaticamente conforme as regras do seu plano.
            </p>
          </div>
        </div>
      </div>

      {(planName || monthlyPrice != null) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {planName ? (
            <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Plano</p>
              <p className="mt-1 text-sm font-semibold text-white">{planName}</p>
            </div>
          ) : null}
          {monthlyPrice != null ? (
            <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mensalidade</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">
                {formatContratarBRL(Number(monthlyPrice))}
              </p>
              {subscriptionMaxPayments != null && subscriptionCommitmentTotal != null ? (
                <p className="text-xs text-zinc-500">
                  {subscriptionMaxPayments}x de {formatContratarBRL(Number(monthlyPrice))} (
                  {formatContratarBRL(subscriptionCommitmentTotal)} no total)
                </p>
              ) : (
                <p className="text-xs text-zinc-500">renovação automática mensal</p>
              )}
              {subscriptionPaymentMethods ? (
                <p className="mt-1 text-xs text-zinc-400">{subscriptionPaymentMethods}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {setupPrice != null && setupPrice > 0 && !isPaid ? (
        <div className="rounded-xl border border-[#5158e7]/30 bg-[#5158e7]/10 p-5 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#8b9dff]">
              Implementação (setup)
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Total: <span className="font-semibold text-white">{formatContratarBRL(setupPrice)}</span>
              {setupPaymentMethods ? (
                <span className="mt-1 block text-xs text-zinc-400">{setupPaymentMethods}</span>
              ) : null}
            </p>
          </div>

          {allowsInstallmentChoice && !hasCheckoutUrl ? (
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
                      {option}x de {formatContratarBRL(setupPrice / option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-400">
                Você pode parcelar em até {maxSetupInstallments}x. Escolha menos parcelas se preferir
                pagar mais rápido.
              </p>
            </div>
          ) : null}

          {displayInstallmentValue != null ? (
            <div className="rounded-lg border border-white/10 bg-[#07070c]/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Valor da parcela</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {formatContratarBRL(displayInstallmentValue)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {activeInstallments > 1
                  ? `${activeInstallments}x de ${formatContratarBRL(displayInstallmentValue)}`
                  : "Pagamento à vista da implementação"}
              </p>
            </div>
          ) : null}

          {!hasCheckoutUrl ? (
            <Button
              type="button"
              disabled={createSetupPayment.isPending || maxSetupInstallments === 1}
              onClick={() => void generateSetupPayment(chosenInstallments)}
              className={cn("min-h-[48px] w-full border-0", contratarCtaGradientClass)}
            >
              {createSetupPayment.isPending || (maxSetupInstallments === 1 && !hasCheckoutUrl) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando cobrança...
                </>
              ) : (
                "Continuar para pagamento"
              )}
            </Button>
          ) : null}
        </div>
      ) : null}

      {hasCheckoutUrl ? (
        <>
          <div>
            <p className="text-sm font-semibold text-white">Formas de pagamento disponíveis</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.title}
                  className="rounded-xl border border-white/[0.08] bg-[#07070c]/60 px-4 py-3"
                >
                  <method.icon className="h-5 w-5 text-[#8b9dff]" aria-hidden />
                  <p className="mt-2 text-sm font-medium text-white">{method.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{method.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              isPaid && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
              isFailed && "border-red-500/30 bg-red-500/10 text-red-200",
              !isPaid && !isFailed && "border-amber-500/30 bg-amber-500/10 text-amber-100",
            )}
          >
            <div className="flex items-center gap-2">
              {isPolling && !isPaid ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              <span className="font-medium">{statusLabels[status] ?? status}</span>
            </div>
            {!isPaid && !isFailed ? (
              <p className="mt-1 text-xs opacity-90">
                Após concluir no Asaas, esta página atualiza automaticamente.
              </p>
            ) : null}
          </div>

          {!isPaid ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                disabled={!checkoutUrl || isLoading}
                onClick={openCheckout}
                className={cn("min-h-[48px] flex-1 border-0", contratarCtaGradientClass)}
              >
                Pagar implementação no Asaas
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              {checkoutUrl ? (
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="min-h-[48px] border-white/15 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
                >
                  <a href={checkoutUrl} target="_blank" rel="noreferrer">
                    Abrir link da cobrança
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
