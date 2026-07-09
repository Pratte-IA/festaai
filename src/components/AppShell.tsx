import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";

import AppLayout from "@/components/AppLayout";
import { PageContentLoader } from "@/components/PageContentLoader";
import { prefetchRoute } from "@/lib/prefetch-route";

const WARMUP_ROUTES = ["/crm", "/agenda", "/tarefas", "/configuracoes", "/formularios"];

export const AppShell = () => {
  useEffect(() => {
    WARMUP_ROUTES.forEach(prefetchRoute);
  }, []);

  return (
    <AppLayout>
      <Suspense fallback={<PageContentLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
};
