import { ArrowRight, Calendar, CheckCircle2, ClipboardList, DollarSign, ListTodo, PartyPopper } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import type { DashboardOperationalGuide, DashboardOperationalSection } from "@/features/dashboard/operational-guide";
import { Button } from "@/components/ui/button";

interface DashboardOperationalGuideProps {
  guide: DashboardOperationalGuide | undefined;
  isLoading: boolean;
}

const sectionIcons: Record<string, typeof Calendar> = {
  "finalize-checklist": ClipboardList,
  "organize-boas-vindas": PartyPopper,
  "receivables": DollarSign,
  "start-checklist": ClipboardList,
  "tasks": ListTodo,
  "week-parties": Calendar,
};

const OperationalSectionCard = ({ section }: { section: DashboardOperationalSection }) => {
  const navigate = useNavigate();
  const Icon = sectionIcons[section.id] ?? ListTodo;
  const isTasksSection = section.id === "tasks";

  if (section.count === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{section.title}</p>
          {section.subtitle ? <p className="text-xs text-muted-foreground">{section.subtitle}</p> : null}
        </div>
      </div>

      {!isTasksSection && section.items.length > 0 ? (
        <div className="space-y-1.5">
          {section.items.slice(0, 4).map((item) => (
            <button
              key={`${section.id}-${item.eventoId}`}
              type="button"
              onClick={() => navigate(`/crm/evento/${item.eventoId}`)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
            >
              <span className="min-w-0 truncate text-sm text-foreground">
                {item.dateLabel ? <span className="text-muted-foreground">{item.dateLabel} · </span> : null}
                {item.label}
              </span>
              {item.valueLabel ? (
                <span className="shrink-0 text-xs font-medium text-warning">{item.valueLabel}</span>
              ) : null}
            </button>
          ))}
          {section.items.length > 4 ? (
            <p className="px-2 text-xs text-muted-foreground">+ {section.items.length - 4} outras</p>
          ) : null}
        </div>
      ) : null}

      {isTasksSection && section.ctaHref ? (
        <Button asChild variant="outline" size="sm" className="mt-1 gap-2">
          <Link to={section.ctaHref}>
            {section.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
};

export const DashboardOperationalGuidePanel = ({ guide, isLoading }: DashboardOperationalGuideProps) => {
  const visibleSections = guide?.sections.filter((section) => section.count > 0) ?? [];

  return (
    <div className="glass-card animate-fade-in p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">O que temos para fazer hoje?</h2>
        <p className="mt-1 text-xs text-muted-foreground">Prioridades da semana e do mês em um só lugar</p>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando prioridades...</p> : null}

      {!isLoading && visibleSections.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">Tudo em dia por aqui</p>
            <p className="text-xs text-muted-foreground">Nenhuma festa ou tarefa pendente no momento.</p>
          </div>
        </div>
      ) : null}

      {!isLoading && visibleSections.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibleSections.map((section) => (
            <OperationalSectionCard key={section.id} section={section} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
