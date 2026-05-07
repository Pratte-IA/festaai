import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { EventoFormDialog, EventoFormValues } from "@/components/eventos/EventoFormDialog";
import KanbanBoard from "@/components/KanbanBoard";
import { FunnelType, funnelTabs, stageMap, useCreateEvento, useEventos } from "@/features/eventos";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const CRM = () => {
  const navigate = useNavigate();
  const [activeFunnel, setActiveFunnel] = useState<FunnelType>("vendas");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: eventos = [], error, isLoading } = useEventos({ funnel: activeFunnel });
  const createEvento = useCreateEvento();
  const stages = stageMap[activeFunnel];

  const handleCreateEvento = async (values: EventoFormValues) => {
    try {
      const createdEvento = await createEvento.mutateAsync(values);

      toast({
        title: "Evento criado",
        description: "O evento ja esta disponivel no CRM.",
      });
      setIsCreateDialogOpen(false);
      navigate(`/crm/evento/${createdEvento.id}`);
    } catch {
      toast({
        title: "Nao foi possivel criar o evento",
        description: "Revise os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus eventos do início ao fim</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo evento
        </Button>
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

      {isLoading && (
        <div className="glass-card flex h-48 items-center justify-center text-sm text-muted-foreground">
          Carregando eventos...
        </div>
      )}

      {error && (
        <div className="glass-card border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          Nao foi possivel carregar os eventos. Tente novamente em instantes.
        </div>
      )}

      {!isLoading && !error && (
        <KanbanBoard events={eventos} funnel={activeFunnel} stages={[...stages]} />
      )}

      <EventoFormDialog
        initialFunnel={activeFunnel}
        isSubmitting={createEvento.isPending}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateEvento}
        open={isCreateDialogOpen}
      />
    </AppLayout>
  );
};

export default CRM;
