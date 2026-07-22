import { Bot, CheckCircle2, FilePenLine, MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardOperationalGuidePanel, DashboardOperationalSummary } from "@/components/dashboard/DashboardOperationalGuide";
import type {
  FestaAiDailyStatus,
  FestaAiSectionId,
  FestaAiStatusSection,
} from "@/features/dashboard/festa-ai-daily-status";
import type { DashboardOperationalGuide } from "@/features/dashboard/operational-guide";
import { cn } from "@/lib/utils";

interface DashboardTodayGuideProps {
  festaAiDailyStatus: FestaAiDailyStatus | undefined;
  isLoading: boolean;
  operationalGuide: DashboardOperationalGuide | undefined;
}

const festaAiSectionIcons = {
  "contato-inicial": MessageCircle,
  contratos: FilePenLine,
  "followup-comercial": Send,
  propostas: Send,
} as const;

const festaAiSectionHrefs: Partial<Record<FestaAiSectionId, string>> = {
  "contato-inicial": "/crm?funil=vendas&etapa=contato_inicial",
  contratos: "/contratos",
  "followup-comercial": "/relatorios?report=followup-comercial-aberto",
  propostas: "/crm?funil=vendas&etapa=proposta_enviada",
};

const FestaAiStatusCard = ({ section }: { section: FestaAiStatusSection }) => {
  const Icon = festaAiSectionIcons[section.id];
  const href = festaAiSectionHrefs[section.id];

  const content = (
    <>
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{section.title}</p>
          <p className="text-xs text-muted-foreground">{section.subtitle}</p>
        </div>
      </div>

      {section.count === 0 && section.emptyMessage ? (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-2 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">{section.emptyMessage}</p>
        </div>
      ) : (
        <p className="px-2 text-2xl font-bold tabular-nums text-foreground">{section.count}</p>
      )}
    </>
  );

  const className = cn(
    "rounded-xl border border-border/60 bg-muted/20 p-4",
    href && "transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (href) {
    return (
      <Link aria-label={`Abrir ${section.title}`} className={className} to={href}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
};

export const DashboardTodayGuide = ({
  festaAiDailyStatus,
  isLoading,
  operationalGuide,
}: DashboardTodayGuideProps) => (
  <div className="mb-8 space-y-4">
    <DashboardOperationalSummary guide={operationalGuide} isLoading={isLoading} />
    <DashboardOperationalGuidePanel guide={operationalGuide} isLoading={isLoading} />

    <div className="glass-card animate-fade-in p-5">
      <div className="mb-5 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">O que o FestaAI faz por você hoje</h2>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando status comercial...</p> : null}

      {!isLoading && festaAiDailyStatus?.sections.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {festaAiDailyStatus.sections.map((section) => (
            <FestaAiStatusCard key={section.id} section={section} />
          ))}
        </div>
      ) : null}
    </div>
  </div>
);
