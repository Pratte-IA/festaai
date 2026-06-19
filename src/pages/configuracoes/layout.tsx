import { ChevronRight } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";

const SEGMENT_META: Record<string, { title: string; description: string }> = {
  pacotes: {
    title: "Pacotes",
    description: "Catálogo, buffet, equipe e faixas de preço",
  },
  adicionais: {
    title: "Adicionais",
    description: "Itens extras opcionais compartilhados entre todos os pacotes",
  },
  estrutura: {
    title: "Estrutura",
    description: "Brinquedos padrão editados só aqui e aplicados a todos os pacotes",
  },
  checklist: {
    title: "Checklist",
    description: "Configure categorias e itens por pacote, com opção de replicar entre pacotes",
  },
  "formulario-contratacao": {
    title: "Formulário de Contratação",
    description:
      "Configure o formulário que o cliente preenche ao contratar a festa: campos, pacotes, adicionais, pagamento e aceites.",
  },
  "formulario-fechamento": {
    title: "Formulário de Contratação",
    description:
      "Configure o formulário que o cliente preenche ao contratar a festa: campos, pacotes, adicionais, pagamento e aceites.",
  },
  financeiro: {
    title: "Financeiro",
    description: "Regras padrão para pagamentos e parcelamentos",
  },
  "integracoes/whatsapp": {
    title: "WhatsApp",
    description: "Conecte números WhatsApp da sua casa de festas via Evolution API",
  },
};

const ConfiguracoesLayout = () => {
  const { pathname } = useLocation();
  const relativePath = pathname.replace(/^\/configuracoes\/?/, "");
  const meta = SEGMENT_META[relativePath] ?? SEGMENT_META[relativePath.split("/")[0]];

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
