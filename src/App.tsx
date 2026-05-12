import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, PlatformAdminRoute, ProtectedRoute } from "@/features/auth";
import { TenantProvider } from "@/features/tenants";

const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminTenantDetail = lazy(() => import("./pages/AdminTenantDetail.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const CRM = lazy(() => import("./pages/CRM.tsx"));
const Calendario = lazy(() => import("./pages/Calendario.tsx"));
const Relatorios = lazy(() => import("./pages/Relatorios.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const EventoDetalhe = lazy(() => import("./pages/EventoDetalhe.tsx"));
const Contratar = lazy(() => import("./pages/Contratar.tsx"));
const MinhaAssinatura = lazy(() => import("./pages/MinhaAssinatura.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const NovaSenha = lazy(() => import("./pages/NovaSenha.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const RouteLoader = () => (
  <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
    Carregando...
  </main>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route
                  path="/admin/tenants/:id"
                  element={
                    <PlatformAdminRoute>
                      <AdminTenantDetail />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PlatformAdminRoute>
                      <Admin />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/crm"
                  element={
                    <ProtectedRoute>
                      <CRM />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/crm/evento/:id"
                  element={
                    <ProtectedRoute>
                      <EventoDetalhe />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendario"
                  element={
                    <ProtectedRoute>
                      <Calendario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/relatorios"
                  element={
                    <ProtectedRoute>
                      <Relatorios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuracoes"
                  element={
                    <ProtectedRoute>
                      <Configuracoes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/minha-assinatura"
                  element={
                    <ProtectedRoute>
                      <MinhaAssinatura />
                    </ProtectedRoute>
                  }
                />
                <Route path="/contratar" element={<Contratar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/nova-senha" element={<NovaSenha />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
