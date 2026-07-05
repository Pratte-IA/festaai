import { useNavigate } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, ClipboardList } from "lucide-react";

import { Evento } from "@/features/eventos/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventoFormQuickAccessCardProps {
  evento: Evento;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const EventoFormQuickAccessCard = ({ evento }: EventoFormQuickAccessCardProps) => {
  const navigate = useNavigate();
  const submittedAt = evento.fechamento_confirmado_em;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-festa-blue" />
            Formulário de Contratação
          </CardTitle>
          {submittedAt ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Enviado
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {submittedAt
            ? "Visualize todas as respostas que o cliente enviou no formulário de contratação."
            : "Consulte as respostas registradas neste evento no formulário de contratação."}
        </p>

        {submittedAt ? (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Enviado em</p>
            <p className="font-medium">{formatDateTime(submittedAt)}</p>
          </div>
        ) : null}

        <Button
          size="sm"
          className="gap-2"
          onClick={() => navigate(`/formularios/${evento.id}`)}
        >
          <ArrowUpRight className="w-4 h-4" />
          Ver formulário completo
        </Button>
      </CardContent>
    </Card>
  );
};

export const shouldShowEventoFormQuickAccessCard = (evento: Evento): boolean =>
  Boolean(evento.fechamento_confirmado_em) || evento.funil === "festa";
