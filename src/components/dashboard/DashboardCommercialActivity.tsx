import {
  Calendar,
  CalendarRange,
  ChevronRight,
  DollarSign,
  PartyPopper,
  Send,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { CommercialActivity, CommercialActivityCard } from "@/features/dashboard/commercial-activity";

interface DashboardCommercialActivityProps {
  activity: CommercialActivity | undefined;
  isLoading: boolean;
}

const commercialCardIcons = {
  "closed-parties": PartyPopper,
  "conversion-rate": TrendingUp,
  "leads-month": Calendar,
  "leads-today": UserPlus,
  "leads-week": CalendarRange,
  "proposals-month": Send,
  "sold-value": DollarSign,
} as const;

const CommercialActivityCardView = ({ card }: { card: CommercialActivityCard }) => {
  const Icon = commercialCardIcons[card.id];

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{card.title}</p>
          <p className="text-xs text-muted-foreground">{card.subtitle}</p>
        </div>
      </div>
      <p className="px-2 text-2xl font-bold tabular-nums text-foreground">{card.countDisplay}</p>
    </div>
  );
};

export const DashboardCommercialActivity = ({ activity, isLoading }: DashboardCommercialActivityProps) => (
  <div className="mb-8">
    <div className="glass-card animate-fade-in p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Como está sua atividade comercial</h2>
        </div>
        <Link
          to="/relatorios?report=atividade-comercial"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Ver relatório
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando atividade comercial...</p> : null}

      {!isLoading && activity?.cards.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activity.cards.map((card) => (
            <CommercialActivityCardView key={card.id} card={card} />
          ))}
        </div>
      ) : null}
    </div>
  </div>
);
