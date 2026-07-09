import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicCommercialOffer } from "@/features/comercial";
import {
  buildConditionFromOffer,
  contratarCtaGradientClass,
  formatContratarBRL,
} from "./contratar-commercial-data";

const ContratarOferta = () => {
  const { token } = useParams<{ token: string }>();
  const { data: offer, error, isLoading } = usePublicCommercialOffer(token);

  const plan = offer ? buildConditionFromOffer(offer) : null;
  const checkoutPath = offer
    ? `/contratar/iniciar/${offer.base_plan_slug}?oferta=${encodeURIComponent(offer.token)}`
    : "/contratar";

  return (
    <div
      id="top"
      className="relative isolate min-h-screen overflow-x-hidden bg-[#07070c] text-zinc-100 antialiased"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#5158e7]/20 blur-[100px]" />
        <div className="absolute -right-20 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#d95693]/18 blur-[90px]" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-white/[0.08] backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Button asChild variant="ghost" size="sm" className="gap-2 text-zinc-300 hover:bg-white/5">
              <Link to="/contratar#planos">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <span className="text-lg font-bold text-white">FestaAI</span>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          {isLoading && (
            <p className="text-center text-sm text-zinc-400">Carregando proposta...</p>
          )}

          {!isLoading && (error || !offer || !plan) && (
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/90 p-8 text-center">
              <h1 className="text-2xl font-bold text-white">Proposta indisponível</h1>
              <p className="mt-3 text-sm text-zinc-400">
                Este link expirou, já foi utilizado ou não existe. Entre em contato com nossa equipe comercial.
              </p>
              <Button asChild className={`mt-6 border-0 ${contratarCtaGradientClass}`}>
                <Link to="/contratar#planos">Ver planos disponíveis</Link>
              </Button>
            </div>
          )}

          {plan && offer && (
            <div className="rounded-2xl border border-white/10 bg-[#12121a]/95 p-8 shadow-2xl backdrop-blur-md sm:p-10">
              <div
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${contratarCtaGradientClass}`}
              >
                Proposta exclusiva
              </div>

              <h1 className="mt-6 text-3xl font-bold text-white">{plan.name}</h1>
              {offer.recipient_company ? (
                <p className="mt-2 text-zinc-400">Preparada para {offer.recipient_company}</p>
              ) : null}

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Mensalidade</p>
                  <p className="mt-1 text-xl font-bold text-white">{formatContratarBRL(plan.monthly_price)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Setup</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-200">{plan.setupDisplay}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Fidelidade</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-200">{plan.loyaltyLabel}</p>
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.benefits.map((benefit) => (
                  <li className="flex gap-3 text-sm text-zinc-300" key={benefit}>
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#8b9dff]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {offer.billing_channel === "manual" ? (
                <div className="mt-6 space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-zinc-200">
                  <p className="font-medium text-white">Forma de pagamento negociada</p>
                  {offer.setup_payment_methods ? (
                    <p>
                      <span className="text-zinc-400">Setup: </span>
                      {offer.setup_payment_methods}
                    </p>
                  ) : null}
                  {offer.subscription_payment_methods ? (
                    <p>
                      <span className="text-zinc-400">Mensalidade: </span>
                      {offer.subscription_payment_methods}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-6 text-xs text-zinc-500">
                Válida até{" "}
                {new Date(offer.expires_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>

              <Button asChild className={`mt-8 min-h-[48px] w-full border-0 ${contratarCtaGradientClass}`} size="lg">
                <Link to={checkoutPath}>Aceitar proposta e continuar</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ContratarOferta;
