import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, GripVertical, Package, PartyPopper, Users } from "lucide-react";
import { useTenantPackages } from "@/features/configuracoes";
import { EventoPackageLabel } from "@/components/eventos/EventoPackageLabel";
import {
  Evento,
  FunnelType,
  getContractSignatureFollowupKanbanBadge,
  getOportunidadeFuturaFofKanbanBadge,
  getOportunidadeFuturaFofRespondedKanbanBadge,
  getPerdidoOportunidadeKanbanBadge,
  getPerdidoOportunidadeRespondedKanbanBadge,
  getPropostaFollowupKanbanBadge,
  getPropostaFollowupRespondedKanbanBadge,
  getEventoDataEntradaIso,
  Stage,
  StageDefinition,
  sortEventosByPartyDateExecutionOrder,
  useUpdateEventoStage,
} from "@/features/eventos";
import {
  compareIsoDateToToday,
  formatDateBR,
} from "@/lib/date";
import { toast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  events: Evento[];
  funnel: FunnelType;
  highlightStage?: string | null;
  stages: StageDefinition[];
}

const getTimeRemaining = (partyDate: string | null): string => {
  if (!partyDate) return "Sem data";

  const diffDays = compareIsoDateToToday(partyDate);
  if (diffDays === null) return "Sem data";

  if (diffDays < 0) return "Realizada";
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  return `Faltam ${diffDays} dias`;
};

const getTimeRemainingColor = (partyDate: string | null): string => {
  if (!partyDate) return "text-muted-foreground";

  const diffDays = compareIsoDateToToday(partyDate);
  if (diffDays === null) return "text-muted-foreground";

  if (diffDays < 0) return "text-muted-foreground";
  if (diffDays <= 1) return "text-destructive font-semibold";
  if (diffDays <= 7) return "text-festa-coral font-medium";
  return "text-muted-foreground";
};

const KanbanBoard = ({ events, funnel, highlightStage, stages }: KanbanBoardProps) => {
  const navigate = useNavigate();
  const [draggedEvent, setDraggedEvent] = useState<number | null>(null);
  const updateEventoStage = useUpdateEventoStage();
  const { data: packages = [] } = useTenantPackages();
  const showPackageLine = funnel === "executadas" || funnel === "festa";

  useEffect(() => {
    if (!highlightStage) return;
    if (!stages.some((stage) => stage.key === highlightStage)) return;

    const column = document.getElementById(`kanban-stage-${highlightStage}`);
    column?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [highlightStage, stages]);

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

    if (stageKey === "proposta_enviada" && !draggedEvento.data_evento) {
      toast({
        title: "Data da festa obrigatoria",
        description: "Cadastre a data da festa antes de mover para Proposta Enviada.",
        variant: "destructive",
      });
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

  const formatDate = (date: string | null, fallback = "Sem data") => formatDateBR(date, fallback);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageEvents = sortEventosByPartyDateExecutionOrder(
          events.filter((e) => e.etapa === stage.key),
        );
        return (
          <div
            key={stage.key}
            id={`kanban-stage-${stage.key}`}
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
              {stageEvents.map((event) => {
                const isPerdidoStage = stage.key === "perdido";
                const followupBadge =
                  funnel === "vendas"
                    ? isPerdidoStage
                      ? getPerdidoOportunidadeKanbanBadge(event)
                      : getPropostaFollowupKanbanBadge(event) ??
                        getContractSignatureFollowupKanbanBadge(event)
                    : funnel === "executadas"
                      ? getOportunidadeFuturaFofKanbanBadge(event)
                      : null;
                const respondedBadge =
                  funnel === "vendas"
                    ? isPerdidoStage
                      ? getPerdidoOportunidadeRespondedKanbanBadge(event)
                      : getPropostaFollowupRespondedKanbanBadge(event)
                    : funnel === "executadas"
                      ? getOportunidadeFuturaFofRespondedKanbanBadge(event)
                      : null;
                const isCancelledParty = event.status_interno === "cancelado";

                return (
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
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-foreground truncate">
                          {event.cliente_nome}
                        </p>
                        {isCancelledParty ? (
                          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
                            Festa Cancelada
                          </span>
                        ) : (
                          (followupBadge || respondedBadge) && (
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {followupBadge && (
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${followupBadge.className}`}
                                >
                                  {followupBadge.label}
                                </span>
                              )}
                              {respondedBadge && (
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${respondedBadge.className}`}
                                >
                                  {respondedBadge.label}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>

                      {/* Linha 2: Nome do aniversariante */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <PartyPopper className="w-3 h-3 flex-shrink-0" />
                        {event.aniversariante_nome ?? "Aniversariante nao informado"}
                      </p>

                      {/* Linha 3: Data de entrada */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        Entrada: {formatDateBR(getEventoDataEntradaIso(event))}
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

                      {showPackageLine && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <Package className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <EventoPackageLabel evento={event} packages={packages} />
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}

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
