import { ChevronRight } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

const SEGMENT_META: Record<string, { title: string; description: string }> = {
  pacotes: {
    title: "Pacotes",
    description: "Catálogo, buffet, equipe, faixas de preço e adicionais",
  },
  estrutura: {
    title: "Estrutura",
    description: "Brinquedos padrão editados só aqui e aplicados a todos os pacotes",
  },
  checklist: {
    title: "Checklist",
    description: "Itens gerados automaticamente para cada festa",
  },
  "formulario-fechamento": {
    title: "Formulário de Fechamento",
    description: "Campos confirmados pelo cliente ao fechar a festa",
  },
  financeiro: {
    title: "Financeiro",
    description: "Regras padrão para pagamentos e parcelamentos",
  },
};

const ConfiguracoesLayout = () => {
  const { pathname } = useLocation();
  const segment = pathname.replace(/^\/configuracoes\/?/, "").split("/")[0];
  const meta = segment ? SEGMENT_META[segment] : undefined;

  return (
    <AppLayout>
      <div className="mb-10">
        {meta ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/configuracoes" className="transition-colors hover:text-primary">
                Configurações
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              <span className="font-medium text-foreground">{meta.title}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha uma área para ajustar o funcionamento do FestaAI
            </p>
          </>
        )}
      </div>

      <Outlet />
    </AppLayout>
  );
};

export default ConfiguracoesLayout;
