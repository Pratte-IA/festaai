import { Link } from "react-router-dom";
import { AlertTriangle, Bot, ChevronRight, Headset } from "lucide-react";

import AppLayout from "@/components/AppLayout";

const suporteAreas = [
  {
    to: "/suporte/agente",
    title: "Agente",
    description:
      "Nesta área você solicita melhorias no agente FestaAI do seu WhatsApp (tom de voz, respostas, regras). Acompanhe pedidos em aberto, status e cobrança quando houver.",
    icon: Bot,
    accent: "bg-primary/15 text-primary",
  },
  {
    to: "/suporte/erros",
    title: "Erros",
    description: "Reporte falhas no sistema ou comportamentos inesperados para correção.",
    icon: AlertTriangle,
    accent: "bg-warning/15 text-warning",
  },
  {
    to: "/suporte/novo",
    title: "Solicitar Atendimento",
    description: "Abra uma nova solicitação para a equipe FestaAI.",
    icon: Headset,
    accent: "bg-lilas/15 text-lilas",
  },
] as const;

const Suporte = () => {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um canal para falar com a FestaAI ou acompanhar seus pedidos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {suporteAreas.map((area) => (
          <Link
            key={area.to}
            className="glass-card group flex flex-col p-5 text-left transition-all hover:border-primary/30"
            to={area.to}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${area.accent}`}>
                <area.icon className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-foreground">{area.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{area.description}</p>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
};

export default Suporte;
