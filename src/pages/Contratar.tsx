import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { defaultPlans, type CommercialPlan } from "@/data/plansData";

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const setupLabel = (plan: CommercialPlan) => {
  if (plan.setupTipo === "avista") {
    return `${formatBRL(plan.setupValor)} à vista`;
  }
  const parcelas = plan.setupParcelas ?? 1;
  const valorParcela = plan.setupValor / parcelas;
  return `${parcelas}x de ${formatBRL(valorParcela)}`;
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

const Contratar = () => {
  const activePlans = useMemo(() => defaultPlans.filter((p) => p.ativo), []);
  const [selectedPlan, setSelectedPlan] = useState<CommercialPlan | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", empresa: "", mensagem: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Contratação iniciada!",
      description: `Recebemos sua solicitação para o plano ${selectedPlan?.nome}. Entraremos em contato em breve.`,
    });
    setSelectedPlan(null);
    setForm({ nome: "", email: "", telefone: "", empresa: "", mensagem: "" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">FestaAI</span>
          </div>
          <a
            href="#planos"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver planos
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Plataforma para casas de festas infantis
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Organize e venda mais festas com o{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            FestaAI
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Sistema completo para casas de festas infantis
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="#planos">Ver planos</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#planos">Começar agora</a>
          </Button>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Escolha seu plano</h2>
          <p className="mt-3 text-muted-foreground">
            Comece hoje com o plano ideal para o tamanho da sua operação
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {activePlans.map((plan, idx) => {
            const isHighlighted = idx === 1;
            const benefits = planBenefits[plan.nome] ?? [];
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-card p-8 transition-all ${
                  isHighlighted
                    ? "border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-border"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Mais popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold">{plan.nome}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{formatBRL(plan.mensalidadeValor)}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Setup: <span className="font-medium text-foreground">{setupLabel(plan)}</span>
                  </p>
                  {plan.fidelidadeMeses ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Fidelidade de {plan.fidelidadeMeses} meses
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Sem fidelidade</p>
                  )}
                </div>

                {benefits.length > 0 && (
                  <ul className="mb-8 space-y-3">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  className="mt-auto w-full"
                  variant={isHighlighted ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedPlan(plan)}
                >
                  Começar agora
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FestaAI. Todos os direitos reservados.
        </div>
      </footer>

      {/* Modal de contratação */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contratar plano {selectedPlan?.nome}</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <>
                  {formatBRL(selectedPlan.mensalidadeValor)}/mês · Setup: {setupLabel(selectedPlan)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="voce@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  required
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Nome da casa de festas</Label>
              <Input
                id="empresa"
                required
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                placeholder="Ex: Buffet Encantado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem (opcional)</Label>
              <Textarea
                id="mensagem"
                rows={3}
                value={form.mensagem}
                onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                placeholder="Conte um pouco sobre sua operação"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSelectedPlan(null)}>
                Cancelar
              </Button>
              <Button type="submit">Solicitar contratação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contratar;
