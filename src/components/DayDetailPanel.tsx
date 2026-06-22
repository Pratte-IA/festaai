import { Calendar, Users, Lock, Unlock, PartyPopper, Eye } from "lucide-react";
import { DayInfo, formatDateBR, useToggleCalendarBlock } from "@/features/calendario";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DayDetailPanelProps {
  day: DayInfo | null;
  onUpdate: () => void;
}

const statusConfig = {
  disponivel: { label: "Disponível", className: "bg-success/15 text-success border-success/30" },
  reservado: { label: "Reservado", className: "bg-rosa/15 text-rosa border-rosa/30" },
  bloqueado: { label: "Bloqueado", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const DayDetailPanel = ({ day, onUpdate }: DayDetailPanelProps) => {
  const navigate = useNavigate();
  const toggleCalendarBlock = useToggleCalendarBlock();

  if (!day) {
    return (
      <div className="glass-card p-5 animate-fade-in flex items-center justify-center min-h-[300px]">
        <div className="text-center text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Selecione um dia no calendário</p>
        </div>
      </div>
    );
  }

  const config = statusConfig[day.status];

  const handleToggleBlock = async () => {
    try {
      await toggleCalendarBlock.mutateAsync({
        blockId: day.blockId,
        date: day.date,
        isBlocked: day.blockedManually,
      });
      onUpdate();
    } catch {
      toast({
        title: "Nao foi possivel atualizar a data",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{formatDateBR(day.date)}</h3>
          <p className="text-sm text-muted-foreground">{day.dayOfWeek}</p>
        </div>
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      </div>

      {day.festas.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <PartyPopper className="w-3.5 h-3.5 text-rosa" /> Festa fechada
          </h4>
          {day.festas.map((event) => (
            <button
              key={event.id}
              onClick={() => navigate(`/crm/evento/${event.id}`)}
              className="w-full text-left p-3 rounded-lg bg-rosa/5 border border-rosa/15 hover:bg-rosa/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <PartyPopper className="w-4 h-4 text-rosa" />
                <span className="text-sm font-medium text-foreground">{event.cliente_nome}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{event.aniversariante_nome ?? "Aniversariante nao informado"}</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.quantidade_convidados ?? 0}
                </span>
                <span>{event.hora_evento?.slice(0, 5) ?? "Sem horario"}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {event.pacote_nome ?? "Pacote nao informado"}
              </div>
            </button>
          ))}
        </div>
      )}

      {day.visitas.length > 0 && (
        <div className="mb-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-primary" /> Visitas
          </h4>
          {day.visitas.map((event) => (
            <button
              key={event.id}
              onClick={() => navigate(`/crm/evento/${event.id}`)}
              className="w-full text-left p-3 rounded-lg bg-accent/50 border border-primary/15 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{event.cliente_nome}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{event.aniversariante_nome ?? "Aniversariante nao informado"}</span>
                <span>{event.hora_evento?.slice(0, 5) ?? "Sem horario"}</span>
              </div>
            </button>
          ))}
          <p className="text-[10px] text-muted-foreground italic">
            Visitas não bloqueiam a disponibilidade
          </p>
        </div>
      )}

      {day.festas.length === 0 && day.status === "disponivel" && (
        <div className="mb-4 p-4 rounded-lg bg-success/5 border border-success/20 text-center">
          <p className="text-sm text-success font-medium">Data disponível para festas</p>
        </div>
      )}

      {day.status === "bloqueado" && day.festas.length === 0 && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
          <Lock className="w-5 h-5 mx-auto mb-1 text-destructive" />
          <p className="text-sm text-destructive font-medium">Data bloqueada manualmente</p>
        </div>
      )}

      {day.festas.length === 0 && (
        <Button
          variant={day.blockedManually ? "outline" : "destructive"}
          size="sm"
          className="w-full"
          onClick={handleToggleBlock}
          disabled={toggleCalendarBlock.isPending}
        >
          {day.blockedManually ? (
            <>
              <Unlock className="w-4 h-4 mr-2" /> Desbloquear data
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" /> Bloquear data
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default DayDetailPanel;
