import { ClipboardList, DollarSign, MessageCircle, PartyPopper, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
  NeedsAttention,
  NeedsAttentionSection,
  NeedsAttentionSectionId,
} from "@/features/dashboard/build-needs-attention";
import { cn } from "@/lib/utils";

interface DashboardNeedsAttentionProps {
  attention: NeedsAttention | undefined;
  isLoading: boolean;
}

const sectionIcons: Record<NeedsAttentionSectionId, typeof DollarSign> = {
  "checklist-30-dias": ClipboardList,
  financeiro: DollarSign,
  "follows-parados": MessageCircle,
  "organizar-boas-vindas": PartyPopper,
  "prova-social-mkt": Share2,
};

const sectionAccent: Record<NeedsAttentionSectionId, string> = {
  "checklist-30-dias": "bg-warning/15 text-warning",
  financeiro: "bg-coral/15 text-coral",
  "follows-parados": "bg-primary/15 text-primary",
  "organizar-boas-vindas": "bg-rosa/15 text-rosa",
  "prova-social-mkt": "bg-lilas/15 text-lilas",
};

const NeedsAttentionSectionCard = ({
  onItemClick,
  section,
}: {
  onItemClick: (eventoId: number) => void;
  section: NeedsAttentionSection;
}) => {
  const Icon = sectionIcons[section.id];

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            sectionAccent[section.id],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{section.title}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {section.items.length}
        </span>
      </div>

      {section.items.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">{section.emptyMessage}</p>
      ) : (
        <div className="space-y-1.5">
          {section.items.map((item) => (
            <button
              key={`${section.id}-${item.eventoId}`}
              className="flex w-full flex-col rounded-lg bg-background/60 px-3 py-2 text-left transition-colors hover:bg-muted/70"
              onClick={() => onItemClick(item.eventoId)}
              type="button"
            >
              <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const DashboardNeedsAttention = ({ attention, isLoading }: DashboardNeedsAttentionProps) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card animate-fade-in p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Precisa de Atenção</h3>
        <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
          {isLoading ? "..." : `${attention?.totalCount ?? 0} itens`}
        </span>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando prioridades...</p> : null}

      {!isLoading && attention ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {attention.sections.map((section) => (
            <NeedsAttentionSectionCard
              key={section.id}
              onItemClick={(eventoId) => navigate(`/crm/evento/${eventoId}`)}
              section={section}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
