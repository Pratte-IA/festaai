import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Upload, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { EventoFormDialog, EventoFormValues } from "@/components/eventos/EventoFormDialog";
import { LeadsUploadDialog } from "@/components/eventos/LeadsUploadDialog";
import KanbanBoard from "@/components/KanbanBoard";
import {
  FunnelType,
  filterEventosBySearch,
  funnelTabs,
  stageMap,
  useCreateEvento,
  useEventos,
} from "@/features/eventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const CRM = () => {
  const navigate = useNavigate();
  const [activeFunnel, setActiveFunnel] = useState<FunnelType>("vendas");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: eventos = [], error, isLoading } = useEventos({ funnel: activeFunnel });
  const createEvento = useCreateEvento();
  const stages = stageMap[activeFunnel];
  const filteredEventos = useMemo(
    () => filterEventosBySearch(eventos, searchTerm),
    [eventos, searchTerm],
  );
  const hasActiveSearch = searchTerm.trim().length > 0;

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
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" variant="outline" type="button" onClick={() => setIsUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
          <Button className="gap-2" type="button" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo evento
          </Button>
        </div>
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

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9 pl-9"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, telefone ou data da festa"
            value={searchTerm}
          />
          {hasActiveSearch && (
            <button
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setSearchTerm("")}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {hasActiveSearch && !isLoading && !error && (
          <p className="mt-2 text-xs text-muted-foreground">
            {filteredEventos.length === 0
              ? "Nenhum lead encontrado para esta busca."
              : `${filteredEventos.length} lead${filteredEventos.length === 1 ? "" : "s"} encontrado${filteredEventos.length === 1 ? "" : "s"}.`}
          </p>
        )}
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

      {!isLoading && !error && !(hasActiveSearch && filteredEventos.length === 0) && (
        <KanbanBoard events={filteredEventos} funnel={activeFunnel} stages={[...stages]} />
      )}

      <LeadsUploadDialog onOpenChange={setIsUploadOpen} open={isUploadOpen} />

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
