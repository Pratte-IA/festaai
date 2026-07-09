import { ArrowRight, Calendar, CheckCircle2, ChevronRight, ClipboardList, DollarSign, ListTodo, PartyPopper } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import type {
  DashboardOperationalGuide,
  DashboardOperationalItem,
  DashboardOperationalSection,
  DashboardOperationalTaskItem,
} from "@/features/dashboard/operational-guide";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardOperationalGuideProps {
  guide: DashboardOperationalGuide | undefined;
  isLoading: boolean;
}

const statusBadgeClass: Record<string, string> = {
  "Boas Vindas": "bg-primary/15 text-primary",
  "Festa Pronta": "bg-success/15 text-success",
  Planejamento: "bg-warning/15 text-warning",
};

const SECTIONS_WITH_PARTY_DAYS = new Set(["organize-boas-vindas", "start-checklist"]);

const OperationalPartyItem = ({
  item,
  isReceivablesSection = false,
  onClick,
  showPartyDaysLabel = false,
}: {
  item: DashboardOperationalItem;
  isReceivablesSection?: boolean;
  onClick: () => void;
  showPartyDaysLabel?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2.5 text-left transition-colors hover:border-border/50 hover:bg-muted/60"
  >
    <div className="min-w-0 flex-1 space-y-1.5">
      {(isReceivablesSection ? item.dueDateLabel || item.partyDateLabel : item.partyDateLabel) ? (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-medium tracking-wide text-muted-foreground">
          {isReceivablesSection && item.dueDateLabel ? (
            <span className={cn(item.isOverdue && "text-coral")}>
              {item.isOverdue ? "Atrasado · " : "Vence · "}
              {item.dueDateLabel}
            </span>
          ) : null}
          {item.partyDateLabel ? (
            <span>
              Festa · {item.partyDateLabel}
              {showPartyDaysLabel && item.partyDaysLabel ? ` · ${item.partyDaysLabel}` : null}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-0.5">
        {item.isSamePerson ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <span aria-hidden="true">🎈📄</span>
            <span>{item.clienteNome}</span>
          </p>
        ) : (
          <>
            <p className="flex items-center gap-1.5 text-sm leading-snug">
              <span aria-label="Aniversariante" title="Aniversariante">
                🎈
              </span>
              <span className="font-medium text-foreground">{item.aniversarianteNome}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm leading-snug">
              <span aria-label="Contratante" title="Contratante">
                📄
              </span>
              <span className="font-medium text-foreground">{item.clienteNome}</span>
            </p>
          </>
        )}
      </div>

      {item.statusLabel ? (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
            statusBadgeClass[item.statusLabel] ?? "bg-muted text-muted-foreground",
          )}
        >
          {item.statusLabel}
        </span>
      ) : null}
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1 self-center">
      {item.valueLabel ? (
        <span className="text-xs font-semibold text-warning">{item.valueLabel}</span>
      ) : null}
      <ChevronRight
        className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-foreground"
        aria-hidden="true"
      />
    </div>
  </button>
);

const OperationalTaskItem = ({
  item,
  onClick,
}: {
  item: DashboardOperationalTaskItem;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2.5 text-left transition-colors hover:border-border/50 hover:bg-muted/60"
  >
    <div className="min-w-0 flex-1 space-y-1.5">
      {item.dueDateLabel ? (
        <div className="text-xs font-medium tracking-wide text-muted-foreground">
          <span className={cn(item.isOverdue && "text-coral")}>
            {item.isOverdue ? "Atrasada · " : "Prazo · "}
            {item.dueDateLabel}
          </span>
        </div>
      ) : null}

      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{item.titulo}</p>
        <p className="text-xs text-muted-foreground">{item.eventoLabel}</p>
      </div>
    </div>
    <ChevronRight
      className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
      aria-hidden="true"
    />
  </button>
);

export const DashboardOperationalSummary = ({ guide, isLoading }: DashboardOperationalGuideProps) => {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando resumo do dia...</p>;
  }

  if (!guide?.summaryLines.length) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <p className="text-lg font-semibold leading-snug text-foreground">{guide.summaryLines[0]}</p>
      {guide.summaryLines[1] ? (
        <p className="mt-2 text-base leading-relaxed text-foreground/90">{guide.summaryLines[1]}</p>
      ) : null}
    </div>
  );
};

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
  const taskItems = section.taskItems ?? [];
  const isEmpty = section.count === 0;

  if (isEmpty && !section.alwaysShow) return null;

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

      {isTasksSection && taskItems.length > 0 ? (
        <div className="space-y-1">
          {taskItems.slice(0, 4).map((item) => (
            <OperationalTaskItem
              key={`task-${item.tarefaId}`}
              item={item}
              onClick={() => navigate("/tarefas")}
            />
          ))}
          {taskItems.length > 4 ? (
            section.listHref ? (
              <Link
                to={section.listHref}
                className="block rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 hover:underline"
              >
                + {taskItems.length - 4} outras
              </Link>
            ) : (
              <p className="px-2 text-xs text-muted-foreground">+ {taskItems.length - 4} outras</p>
            )
          ) : null}
        </div>
      ) : null}

      {!isTasksSection && section.items.length > 0 ? (
        <div className="space-y-1">
          {section.items.slice(0, 4).map((item) => (
            <OperationalPartyItem
              key={`${section.id}-${item.eventoId}`}
              item={item}
              isReceivablesSection={section.id === "receivables"}
              showPartyDaysLabel={SECTIONS_WITH_PARTY_DAYS.has(section.id)}
              onClick={() => navigate(`/crm/evento/${item.eventoId}`)}
            />
          ))}
          {section.items.length > 4 ? (
            section.listHref ? (
              <Link
                to={section.listHref}
                className="block rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 hover:underline"
              >
                + {section.items.length - 4} outras
              </Link>
            ) : (
              <p className="px-2 text-xs text-muted-foreground">+ {section.items.length - 4} outras</p>
            )
          ) : null}
        </div>
      ) : null}

      {isTasksSection && isEmpty && section.emptyMessage ? (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-2 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">{section.emptyMessage}</p>
        </div>
      ) : null}

      {!isTasksSection && isEmpty && section.emptyMessage ? (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-2 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">{section.emptyMessage}</p>
        </div>
      ) : null}

      {isTasksSection && !isEmpty && section.ctaHref ? (
        <Button asChild variant="outline" size="sm" className="mt-2 gap-2">
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
  const partySections =
    guide?.sections.filter(
      (section) => section.id !== "tasks" && (section.count > 0 || section.alwaysShow),
    ) ?? [];
  const tasksSection = guide?.sections.find((section) => section.id === "tasks");
  const showTasksSection = Boolean(tasksSection?.alwaysShow || (tasksSection && tasksSection.count > 0));
  const hasContent = partySections.length > 0 || showTasksSection;

  return (
    <div className="glass-card animate-fade-in p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">O que temos para fazer hoje?</h2>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando prioridades...</p> : null}

      {!isLoading && !hasContent ? (
        <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">Tudo em dia por aqui</p>
            <p className="text-xs text-muted-foreground">Nenhuma festa ou tarefa pendente no momento.</p>
          </div>
        </div>
      ) : null}

      {!isLoading && hasContent ? (
        <div className="space-y-3">
          {partySections.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {partySections.map((section) => (
                <OperationalSectionCard key={section.id} section={section} />
              ))}
            </div>
          ) : null}

          {showTasksSection && tasksSection ? (
            <OperationalSectionCard section={tasksSection} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
