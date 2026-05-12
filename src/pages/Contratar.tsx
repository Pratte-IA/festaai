import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Check, Clock, Layers, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateCheckout, useSubscriptionPlans, type SubscriptionPlan } from "@/features/billing";
import { toast } from "@/hooks/use-toast";

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const setupLabel = (plan: SubscriptionPlan) => {
  if (!plan.setup_installments || plan.setup_installments <= 1) {
    return `${formatBRL(plan.setup_price)} à vista`;
  }
  const parcelas = plan.setup_installments;
  const valorParcela = plan.setup_price / parcelas;
  return `${parcelas}x de ${formatBRL(valorParcela)}`;
};

const planButtonLabel = (plan: SubscriptionPlan) => {
  const slug = plan.slug.toLowerCase();
  if (slug === "starter") return "Escolher Starter";
  if (slug === "profissional") return "Escolher Profissional";
  if (slug === "enterprise") return "Escolher Enterprise";
  return `Escolher ${plan.name}`;
};

const planBenefits: Record<string, string[]> = {
  Starter: [
    "CRM completo de leads e eventos",
    "Calendário e checklist de festas",
    "Suporte por e-mail",
  ],
  Profissional: [
    "Tudo do Starter",
    "Relatórios financeiros e ocupação",
    "Pacotes e adicionais ilimitados",
    "Suporte prioritário",
  ],
  Enterprise: [
    "Tudo do Profissional",
    "Multi-unidades e usuários ilimitados",
    "Integrações personalizadas",
    "Gerente de sucesso dedicado",
  ],
};

const gradientButtonClass =
  "rounded-xl bg-[linear-gradient(135deg,#5158e7_0%,#d95693_58%,#c77dff_100%)] font-semibold text-white shadow-lg shadow-[#5158e7]/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#d95693]/35 focus-visible:ring-[#5158e7]/40";

const quickBenefits = [
  {
    title: "Mais vendas",
    description: "Sem depender de responder tudo na hora.",
    icon: TrendingUp,
  },
  {
    title: "Mais organização",
    description: "Tudo centralizado e fácil de acessar.",
    icon: Layers,
  },
  {
    title: "Mais tempo",
    description: "Menos sobrecarga no atendimento.",
    icon: Clock,
  },
  {
    title: "Mais controle",
    description: "Você sabe exatamente o que está acontecendo.",
    icon: BarChart3,
  },
] as const;

const Contratar = () => {
  const { data: activePlans = [], error: plansError, isLoading: isLoadingPlans } = useSubscriptionPlans();
  const createCheckout = useCreateCheckout();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", empresa: "", mensagem: "" });
  const highlightedPlanId = useMemo(
    () => activePlans.find((plan) => plan.slug === "profissional")?.id ?? activePlans[1]?.id,
    [activePlans],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      return;
    }

    try {
      const checkout = await createCheckout.mutateAsync({
        companyName: form.empresa,
        email: form.email,
        message: form.mensagem,
        name: form.nome,
        phone: form.telefone,
        planSlug: selectedPlan.slug,
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

      setSelectedPlan(null);
      setForm({ nome: "", email: "", telefone: "", empresa: "", mensagem: "" });
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
      className="relative isolate min-h-screen overflow-x-hidden bg-[#07070c] text-zinc-100 antialiased"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#5158e7]/20 blur-[100px]" />
        <div className="absolute -right-20 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#d95693]/18 blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-[#7c5cff]/14 blur-[100px]" />
        <div className="absolute bottom-24 right-10 h-[16rem] w-[16rem] rounded-full bg-[#ff6b6b]/12 blur-[80px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/[0.08] backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <a href="#top" className="flex min-h-[44px] items-center gap-3">
              <img
                src="/favicon%20simbolo1.svg?v=2"
                alt=""
                className="h-9 w-9 object-contain"
                aria-hidden
              />
              <span className="text-lg font-bold tracking-tight text-white">FestaAI</span>
            </a>

            <nav
              aria-label="Navegação da página"
              className="order-3 flex w-full flex-wrap justify-center gap-x-6 gap-y-2 md:order-none md:flex-1 md:justify-center"
            >
              <a href="#top" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
                Início
              </a>
              <a
                href="#beneficios"
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Plataforma
              </a>
              <a href="#planos" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
                Recursos
              </a>
              <a
                href="#fechamento"
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Contato
              </a>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="hidden min-h-[44px] text-zinc-300 hover:bg-white/5 hover:text-white sm:inline-flex"
              >
                <Link to="/login">Já tenho conta</Link>
              </Button>
              <Button asChild size="sm" className={`min-h-[44px] border-0 ${gradientButtonClass} px-4`}>
                <Link to="/login">Entrar</Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-white/[0.06] px-4 py-3 sm:hidden">
            <Button asChild variant="ghost" size="sm" className="w-full text-zinc-300 hover:bg-white/5">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-24 md:pb-28">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 shadow-[0_0_24px_-4px_rgba(81,88,231,0.35)] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#e6bce9]" />
            Planos FestaAI
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-[3.35rem]">
            Seu salão pode{" "}
            <span className="bg-[linear-gradient(90deg,#8b9dff_0%,#e6bce9_40%,#d95693_100%)] bg-clip-text text-transparent">
              vender mais festas
            </span>{" "}
            sem aumentar sua carga de trabalho
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
            Automatize o atendimento, organize eventos e acompanhe sua operação em um só lugar com o FestaAI.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className={`min-h-[48px] w-full px-10 sm:w-auto ${gradientButtonClass}`}>
              <a href="#planos">Ver planos</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[48px] w-full border-white/25 bg-transparent text-white backdrop-blur-sm hover:bg-white/10 sm:w-auto"
            >
              <a href="#planos">Começar contratação</a>
            </Button>
          </div>
        </section>

        {/* Benefícios */}
        <section id="beneficios" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickBenefits.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_0_40px_-12px_rgba(81,88,231,0.25)] backdrop-blur-sm transition-transform duration-300 hover:border-[#5158e7]/35"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(81,88,231,0.12),transparent_55%)] opacity-90" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/5 p-2.5 text-[#e6bce9] shadow-inner">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-[2.65rem]">
              Escolha o plano ideal para organizar e vender mais festas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-zinc-400">
              Valores mensais claros e setup definido conforme cada plano. Foco na operação da sua casa de festas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:gap-8">
            {isLoadingPlans && (
              <div className="col-span-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-14 text-center text-zinc-400 backdrop-blur-sm">
                Carregando planos...
              </div>
            )}

            {plansError && (
              <div className="col-span-full rounded-2xl border border-red-400/35 bg-red-500/10 p-14 text-center text-red-300">
                Não foi possível carregar os planos agora.
              </div>
            )}

            {activePlans.map((plan) => {
              const isHighlighted = plan.id === highlightedPlanId;
              const benefits = planBenefits[plan.name] ?? [];
              const cta = planButtonLabel(plan);

              const innerCard = (
                <div
                  className={`relative flex min-h-full flex-col bg-[#090910]/90 p-8 backdrop-blur-md transition-all duration-300 hover:bg-[#090910]/95 ${
                    isHighlighted
                      ? "rounded-[14px] border border-white/10"
                      : "rounded-2xl border border-white/[0.08] hover:border-white/[0.14]"
                  }`}
                >
                  {isHighlighted && (
                    <div
                      className={`absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white ${gradientButtonClass} shadow-md`}
                    >
                      Mais escolhido
                    </div>
                  )}

                  <div className={`mb-6 ${isHighlighted ? "pt-4" : ""}`}>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{plan.description}</p>
                  </div>

                  <div className="mb-6 border-b border-white/[0.08] pb-6">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-4xl font-extrabold tabular-nums text-white">{formatBRL(plan.monthly_price)}</span>
                      <span className="text-sm font-medium text-zinc-400">/mês</span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">
                      Setup: <span className="font-semibold text-zinc-200">{setupLabel(plan)}</span>
                    </p>
                    {plan.loyalty_months ? (
                      <p className="mt-2 text-xs text-zinc-500">Fidelidade de {plan.loyalty_months} meses</p>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-500">Sem fidelidade</p>
                    )}
                  </div>

                  {benefits.length > 0 && (
                    <ul className="mb-10 grow space-y-3">
                      {benefits.map((b) => (
                        <li key={b} className="flex gap-3 text-sm text-zinc-300">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#8b9dff]" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    className={`mt-auto min-h-[48px] w-full font-semibold ${
                      isHighlighted
                        ? `${gradientButtonClass} border-0`
                        : "border border-white/[0.2] bg-white/[0.06] text-white hover:bg-white/12"
                    }`}
                    size="lg"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {cta}
                  </Button>
                </div>
              );

              return isHighlighted ? (
                <div
                  key={plan.id}
                  className="rounded-2xl bg-gradient-to-br from-[#5158e7] via-[#d95693] to-[#c77dff] p-[2px] shadow-[0_0_52px_-8px_rgba(81,88,231,0.55),0_0_32px_-12px_rgba(217,86,147,0.35)]"
                >
                  {innerCard}
                </div>
              ) : (
                <div
                  key={plan.id}
                  className="transition-all duration-300 hover:shadow-[0_0_32px_-14px_rgba(81,88,231,0.25)]"
                >
                  {innerCard}
                </div>
              );
            })}
          </div>
        </section>

        {/* Fechamento */}
        <section id="fechamento" className="border-t border-white/[0.08] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(81,88,231,0.12)_0%,rgba(217,86,147,0.08)_48%,rgba(14,14,22,0.95)_100%)] p-8 text-center shadow-[0_0_60px_-20px_rgba(81,88,231,0.4)] backdrop-blur-sm sm:p-12 md:p-16">
            <h2 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-[2.5rem]">
              Pare de perder oportunidades e comece a organizar seu salão para vender mais.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-zinc-300">
              Escolha o plano que combina com a sua operação e avance para a próxima etapa com segurança.
            </p>
            <Button asChild size="lg" className={`mt-10 min-h-[52px] px-10 ${gradientButtonClass}`}>
              <a href="#planos">Quero implementar no meu negócio</a>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-zinc-500 sm:px-6">
            © {new Date().getFullYear()} FestaAI. Todos os direitos reservados.
          </div>
        </footer>

        {/* Modal de contratação */}
        <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent className="border-white/10 bg-[#12121a] text-zinc-100 shadow-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Contratar plano {selectedPlan?.name}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {selectedPlan && (
                  <>
                    {formatBRL(selectedPlan.monthly_price)}/mês · Setup: {setupLabel(selectedPlan)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="mensagem" className="text-zinc-200">
                  Mensagem (opcional)
                </Label>
                <Textarea
                  id="mensagem"
                  rows={3}
                  value={form.mensagem}
                  onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                  placeholder="Conte um pouco sobre sua operação"
                  className="resize-none border-white/15 bg-[#07070c] text-white placeholder:text-zinc-600 focus-visible:ring-[#5158e7]/35"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-zinc-400 hover:bg-white/5 hover:text-white"
                  onClick={() => setSelectedPlan(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createCheckout.isPending}
                  className={`border-0 ${gradientButtonClass}`}
                >
                  {createCheckout.isPending ? "Criando checkout..." : "Ir para pagamento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Contratar;
