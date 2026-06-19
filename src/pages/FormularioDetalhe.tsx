import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { ClientFormSubmissionView } from "@/components/formularios/ClientFormSubmissionView";
import { useEvento } from "@/features/eventos";
import { Button } from "@/components/ui/button";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
};

const FormularioDetalhe = () => {
  const navigate = useNavigate();
  const { eventoId: eventoIdParam } = useParams();
  const eventoId = Number(eventoIdParam);
  const validEventoId = Number.isFinite(eventoId) && eventoId > 0 ? eventoId : null;
  const { data: evento, error, isLoading } = useEvento(validEventoId);

  return (
    <AppLayout>
      <div className="mb-6 space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/formularios")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para formulários
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLoading ? "Carregando..." : (evento?.cliente_nome ?? "Formulário do cliente")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Respostas enviadas pelo cliente no formulário de contratação.
            </p>
            {evento?.updated_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Última atualização: {formatDateTime(evento.updated_at)}
              </p>
            )}
          </div>

          {validEventoId && (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to={`/crm/evento/${validEventoId}`}>
                  <ExternalLink className="h-4 w-4" />
                  Abrir evento
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/contratos">
                  <FileText className="h-4 w-4" />
                  Ver contratos
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {!validEventoId && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Formulário inválido.
        </div>
      )}

      {validEventoId && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar este formulário.
        </div>
      )}

      {validEventoId && !error && <ClientFormSubmissionView eventoId={validEventoId} />}
    </AppLayout>
  );
};

export default FormularioDetalhe;
