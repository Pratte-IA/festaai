import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import KanbanBoard from "@/components/KanbanBoard";
import { FunnelType, salesStages, partyStages, executedStages, mockEvents } from "@/data/mockEvents";

const funnelTabs: { key: FunnelType; label: string }[] = [
  { key: "vendas", label: "Vendas" },
  { key: "festa", label: "Festa" },
  { key: "executadas", label: "Executadas" },
];

const stageMap = {
  vendas: salesStages,
  festa: partyStages,
  executadas: executedStages,
};

const CRM = () => {
  const [activeFunnel, setActiveFunnel] = useState<FunnelType>("vendas");

  const filteredEvents = mockEvents.filter((e) => e.funnel === activeFunnel);
  const stages = stageMap[activeFunnel];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">CRM</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seus eventos do início ao fim</p>
      </div>

      {/* Funnel tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-6">
        {funnelTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFunnel(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeFunnel === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <KanbanBoard events={filteredEvents} stages={stages} />
    </AppLayout>
  );
};

export default CRM;
