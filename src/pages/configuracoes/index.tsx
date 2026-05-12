import { Link } from "react-router-dom";
import {
  ChevronRight,
  ClipboardList,
  Layers,
  LucideIcon,
  Package,
  Wallet,
} from "lucide-react";

interface ConfigCardProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const cards: ConfigCardProps[] = [
  {
    to: "/configuracoes/pacotes",
    title: "Pacotes",
    description: "Catálogo, buffet, equipe, preços e adicionais comerciais",
    icon: Package,
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
    to: "/configuracoes/financeiro",
    title: "Financeiro",
    description: "Entrada padrão, parcelas e regras de pagamento",
    icon: Wallet,
  },
];

const ConfiguracoesHome = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 max-w-6xl">
      {cards.map(({ to, title, description, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group glass-card animate-fade-in flex flex-col gap-4 rounded-xl border border-border/50 p-6 transition-colors hover:border-primary/35 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ConfiguracoesHome;
