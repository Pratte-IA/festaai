import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Check,
  Clock,
  Layers,
  Mail,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsappFloatingButton } from "@/components/contratar/WhatsappFloatingButton";
import { WhatsappIcon } from "@/components/contratar/WhatsappIcon";
import {
  COMMERCIAL_CONDITIONS,
  CONTRATAR_CONTACT,
  CONTRATAR_LEGAL,
  contratarCtaGradientClass,
  formatContratarBRL,
  getContratarWhatsappUrl,
} from "./contratar-commercial-data";

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
  const { hash } = useLocation();

  useEffect(() => {
    const id = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!id) return;

    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [hash]);

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
                Planos
              </a>
              <a
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                href={getContratarWhatsappUrl(CONTRATAR_CONTACT.whatsapp.demoMessage)}
                rel="noopener noreferrer"
                target="_blank"
              >
                Agendar demonstração
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
                size="sm"
                className={`min-h-[44px] border-0 ${contratarCtaGradientClass} px-4`}
              >
                <Link to="/login">Entrar</Link>
              </Button>
            </div>
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
            <Button
              asChild
              size="lg"
              className={`min-h-[48px] w-full px-10 sm:w-auto ${contratarCtaGradientClass}`}
            >
              <a href="#planos">Ver planos</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[48px] w-full border-white/25 bg-transparent text-white backdrop-blur-sm hover:bg-white/10 sm:w-auto"
            >
              <a
                href={getContratarWhatsappUrl(CONTRATAR_CONTACT.whatsapp.demoMessage)}
                rel="noopener noreferrer"
                target="_blank"
              >
                Agendar demonstração
              </a>
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
              Escolha a condição de contratação do FestaAI
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-zinc-400">
              Em todas as condições, você recebe a mesma plataforma FestaAI. A diferença está apenas no setup,
              mensalidade e fidelidade.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm text-zinc-500">
              Todas as opções incluem a plataforma completa FestaAI. O que muda é apenas a forma de contratação.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:gap-8">
            {COMMERCIAL_CONDITIONS.map((plan) => {
              const isHighlighted = plan.highlight;
              const benefits = plan.benefits;
              const cta = plan.cta;

              const innerCard = (
                <div
                  className={`relative flex min-h-full flex-col bg-[#090910]/90 p-8 backdrop-blur-md transition-all duration-300 hover:bg-[#090910]/95 ${
                    isHighlighted
                      ? "rounded-[14px] border border-white/10"
                      : "rounded-2xl border border-white/[0.08] hover:border-white/[0.14]"
                  }`}
                >
                  {isHighlighted && plan.badgeLabel && (
                    <div
                      className={`absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white ${contratarCtaGradientClass} shadow-md`}
                    >
                      {plan.badgeLabel}
                    </div>
                  )}

                  <div className={`mb-6 ${isHighlighted ? "pt-4" : ""}`}>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{plan.description}</p>
                  </div>

                  <div className="mb-6 border-b border-white/[0.08] pb-6">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-4xl font-extrabold tabular-nums text-white">
                        {formatContratarBRL(plan.monthly_price)}
                      </span>
                      <span className="text-sm font-medium text-zinc-400">/mês</span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">
                      Setup: <span className="font-semibold text-zinc-200">{plan.setupDisplay}</span>
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Fidelidade: <span className="font-medium text-zinc-400">{plan.loyaltyLabel}</span>
                    </p>
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
                    asChild
                    className={`mt-auto min-h-[48px] w-full font-semibold ${
                      isHighlighted
                        ? `${contratarCtaGradientClass} border-0`
                        : "border border-white/[0.2] bg-white/[0.06] text-white hover:bg-white/12"
                    }`}
                    size="lg"
                  >
                    <Link to={`/contratar/iniciar/${plan.slug}`}>{cta}</Link>
                  </Button>
                </div>
              );

              return isHighlighted ? (
                <div
                  key={plan.slug}
                  className="rounded-2xl bg-gradient-to-br from-[#5158e7] via-[#d95693] to-[#c77dff] p-[2px] shadow-[0_0_52px_-8px_rgba(81,88,231,0.55),0_0_32px_-12px_rgba(217,86,147,0.35)]"
                >
                  {innerCard}
                </div>
              ) : (
                <div
                  key={plan.slug}
                  className="transition-all duration-300 hover:shadow-[0_0_32px_-14px_rgba(81,88,231,0.25)]"
                >
                  {innerCard}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <div className="relative flex flex-col rounded-2xl border border-dashed border-white/[0.18] bg-white/[0.02] p-8 text-center backdrop-blur-sm transition-all duration-300 hover:border-[#5158e7]/35 hover:bg-white/[0.04]">
              <div className="mx-auto mb-4 inline-flex rounded-xl border border-white/10 bg-white/5 p-2.5 text-[#e6bce9]">
                <MessageSquare className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-xl font-bold text-white">Plano sob medida</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Precisa de condições especiais ou uma implantação personalizada? Fale com nosso time comercial.
              </p>
              <Button
                asChild
                className={`mt-8 min-h-[48px] border border-white/[0.2] bg-white/[0.06] font-semibold text-white hover:bg-white/12`}
                size="lg"
              >
                <a
                  href={getContratarWhatsappUrl(CONTRATAR_CONTACT.whatsapp.customPlanMessage)}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Falar com o time comercial
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Contato */}
        <section id="fechamento" className="border-t border-white/[0.08] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(81,88,231,0.12)_0%,rgba(217,86,147,0.08)_48%,rgba(14,14,22,0.95)_100%)] p-8 text-center shadow-[0_0_60px_-20px_rgba(81,88,231,0.4)] backdrop-blur-sm sm:p-12">
            <h2 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Fale conosco
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-400">
              Dúvidas sobre planos ou implantação? Entre em contato direto com nosso time.
            </p>

            <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
              <a
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-6 transition-colors hover:border-white/[0.18] hover:bg-white/[0.07]"
                href={`mailto:${CONTRATAR_CONTACT.email}`}
              >
                <span className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2.5 text-[#e6bce9]">
                  <Mail aria-hidden className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">E-mail</span>
                <span className="text-sm font-semibold text-white transition-colors group-hover:text-[#e6bce9]">
                  {CONTRATAR_CONTACT.email}
                </span>
              </a>

              <a
                className="group flex flex-col items-center gap-3 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/[0.08] p-6 transition-colors hover:border-[#25D366]/50 hover:bg-[#25D366]/[0.14]"
                href={getContratarWhatsappUrl()}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="inline-flex rounded-xl border border-[#25D366]/30 bg-[#25D366]/15 p-2.5 text-[#25D366]">
                  <WhatsappIcon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">WhatsApp</span>
                <span className="text-sm font-semibold text-white transition-colors group-hover:text-[#25D366]">
                  {CONTRATAR_CONTACT.whatsapp.display}
                </span>
                <span className="text-xs text-zinc-400">Toque para chamar no WhatsApp</span>
              </a>
            </div>

            <Button
              asChild
              size="lg"
              className={`mt-10 min-h-[48px] px-8 ${contratarCtaGradientClass}`}
            >
              <a
                href={getContratarWhatsappUrl(CONTRATAR_CONTACT.whatsapp.demoMessage)}
                rel="noopener noreferrer"
                target="_blank"
              >
                Agendar demonstração
              </a>
            </Button>
          </div>
        </section>

        <WhatsappFloatingButton />

        {/* Footer */}
        <footer className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-center text-sm text-zinc-500 sm:px-6">
            <p>© {new Date().getFullYear()} FestaAI. Todos os direitos reservados.</p>
            <p className="text-xs text-zinc-600">
              A plataforma FestaAI pertence à {CONTRATAR_LEGAL.companyName} · CNPJ{" "}
              {CONTRATAR_LEGAL.cnpj}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Contratar;
