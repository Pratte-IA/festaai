import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, GripVertical, Users, PartyPopper } from "lucide-react";
import { Evento, FunnelType, Stage, StageDefinition, useUpdateEventoStage } from "@/features/eventos";
import { toast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  events: Evento[];
  funnel: FunnelType;
  stages: StageDefinition[];
}

const getTimeRemaining = (partyDate: string | null): string => {
  if (!partyDate) return "Sem data";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const party = new Date(partyDate);
  party.setHours(0, 0, 0, 0);
  const diffMs = party.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Realizada";
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  return `Faltam ${diffDays} dias`;
};

const getTimeRemainingColor = (partyDate: string | null): string => {
  if (!partyDate) return "text-muted-foreground";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const party = new Date(partyDate);
  party.setHours(0, 0, 0, 0);
  const diffDays = Math.round((party.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "text-muted-foreground";
  if (diffDays <= 1) return "text-destructive font-semibold";
  if (diffDays <= 7) return "text-festa-coral font-medium";
  return "text-muted-foreground";
};

const KanbanBoard = ({ events, funnel, stages }: KanbanBoardProps) => {
  const navigate = useNavigate();
  const [draggedEvent, setDraggedEvent] = useState<number | null>(null);
  const updateEventoStage = useUpdateEventoStage();

  const handleDragStart = (eventId: number) => {
    setDraggedEvent(eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageKey: string) => {
    if (!draggedEvent) return;

    const draggedEvento = events.find((event) => event.id === draggedEvent);

    if (!draggedEvento || draggedEvento.etapa === stageKey) {
      setDraggedEvent(null);
      return;
    }

    updateEventoStage.mutate(
      {
        eventoId: draggedEvent,
        funnel,
        stage: stageKey as Stage,
      },
      {
        onError: () => {
          toast({
            title: "Nao foi possivel mover o evento",
            description: "Tente novamente em instantes.",
            variant: "destructive",
          });
        },
      },
    );

    setDraggedEvent(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Sem data";

    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageEvents = events.filter((e) => e.etapa === stage.key);
        return (
          <div
            key={stage.key}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.key)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {stageEvents.length}
              </span>
            </div>

            <div className="space-y-2 min-h-[200px] p-2 rounded-xl bg-muted/20 border border-border/30">
              {stageEvents.map((event) => (
                <div
                  key={event.id}
                  draggable
                  onDragStart={() => handleDragStart(event.id)}
                  onClick={() => navigate(`/crm/evento/${event.id}`)}
                  className={`glass-card p-4 cursor-grab active:cursor-grabbing transition-all hover:border-primary/30 ${
                    draggedEvent === event.id ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Linha 1: Nome do cliente */}
                      <p className="text-sm font-bold text-foreground truncate">
                        {event.cliente_nome}
                      </p>

                      {/* Linha 2: Nome do aniversariante */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <PartyPopper className="w-3 h-3 flex-shrink-0" />
                        {event.aniversariante_nome ?? "Aniversariante nao informado"}
                      </p>

                      {/* Linha 3: Data de entrada */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        Entrada: {formatDate(event.created_at)}
                      </p>

                      {/* Linha 4: Data da festa + tempo restante */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>Festa: {formatDate(event.data_evento)}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className={getTimeRemainingColor(event.data_evento)}>
                          {getTimeRemaining(event.data_evento)}
                        </span>
                      </p>

                      {/* Linha 5: Convidados */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        {event.quantidade_convidados ?? 0} convidados
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {stageEvents.length === 0 && (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50">
                  Arraste aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
