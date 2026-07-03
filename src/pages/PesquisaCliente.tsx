import { Link, useParams } from "react-router-dom";

import { ClientSatisfactionSurveyForm } from "@/components/pesquisa-avaliacao/ClientSatisfactionSurveyForm";
import { Button } from "@/components/ui/button";
import {
  formatPostPartyAutomationEffectiveDateBR,
  isPostPartyAutomationActive,
} from "@/features/eventos/post-party-automation";

const PesquisaCliente = () => {
  const { tenantSlug, eventoId: eventoIdParam } = useParams<{
    eventoId: string;
    tenantSlug: string;
  }>();

  const eventoId = eventoIdParam ? Number(eventoIdParam) : NaN;
  const isValidEventoId = Number.isInteger(eventoId) && eventoId > 0;
  const automationActive = isPostPartyAutomationActive();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">FestaAI</p>
            <h1 className="text-lg font-semibold text-foreground">Pesquisa de avaliação</h1>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Área do espaço</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {!tenantSlug || !isValidEventoId ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
            <p className="font-medium text-foreground">Link inválido</p>
            <p className="text-sm text-muted-foreground">
              Verifique o endereço enviado pelo espaço de festas.
            </p>
          </div>
        ) : !automationActive ? (
          <div className="rounded-xl border border-border/60 bg-card p-6 text-center space-y-2">
            <p className="font-medium text-foreground">Pesquisa em breve</p>
            <p className="text-sm text-muted-foreground">
              A pesquisa de avaliação estará disponível a partir de{" "}
              {formatPostPartyAutomationEffectiveDateBR()}.
            </p>
          </div>
        ) : (
          <ClientSatisfactionSurveyForm eventoId={eventoId} tenantSlug={tenantSlug} />
        )}
      </main>
    </div>
  );
};

export default PesquisaCliente;
