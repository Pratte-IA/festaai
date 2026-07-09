type RouteLoader = () => Promise<unknown>;

const routeLoaders: Record<string, RouteLoader> = {
  "/": () => import("@/pages/Index.tsx"),
  "/crm": () => import("@/pages/CRM.tsx"),
  "/agenda": () => import("@/pages/Agenda.tsx"),
  "/tarefas": () => import("@/pages/Tarefas.tsx"),
  "/relatorios": () => import("@/pages/Relatorios.tsx"),
  "/formularios": () => import("@/pages/Formularios.tsx"),
  "/pesquisa-avaliacao": () => import("@/pages/PesquisaAvaliacao.tsx"),
  "/contratos": () => import("@/pages/Contratos.tsx"),
  "/configuracoes": () => import("@/pages/configuracoes/layout"),
  "/financeiro": () => import("@/pages/Financeiro.tsx"),
  "/financeiro/lancamentos": () => import("@/pages/FinanceiroLancamentos.tsx"),
  "/usuarios": () => import("@/pages/Usuarios.tsx"),
  "/minha-assinatura": () => import("@/pages/MinhaAssinatura.tsx"),
  "/suporte": () => import("@/pages/Suporte.tsx"),
};

const prefetchedRoutes = new Set<string>();

export const prefetchRoute = (path: string) => {
  const normalizedPath = path.replace(/\/+$/, "") || "/";
  const loader = routeLoaders[normalizedPath];

  if (!loader || prefetchedRoutes.has(normalizedPath)) {
    return;
  }

  prefetchedRoutes.add(normalizedPath);
  void loader();
};
