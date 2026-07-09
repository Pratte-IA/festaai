import { ChevronRight } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { getFollowupsSubpageLabel, getSettingsPageMeta } from "./settings-page-meta";

const ConfiguracoesLayout = () => {
  const { pathname } = useLocation();
  const relativePath = pathname.replace(/^\/configuracoes\/?/, "");
  const meta = getSettingsPageMeta(relativePath);
  const followupsSubpage = relativePath.match(/^followups\/([^/]+)$/)?.[1];
  const followupsSubpageLabel = followupsSubpage
    ? getFollowupsSubpageLabel(followupsSubpage)
    : undefined;

  return (
    <AppLayout>
      <div className={meta ? "mb-3" : "mb-10"}>
        {meta ? (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/configuracoes" className="transition-colors hover:text-primary">
              Configurações
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            {followupsSubpageLabel ? (
              <>
                <Link to="/configuracoes/followups" className="transition-colors hover:text-primary">
                  Follow-ups
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                <span>{followupsSubpageLabel}</span>
              </>
            ) : (
              <span>{meta.breadcrumb}</span>
            )}
          </nav>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
