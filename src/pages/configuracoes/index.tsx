import { Link } from "react-router-dom";
import {
  ChevronRight,
  ClipboardList,
  FileCheck2,
  Layers,
  Lock,
  LucideIcon,
  Package,
  PlugZap,
  Sparkles,
  Tag,
  Wallet,
} from "lucide-react";

import { GUIDED_SETUP_ROUTE } from "@/features/guided-setup";
import { useIsContractModuleReady } from "@/features/eventos/use-tenant-contract-module-settings";
import { cn } from "@/lib/utils";

interface ConfigCardProps {
  description: string;
  icon: LucideIcon;
  requiresContractModule?: boolean;
  title: string;
  to: string;
}

const cards: ConfigCardProps[] = [
  {
    to: "/configuracoes/pacotes",
    title: "Pacotes",
    description: "Catálogo, buffet, equipe e faixas de preço",
    icon: Package,
  },
  {
    to: "/configuracoes/adicionais",
    title: "Adicionais",
    description: "Itens extras opcionais compartilhados entre todos os pacotes",
    icon: Tag,
  },
  {
    to: "/configuracoes/estrutura",
    title: "Estrutura",
    description: "Lista de brinquedos padrão compartilhada por todos os pacotes",
    icon: Layers,
  },
  {
    to: "/configuracoes/checklist",
    title: "Checklist",
    description: "Lista padrão gerada automaticamente para cada evento",
    icon: ClipboardList,
  },
  {
    to: "/configuracoes/formulario-contratacao",
    title: "Formulário de Contratação",
    description: "Configure campos, pacotes, adicionais, pagamento e aceites do formulário da festa",
    icon: FileCheck2,
    requiresContractModule: true,
  },
  {
    to: "/configuracoes/financeiro",
    title: "Financeiro",
    description: "Entrada padrão, parcelas e regras de pagamento",
    icon: Wallet,
  },
  {
    to: "/configuracoes/integracoes/whatsapp",
    title: "WhatsApp",
    description: "Conecte números WhatsApp via Evolution para disparos automáticos",
    icon: PlugZap,
  },
  {
    to: GUIDED_SETUP_ROUTE,
    title: "Configuração Inicial Guiada",
    description:
      "Revise ou altere qualquer etapa — empresa, pacotes, financeiro, contrato, formulário e integrações",
    icon: Sparkles,
  },
];

const ConfiguracoesHome = () => {
  const { isEnabled: isContractModuleReady, isLoading: isContractModuleLoading } =
    useIsContractModuleReady();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 max-w-6xl">
      {cards.map(({ to, title, description, icon: Icon, requiresContractModule }) => {
        const locked =
          requiresContractModule && !isContractModuleLoading && !isContractModuleReady;

        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "group glass-card animate-fade-in flex flex-col gap-4 rounded-xl border border-border/50 p-6 transition-colors hover:border-primary/35 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              locked && "border-dashed hover:border-primary/25",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary",
                  locked && "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              {locked ? (
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {locked
                  ? "Configure os modelos de contrato e aceite os termos do módulo para habilitar o formulário."
                  : description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ConfiguracoesHome;
