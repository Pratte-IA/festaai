import { Briefcase, ChevronRight, LucideIcon, PartyPopper, Star, Target } from "lucide-react";
import { Link } from "react-router-dom";

import {
  SettingsPageHeader,
} from "@/components/configuracoes/SettingsPageHeader";
import { cn } from "@/lib/utils";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

interface FollowupAreaCardProps {
  description: string;
  icon: LucideIcon;
  title: string;
  to: string;
}

const cards: FollowupAreaCardProps[] = [
  {
    to: "/configuracoes/followups/comercial",
    title: "Comercial",
    description: "Proposta (FU0–FU4), assinatura de contrato e regras de disparo",
    icon: Briefcase,
  },
  {
    to: "/configuracoes/followups/oportunidade",
    title: "Oportunidade",
    description: "Leads perdidos (FUP/FOP) e clientes em Oportunidade Futura (FOF1–FOF3)",
    icon: Target,
  },
  {
    to: "/configuracoes/followups/execucao",
    title: "Execução de Festa",
    description: "Boas Vindas após assinatura e lembrete 7 dias antes da festa",
    icon: PartyPopper,
  },
  {
    to: "/configuracoes/followups/pos-festa",
    title: "Pós Festa",
    description: "Pesquisa de satisfação, lembrete 24h e follow-up quando a nota for de 0 a 7",
    icon: Star,
  },
];

const ConfiguracoesFollowups = () => {
  const meta = SETTINGS_PAGE_META.followups;

  return (
    <div className="max-w-4xl space-y-6">
      <SettingsPageHeader title={meta.title} description={meta.description} />

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
        <p className="text-foreground font-medium">O que são os follow-ups automáticos?</p>
        <p>
          Mensagens no WhatsApp para retomar o contato comercial, acompanhar a execução da festa e
          coletar feedback pós-evento.
        </p>
        <p>
          Cada mensagem enviada fica registrada na memória do agente de atendimento, para que, quando o
          cliente responder, a IA saiba exatamente o que já foi dito.
        </p>
        <p>
          O vínculo do número WhatsApp de envio fica em{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            to="/configuracoes/automacoes"
          >
            Automações
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            className={cn(
              "group flex flex-col rounded-xl border border-border/60 bg-card/40 p-5 transition-colors",
              "hover:border-primary/40 hover:bg-card/70",
            )}
            to={to}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ConfiguracoesFollowups;
