import { Building2, CheckCircle2, Wallet } from "lucide-react";

import { PublicCheckoutStatus } from "@/features/billing";
import { formatContratarBRL } from "@/pages/contratar-commercial-data";

interface ManualPaymentInstructionsProps {
  checkout: PublicCheckoutStatus;
}

export const ManualPaymentInstructions = ({ checkout }: ManualPaymentInstructionsProps) => (
  <div className="space-y-6">
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-white">Contrato aceito com sucesso</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            Sua contratação foi registrada. Enviamos um e-mail com o link para criar sua senha e
            acessar o FestaAI. As instruções de pagamento negociadas estão abaixo.
          </p>
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Wallet className="h-4 w-4 text-[#8b9dff]" aria-hidden />
        Pagamento negociado (fora do checkout automático)
      </div>

      {checkout.setupPrice != null && checkout.setupPrice > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Implementação (setup)</p>
          <p className="text-lg font-bold tabular-nums text-white">{formatContratarBRL(checkout.setupPrice)}</p>
          {checkout.setupPaymentMethods ? (
            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {checkout.setupPaymentMethods}
            </p>
          ) : null}
        </div>
      ) : null}

      {checkout.monthlyPrice != null ? (
        <div className="space-y-1.5 border-t border-white/10 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mensalidade</p>
          <p className="text-lg font-bold tabular-nums text-white">
            {formatContratarBRL(Number(checkout.monthlyPrice))}
          </p>
          {checkout.subscriptionPaymentMethods ? (
            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {checkout.subscriptionPaymentMethods}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>

    <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <Building2 className="h-5 w-5 shrink-0 text-[#8b9dff]" aria-hidden />
        <p className="text-sm leading-relaxed text-zinc-400">
          Após confirmar o pagamento, nossa equipe acompanha a ativação da sua conta. Em caso de
          dúvida, fale com o comercial que preparou sua proposta.
        </p>
      </div>
    </div>
  </div>
);
