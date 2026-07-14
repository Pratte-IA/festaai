import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { AuthProvider, PlatformAdminRoute, ProtectedRoute, RootEntry } from "@/features/auth";
import { GuidedSetupProvider } from "@/features/guided-setup";
import { TenantAdminRoute, TenantProvider } from "@/features/tenants";
import Agenda from "./pages/Agenda.tsx";
import CRM from "./pages/CRM.tsx";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Tarefas from "./pages/Tarefas.tsx";

const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminTenantDetail = lazy(() => import("./pages/AdminTenantDetail.tsx"));
const AdminTenantConfig = lazy(() => import("./pages/AdminTenantConfig.tsx"));
const AdminTenantConfigSection = lazy(() => import("./pages/AdminTenantConfigSection.tsx"));
const AdminTenantN8nConfig = lazy(() => import("./pages/AdminTenantN8nConfig.tsx"));
const Usuarios = lazy(() => import("./pages/Usuarios.tsx"));
const Contratos = lazy(() => import("./pages/Contratos.tsx"));
const ContratoDetalhe = lazy(() => import("./pages/ContratoDetalhe.tsx"));
const Formularios = lazy(() => import("./pages/Formularios.tsx"));
const FormularioDetalhe = lazy(() => import("./pages/FormularioDetalhe.tsx"));
const PesquisaAvaliacao = lazy(() => import("./pages/PesquisaAvaliacao.tsx"));
const PesquisaAvaliacaoDetalhe = lazy(() => import("./pages/PesquisaAvaliacaoDetalhe.tsx"));
const Relatorios = lazy(() => import("./pages/Relatorios.tsx"));
const ConfiguracoesLayout = lazy(() => import("./pages/configuracoes/layout"));
const ConfiguracoesHome = lazy(() => import("./pages/configuracoes/index"));
const ConfiguracoesPacotes = lazy(() => import("./pages/configuracoes/Pacotes"));
const ConfiguracoesChecklist = lazy(() => import("./pages/configuracoes/Checklist"));
const ConfiguracoesContrato = lazy(() => import("./pages/configuracoes/Contrato"));
const ConfiguracoesFormularioContratacao = lazy(
  () => import("./pages/configuracoes/FormularioContratacao"),
);
const ConfiguracoesFinanceiro = lazy(() => import("./pages/configuracoes/Financeiro"));
const ConfiguracoesPesquisaAvaliacao = lazy(() => import("./pages/configuracoes/PesquisaAvaliacao"));
const ConfiguracoesFollowups = lazy(() => import("./pages/configuracoes/Followups"));
const ConfiguracoesFollowupsComercial = lazy(() => import("./pages/configuracoes/FollowupsComercial"));
const ConfiguracoesFollowupsOportunidade = lazy(() => import("./pages/configuracoes/FollowupsOportunidade"));
const ConfiguracoesFollowupsExecucao = lazy(() => import("./pages/configuracoes/FollowupsExecucao"));
const ConfiguracoesFollowupsPosFesta = lazy(() => import("./pages/configuracoes/FollowupsPosFesta"));
const ConfiguracoesEstrutura = lazy(() => import("./pages/configuracoes/Estrutura"));
const ConfiguracoesAdicionais = lazy(() => import("./pages/configuracoes/Adicionais"));
const ConfiguracoesWhatsApp = lazy(() => import("./pages/configuracoes/WhatsApp"));
const ConfiguracoesAutomacoes = lazy(() => import("./pages/configuracoes/Automacoes"));
const EventoDetalhe = lazy(() => import("./pages/EventoDetalhe.tsx"));
const EventoFinanceiro = lazy(() => import("./pages/EventoFinanceiro.tsx"));
const Financeiro = lazy(() => import("./pages/Financeiro.tsx"));
const FinanceiroLancamentos = lazy(() => import("./pages/FinanceiroLancamentos.tsx"));
const Contratar = lazy(() => import("./pages/Contratar.tsx"));
const ContratarIniciar = lazy(() => import("./pages/ContratarIniciar.tsx"));
const ContratarPagamento = lazy(() => import("./pages/ContratarPagamento.tsx"));
const ContratarOferta = lazy(() => import("./pages/ContratarOferta.tsx"));
const FormularioCliente = lazy(() => import("./pages/FormularioCliente.tsx"));
const PesquisaCliente = lazy(() => import("./pages/PesquisaCliente.tsx"));
const MinhaAssinatura = lazy(() => import("./pages/MinhaAssinatura.tsx"));
const AdminAgentRequests = lazy(() => import("./pages/AdminAgentRequests.tsx"));
const AdminAgentRequestDetail = lazy(() => import("./pages/AdminAgentRequestDetail.tsx"));
const AdminComercial = lazy(() => import("./pages/AdminComercial.tsx"));
const AdminComercialLeads = lazy(() => import("./pages/AdminComercialLeads.tsx"));
const AdminComercialOfertas = lazy(() => import("./pages/AdminComercialOfertas.tsx"));
const AdminComercialOfertaForm = lazy(() => import("./pages/AdminComercialOfertaForm.tsx"));
const AdminComercialContratoAceiteDetalhe = lazy(
  () => import("./pages/AdminComercialContratoAceiteDetalhe.tsx"),
);
const AdminComercialContratos = lazy(() => import("./pages/AdminComercialContratos.tsx"));
const Privacidade = lazy(() => import("./pages/Privacidade.tsx"));
const Suporte = lazy(() => import("./pages/Suporte.tsx"));
const SuporteAgente = lazy(() => import("./pages/SuporteAgente.tsx"));
const SuporteErros = lazy(() => import("./pages/SuporteErros.tsx"));
const SuporteNovo = lazy(() => import("./pages/SuporteNovo.tsx"));
const SuporteDetalhe = lazy(() => import("./pages/SuporteDetalhe.tsx"));
const NovaSenha = lazy(() => import("./pages/NovaSenha.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ConfiguracaoInicial = lazy(() => import("./pages/ConfiguracaoInicial.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

const PublicRouteLoader = () => (
  <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
    Carregando...
  </main>
);

const LazyPublicRoutes = () => (
  <Suspense fallback={<PublicRouteLoader />}>
    <Outlet />
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GuidedSetupProvider>
              <Routes>
                <Route element={<LazyPublicRoutes />}>
                  <Route path="/admin/comercial/leads" element={<PlatformAdminRoute><AdminComercialLeads /></PlatformAdminRoute>} />
                  <Route path="/admin/comercial/ofertas/nova" element={<PlatformAdminRoute><AdminComercialOfertaForm /></PlatformAdminRoute>} />
                  <Route path="/admin/comercial/ofertas/:id" element={<PlatformAdminRoute><AdminComercialOfertaForm /></PlatformAdminRoute>} />
                  <Route path="/admin/comercial/ofertas" element={<PlatformAdminRoute><AdminComercialOfertas /></PlatformAdminRoute>} />
                  <Route path="/admin/comercial/contratos/aceite/:id" element={<PlatformAdminRoute><AdminComercialContratoAceiteDetalhe /></PlatformAdminRoute>} />
                  <Route path="/admin/comercial/contratos" element={<PlatformAdminRoute><AdminComercialContratos /></PlatformAdminRoute>} />
                  <Route path="/admin/comercial" element={<PlatformAdminRoute><AdminComercial /></PlatformAdminRoute>} />
                  <Route path="/admin/agent-requests/:id" element={<PlatformAdminRoute><AdminAgentRequestDetail /></PlatformAdminRoute>} />
                  <Route path="/admin/agent-requests" element={<PlatformAdminRoute><AdminAgentRequests /></PlatformAdminRoute>} />
                  <Route path="/admin/tenants/:id/n8n" element={<PlatformAdminRoute><AdminTenantN8nConfig /></PlatformAdminRoute>} />
                  <Route path="/admin/tenants/:id/configuracao/:section" element={<PlatformAdminRoute><AdminTenantConfigSection /></PlatformAdminRoute>} />
                  <Route path="/admin/tenants/:id/configuracao" element={<PlatformAdminRoute><AdminTenantConfig /></PlatformAdminRoute>} />
                  <Route path="/admin/tenants/:id" element={<PlatformAdminRoute><AdminTenantDetail /></PlatformAdminRoute>} />
                  <Route path="/admin" element={<PlatformAdminRoute><Admin /></PlatformAdminRoute>} />
                  <Route path="/privacidade" element={<Privacidade />} />
                  <Route path="/contratar/pagamento" element={<ContratarPagamento />} />
                  <Route path="/contratar/iniciar/:planSlug" element={<ContratarIniciar />} />
                  <Route path="/contratar/oferta/:token" element={<ContratarOferta />} />
                  <Route path="/contratar" element={<Contratar />} />
                  <Route path="/formulario/:tenantSlug" element={<FormularioCliente />} />
                  <Route path="/pesquisa/:tenantSlug/:eventoId" element={<PesquisaCliente />} />
                  <Route path="/nova-senha" element={<NovaSenha />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/login" element={<Login />} />

                <Route element={<RootEntry />}>
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Index />} />
                    <Route path="configuracao-inicial" element={<ConfiguracaoInicial />} />
                    <Route path="usuarios" element={<Usuarios />} />
                    <Route path="crm" element={<CRM />} />
                    <Route
                      path="crm/evento/:id/financeiro"
                      element={
                        <TenantAdminRoute>
                          <EventoFinanceiro />
                        </TenantAdminRoute>
                      }
                    />
                    <Route path="crm/evento/:id" element={<EventoDetalhe />} />
                    <Route path="formularios/:eventoId" element={<FormularioDetalhe />} />
                    <Route path="formularios" element={<Formularios />} />
                    <Route path="pesquisa-avaliacao/:eventoId" element={<PesquisaAvaliacaoDetalhe />} />
                    <Route path="pesquisa-avaliacao" element={<PesquisaAvaliacao />} />
                    <Route path="contratos/:contractId" element={<ContratoDetalhe />} />
                    <Route path="contratos" element={<Contratos />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="calendario" element={<Navigate to="/agenda" replace />} />
                    <Route path="tarefas" element={<Tarefas />} />
                    <Route
                      path="financeiro/lancamentos"
                      element={
                        <TenantAdminRoute>
                          <FinanceiroLancamentos />
                        </TenantAdminRoute>
                      }
                    />
                    <Route
                      path="financeiro"
                      element={
                        <TenantAdminRoute>
                          <Financeiro />
                        </TenantAdminRoute>
                      }
                    />
                    <Route path="relatorios" element={<Relatorios />} />
                    <Route path="conexoes" element={<Navigate to="/configuracoes/integracoes/whatsapp" replace />} />
                    <Route path="configuracoes" element={<ConfiguracoesLayout />}>
                      <Route index element={<ConfiguracoesHome />} />
                      <Route path="pacotes" element={<ConfiguracoesPacotes />} />
                      <Route path="adicionais" element={<ConfiguracoesAdicionais />} />
                      <Route path="estrutura" element={<ConfiguracoesEstrutura />} />
                      <Route path="checklist" element={<ConfiguracoesChecklist />} />
                      <Route path="contrato" element={<ConfiguracoesContrato />} />
                      <Route path="formulario-contratacao" element={<ConfiguracoesFormularioContratacao />} />
                      <Route path="formulario-fechamento" element={<Navigate to="/configuracoes/formulario-contratacao" replace />} />
                      <Route path="financeiro" element={<ConfiguracoesFinanceiro />} />
                      <Route path="followups" element={<ConfiguracoesFollowups />} />
                      <Route path="followups/comercial" element={<ConfiguracoesFollowupsComercial />} />
                      <Route path="followups/oportunidade" element={<ConfiguracoesFollowupsOportunidade />} />
                      <Route path="followups/execucao" element={<ConfiguracoesFollowupsExecucao />} />
                      <Route path="followups/pos-festa" element={<ConfiguracoesFollowupsPosFesta />} />
                      <Route path="followup-proposta" element={<Navigate to="/configuracoes/followups" replace />} />
                      <Route path="followup-assinatura" element={<Navigate to="/configuracoes/followups/comercial" replace />} />
                      <Route path="pesquisa-avaliacao" element={<ConfiguracoesPesquisaAvaliacao />} />
                      <Route
                        path="integracoes/whatsapp"
                        element={
                          <TenantAdminRoute>
                            <ConfiguracoesWhatsApp />
                          </TenantAdminRoute>
                        }
                      />
                      <Route
                        path="automacoes"
                        element={
                          <TenantAdminRoute>
                            <ConfiguracoesAutomacoes />
                          </TenantAdminRoute>
                        }
                      />
                    </Route>
                    <Route path="minha-assinatura" element={<MinhaAssinatura />} />
                    <Route
                      path="suporte/novo"
                      element={
                        <TenantAdminRoute>
                          <SuporteNovo />
                        </TenantAdminRoute>
                      }
                    />
                    <Route
                      path="suporte/agente"
                      element={
                        <TenantAdminRoute>
                          <SuporteAgente />
                        </TenantAdminRoute>
                      }
                    />
                    <Route
                      path="suporte/erros"
                      element={
                        <TenantAdminRoute>
                          <SuporteErros />
                        </TenantAdminRoute>
                      }
                    />
                    <Route path="suporte/:id" element={<SuporteDetalhe />} />
                    <Route
                      path="suporte"
                      element={
                        <TenantAdminRoute>
                          <Suporte />
                        </TenantAdminRoute>
                      }
                    />
                  </Route>
                </Route>
              </Routes>
            </GuidedSetupProvider>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
