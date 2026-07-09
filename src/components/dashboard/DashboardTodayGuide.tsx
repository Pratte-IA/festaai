import { ArrowRight, Bot } from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardOperationalGuidePanel } from "@/components/dashboard/DashboardOperationalGuide";
import type { DashboardGuideItem } from "@/features/dashboard/today-guide";
import type { DashboardOperationalGuide } from "@/features/dashboard/operational-guide";
import { Button } from "@/components/ui/button";

interface DashboardTodayGuideProps {
  isLoading: boolean;
  operationalGuide: DashboardOperationalGuide | undefined;
  systemActions: DashboardGuideItem[];
}

const SystemActionItem = ({ item }: { item: DashboardGuideItem }) => (
  <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
      <Bot className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{item.title}</p>
      <p className="text-xs text-muted-foreground">{item.description}</p>
    </div>
  </div>
);

export const DashboardTodayGuide = ({ isLoading, operationalGuide, systemActions }: DashboardTodayGuideProps) => (
  <div className="mb-8 space-y-4">
    <DashboardOperationalGuidePanel guide={operationalGuide} isLoading={isLoading} />

    <div className="glass-card animate-fade-in p-5">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">O que o FestaAI faz por você hoje</h2>
      </div>

      <div className="space-y-2">
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando automações de hoje...</p> : null}
        {!isLoading ? systemActions.map((item) => <SystemActionItem key={item.id} item={item} />) : null}
      </div>

      {!isLoading ? (
        <Button asChild variant="ghost" size="sm" className="mt-4 gap-1 px-0 text-primary hover:bg-transparent">
          <Link to="/configuracoes/followups">
            Configurar automações
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  </div>
);
