import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCheckout } from "@/features/billing";
import { usePublicCommercialOffer } from "@/features/comercial";
import { toast } from "@/hooks/use-toast";
import {
  buildConditionFromOffer,
  ContratarCommercialCondition,
  contratarCtaGradientClass,
  findCommercialConditionBySlug,
  formatContratarBRL,
} from "./contratar-commercial-data";

interface PlanSummaryBlocksProps {
  plan: ContratarCommercialCondition;
}

const PlanSummaryBlocks = ({ plan }: PlanSummaryBlocksProps) => (
  <div className="mt-6 grid gap-3 sm:grid-cols-3">
    <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Mensalidade</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-white">{formatContratarBRL(plan.monthly_price)}</p>
      <p className="text-xs text-zinc-500">por mês</p>
    </div>
    <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 sm:col-span-1">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Setup</p>
      <p className="mt-1 text-sm font-semibold leading-snug text-zinc-200">{plan.setupDisplay}</p>
    </div>
    <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Fidelidade</p>
      <p className="mt-1 text-sm font-semibold text-zinc-200">{plan.loyaltyLabel}</p>
    </div>
  </div>
);

const ContratarIniciar = () => {
  const { planSlug } = useParams<{ planSlug: string }>();
  const [searchParams] = useSearchParams();
  const offerToken = searchParams.get("oferta") ?? undefined;
  const standardPlan = findCommercialConditionBySlug(planSlug);
  const { data: offer, isLoading: isOfferLoading } = usePublicCommercialOffer(offerToken);
  const createCheckout = useCreateCheckout();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", empresa: "" });

  const plan = useMemo<ContratarCommercialCondition | undefined>(() => {
    if (offerToken && offer) {
      return buildConditionFromOffer(offer);
    }
    return standardPlan;
  }, [offer, offerToken, standardPlan]);

  useEffect(() => {
    if (!offer) return;
    setForm((current) => ({
      ...current,
      email: current.email || offer.recipient_email || "",
      empresa: current.empresa || offer.recipient_company || "",
    }));
  }, [offer]);

  if (offerToken && isOfferLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07070c] text-sm text-zinc-400">
        Carregando proposta...
      </main>
    );
  }

  if (offerToken && !isOfferLoading && !offer) {
    return <Navigate to="/contratar" replace />;
  }

  if (!plan) {
    return <Navigate to="/contratar" replace />;
  }

  const backHref = offerToken ? `/contratar/oferta/${offerToken}` : "/contratar#planos";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const checkout = await createCheckout.mutateAsync({
        companyName: form.empresa,
        email: form.email,
        name: form.nome,
        offerToken: offerToken ?? null,
        phone: form.telefone,
        planSlug: plan.slug,
      });

      toast({
        title: "Contratação iniciada",
        description: checkout.checkoutUrl
          ? "Abrimos a página segura de pagamento do Asaas."
          : "Recebemos sua solicitação. A equipe comercial continuará o atendimento.",
      });

      if (checkout.checkoutUrl) {
        window.open(checkout.checkoutUrl, "_blank", "noopener,noreferrer");
      }

      setForm({ nome: "", email: "", telefone: "", empresa: "" });
    } catch (error) {
      toast({
        title: "Não foi possível iniciar a contratação",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      id="top"
      className="relative isolate min-h-screen min-h-dvh overflow-x-hidden bg-[#07070c] text-zinc-100 antialiased"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#5158e7]/20 blur-[100px]" />
        <div className="absolute -right-20 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#d95693]/18 blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-[#7c5cff]/14 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen min-h-dvh flex-col">
        <header className="shrink-0 border-b border-white/[0.08] backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <Link to={backHref}>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {offerToken ? "Voltar à proposta" : "Voltar aos planos"}
              </Link>
            </Button>
            <Link to="/contratar#top" className="flex min-h-[44px] items-center gap-3">
              <img
                src="/favicon%20simbolo1.svg?v=2"
                alt=""
                className="h-9 w-9 object-contain"
                aria-hidden
              />
              <span className="text-lg font-bold tracking-tight text-white">FestaAI</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-12 lg:gap-12 lg:py-4">
            {/* Resumo do plano — equivalente ao cabeçalho do modal + cartão */}
            <section aria-labelledby="contratar-resumo-titulo" className="lg:col-span-5">
              {plan.highlight && plan.badgeLabel ? (
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${contratarCtaGradientClass} shadow-md`}
                >
                  {plan.badgeLabel}
                </div>
              ) : null}

              <h1 id="contratar-resumo-titulo" className={`text-2xl font-bold text-white sm:text-3xl ${plan.highlight && plan.badgeLabel ? "mt-4" : ""}`}>
                {offerToken ? plan.name : `Contratar: ${plan.name}`}
              </h1>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-400">{plan.description}</p>

              <p className="mt-6 text-xs text-zinc-500 lg:hidden">
                {formatContratarBRL(plan.monthly_price)}/mês · Setup: {plan.setupDisplay} · Fidelidade:{" "}
                {plan.loyaltyLabel}
              </p>

              <div className="hidden lg:block">
                <PlanSummaryBlocks plan={plan} />
              </div>

              {plan.benefits.length > 0 ? (
                <div className="mt-8">
                  <h2 className="text-sm font-semibold text-white">O que está incluído</h2>
                  <ul className="mt-4 space-y-3">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex gap-3 text-sm text-zinc-300">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#8b9dff]" aria-hidden />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            {/* Formulário — igual ao corpo do modal */}
            <section
              aria-labelledby="contratar-form-titulo"
              className="lg:col-span-7"
            >
              <div className="rounded-2xl border border-white/[0.1] bg-[#12121a]/95 p-6 shadow-2xl shadow-[#5158e7]/10 backdrop-blur-md sm:p-8">
                <div className="lg:hidden">
                  <PlanSummaryBlocks plan={plan} />
                  {plan.benefits.length > 0 ? (
                    <div className="mt-6">
                      <h2 className="text-sm font-semibold text-white">O que está incluído</h2>
                      <ul className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                        {plan.benefits.map((b) => (
                          <li key={b} className="flex gap-2 text-xs text-zinc-300">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8b9dff]" aria-hidden />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="my-8 border-t border-white/[0.08]" />
                </div>

                <h2 id="contratar-form-titulo" className="text-lg font-semibold text-white">
                  Seus dados
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Preencha seus dados para potencializar seu negócio com o FestaAI
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-zinc-200">
                      Nome completo
                    </Label>
                    <Input
                      id="nome"
                      required
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Seu nome"
                      className="border-white/15 bg-[#07070c] text-white placeholder:text-zinc-600 focus-visible:ring-[#5158e7]/35"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-200">
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="voce@email.com"
                        className="border-white/15 bg-[#07070c] text-white placeholder:text-zinc-600 focus-visible:ring-[#5158e7]/35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-zinc-200">
                        Telefone
                      </Label>
                      <Input
                        id="telefone"
                        required
                        value={form.telefone}
                        onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="border-white/15 bg-[#07070c] text-white placeholder:text-zinc-600 focus-visible:ring-[#5158e7]/35"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="text-zinc-200">
                      Nome da casa de festas
                    </Label>
                    <Input
                      id="empresa"
                      required
                      value={form.empresa}
                      onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                      placeholder="Ex: Buffet Encantado"
                      className="border-white/15 bg-[#07070c] text-white placeholder:text-zinc-600 focus-visible:ring-[#5158e7]/35"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Button
                      asChild
                      variant="ghost"
                      type="button"
                      className="text-zinc-400 hover:bg-white/5 hover:text-white"
                    >
                      <Link to="/contratar#planos">Cancelar</Link>
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCheckout.isPending}
                      className={`min-h-[44px] border-0 ${contratarCtaGradientClass}`}
                    >
                      {createCheckout.isPending
                        ? "Criando checkout..."
                        : offerToken
                          ? "Aceitar proposta e pagar"
                          : "Ir para pagamento"}
                    </Button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContratarIniciar;
