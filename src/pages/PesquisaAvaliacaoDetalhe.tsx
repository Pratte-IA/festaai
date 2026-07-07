import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { ClientSatisfactionSurveySubmissionView } from "@/components/pesquisa-avaliacao/ClientSatisfactionSurveySubmissionView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEvento } from "@/features/eventos";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
};

const PesquisaAvaliacaoDetalhe = () => {
  const navigate = useNavigate();
  const { eventoId: eventoIdParam } = useParams();
  const eventoId = Number(eventoIdParam);
  const validEventoId = Number.isFinite(eventoId) && eventoId > 0 ? eventoId : null;
  const { data: evento, error, isLoading } = useEvento(validEventoId);

  const hasResponded = Boolean(evento?.satisfaction_survey_preenchido_em);
  const hasSent = Boolean(evento?.satisfaction_survey_whatsapp_enviado_em);

  return (
    <AppLayout>
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/pesquisa-avaliacao")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para pesquisas
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLoading ? "Carregando..." : (evento?.cliente_nome ?? "Pesquisa do cliente")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Respostas enviadas pelo cliente na pesquisa pós-festa.
            </p>
            {evento && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {hasResponded ? (
                  <Badge
                    variant="outline"
                    className="border-success/30 bg-success/10 text-success"
                  >
                    Respondida
                  </Badge>
                ) : hasSent ? (
                  <Badge
                    variant="outline"
                    className="border-warning/30 bg-warning/10 text-warning"
                  >
                    Aguardando resposta
                  </Badge>
                ) : null}
                {hasSent && (
                  <span className="text-xs text-muted-foreground">
                    Enviada em: {formatDateTime(evento.satisfaction_survey_whatsapp_enviado_em)}
                  </span>
                )}
                {hasResponded && (
                  <span className="text-xs text-muted-foreground">
                    Respondida em: {formatDateTime(evento.satisfaction_survey_preenchido_em)}
                  </span>
                )}
              </div>
            )}
          </div>

          {validEventoId && (
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/crm/evento/${validEventoId}`}>
                <ExternalLink className="h-4 w-4" />
                Abrir evento
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!validEventoId && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Pesquisa inválida.
        </div>
      )}

      {validEventoId && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar esta pesquisa.
        </div>
      )}

      {validEventoId && !error && <ClientSatisfactionSurveySubmissionView eventoId={validEventoId} />}
    </AppLayout>
  );
};

export default PesquisaAvaliacaoDetalhe;
