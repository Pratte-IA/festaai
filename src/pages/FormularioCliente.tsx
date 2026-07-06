import { Link, useParams, useSearchParams } from "react-router-dom";

import { ClientContractForm } from "@/components/formulario-contratacao/ClientContractForm";
import { Button } from "@/components/ui/button";
import { useClientContractFormConfig } from "@/features/public-contract-form";

const FormularioCliente = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams] = useSearchParams();
  const linkedEventoId = Number(searchParams.get("evento"));
  const validLinkedEventoId =
    Number.isInteger(linkedEventoId) && linkedEventoId > 0 ? linkedEventoId : null;
  const { data: config, error, isLoading } = useClientContractFormConfig(tenantSlug);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">FestaAI</p>
            <h1 className="text-lg font-semibold text-foreground">Formulário do cliente</h1>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Área do espaço</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-16">Carregando formulário...</p>
        )}

        {!isLoading && (error || !config) && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
            <p className="font-medium text-foreground">Formulário indisponível</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Verifique o link enviado pelo espaço."}
            </p>
          </div>
        )}

        {config && (
          <ClientContractForm config={config} linkedEventoId={validLinkedEventoId} />
        )}
      </main>
    </div>
  );
};

export default FormularioCliente;
