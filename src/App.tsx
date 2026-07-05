import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, PlatformAdminRoute, ProtectedRoute, RootEntry } from "@/features/auth";
import { GuidedSetupProvider } from "@/features/guided-setup";
import { TenantAdminRoute, TenantProvider } from "@/features/tenants";

const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminTenantDetail = lazy(() => import("./pages/AdminTenantDetail.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const Usuarios = lazy(() => import("./pages/Usuarios.tsx"));
const CRM = lazy(() => import("./pages/CRM.tsx"));
const Contratos = lazy(() => import("./pages/Contratos.tsx"));
const ContratoDetalhe = lazy(() => import("./pages/ContratoDetalhe.tsx"));
const Formularios = lazy(() => import("./pages/Formularios.tsx"));
const FormularioDetalhe = lazy(() => import("./pages/FormularioDetalhe.tsx"));
const Agenda = lazy(() => import("./pages/Agenda.tsx"));
const Relatorios = lazy(() => import("./pages/Relatorios.tsx"));
const Tarefas = lazy(() => import("./pages/Tarefas.tsx"));
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
const ConfiguracoesFollowupProposta = lazy(() => import("./pages/configuracoes/FollowupProposta"));
const ConfiguracoesEstrutura = lazy(() => import("./pages/configuracoes/Estrutura"));
const ConfiguracoesAdicionais = lazy(() => import("./pages/configuracoes/Adicionais"));
const ConfiguracoesWhatsApp = lazy(() => import("./pages/configuracoes/WhatsApp"));
const ConfiguracoesAutomacoes = lazy(() => import("./pages/configuracoes/Automacoes"));
const EventoDetalhe = lazy(() => import("./pages/EventoDetalhe.tsx"));
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
const Login = lazy(() => import("./pages/Login.tsx"));
const NovaSenha = lazy(() => import("./pages/NovaSenha.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ConfiguracaoInicial = lazy(() => import("./pages/ConfiguracaoInicial.tsx"));

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
            <GuidedSetupProvider>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                <Route
                  path="/admin/comercial/leads"
                  element={
                    <PlatformAdminRoute>
                      <AdminComercialLeads />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/comercial/ofertas/nova"
                  element={
                    <PlatformAdminRoute>
                      <AdminComercialOfertaForm />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/comercial/ofertas/:id"
                  element={
                    <PlatformAdminRoute>
                      <AdminComercialOfertaForm />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/comercial/ofertas"
                  element={
                    <PlatformAdminRoute>
                      <AdminComercialOfertas />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/comercial/contratos/aceite/:id"
                  element={
                    <PlatformAdminRoute>
                      <AdminComercialContratoAceiteDetalhe />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/comercial/contratos"
                  element={
                    <PlatformAdminRoute>
                      <AdminComercialContratos />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/comercial"
                  element={
                    <PlatformAdminRoute>
                      <AdminComercial />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/agent-requests/:id"
                  element={
                    <PlatformAdminRoute>
                      <AdminAgentRequestDetail />
                    </PlatformAdminRoute>
                  }
                />
                <Route
                  path="/admin/agent-requests"
                  element={
                    <PlatformAdminRoute>
                      <AdminAgentRequests />
                    </PlatformAdminRoute>
                  }
                />
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
                  path="/suporte/novo"
                  element={
                    <ProtectedRoute>
                      <TenantAdminRoute>
                        <SuporteNovo />
                      </TenantAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suporte/agente"
                  element={
                    <ProtectedRoute>
                      <TenantAdminRoute>
                        <SuporteAgente />
                      </TenantAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suporte/erros"
                  element={
                    <ProtectedRoute>
                      <TenantAdminRoute>
                        <SuporteErros />
                      </TenantAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suporte/:id"
                  element={
                    <ProtectedRoute>
                      <TenantAdminRoute>
                        <SuporteDetalhe />
                      </TenantAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suporte"
                  element={
                    <ProtectedRoute>
                      <TenantAdminRoute>
                        <Suporte />
                      </TenantAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute>
                      <Usuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuracao-inicial"
                  element={
                    <ProtectedRoute>
                      <ConfiguracaoInicial />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <RootEntry>
                      <Index />
                    </RootEntry>
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
                  path="/formularios/:eventoId"
                  element={
                    <ProtectedRoute>
                      <FormularioDetalhe />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/formularios"
                  element={
                    <ProtectedRoute>
                      <Formularios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contratos/:contractId"
                  element={
                    <ProtectedRoute>
                      <ContratoDetalhe />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contratos"
                  element={
                    <ProtectedRoute>
                      <Contratos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/agenda"
                  element={
                    <ProtectedRoute>
                      <Agenda />
                    </ProtectedRoute>
                  }
                />
                <Route path="/calendario" element={<Navigate to="/agenda" replace />} />
                <Route
                  path="/tarefas"
                  element={
                    <ProtectedRoute>
                      <Tarefas />
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
                  path="/conexoes"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/configuracoes/integracoes/whatsapp" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuracoes"
                  element={
                    <ProtectedRoute>
                      <ConfiguracoesLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ConfiguracoesHome />} />
                  <Route path="pacotes" element={<ConfiguracoesPacotes />} />
                  <Route path="adicionais" element={<ConfiguracoesAdicionais />} />
                  <Route path="estrutura" element={<ConfiguracoesEstrutura />} />
                  <Route path="checklist" element={<ConfiguracoesChecklist />} />
                  <Route path="contrato" element={<ConfiguracoesContrato />} />
                  <Route
                    path="formulario-contratacao"
                    element={<ConfiguracoesFormularioContratacao />}
                  />
                  <Route
                    path="formulario-fechamento"
                    element={<Navigate to="/configuracoes/formulario-contratacao" replace />}
                  />
                  <Route path="financeiro" element={<ConfiguracoesFinanceiro />} />
                  <Route path="followup-proposta" element={<ConfiguracoesFollowupProposta />} />
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
                <Route
                  path="/minha-assinatura"
                  element={
                    <ProtectedRoute>
                      <MinhaAssinatura />
                    </ProtectedRoute>
                  }
                />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/contratar/pagamento" element={<ContratarPagamento />} />
                <Route path="/contratar/iniciar/:planSlug" element={<ContratarIniciar />} />
                <Route path="/contratar/oferta/:token" element={<ContratarOferta />} />
                <Route path="/contratar" element={<Contratar />} />
                <Route path="/formulario/:tenantSlug" element={<FormularioCliente />} />
                <Route path="/pesquisa/:tenantSlug/:eventoId" element={<PesquisaCliente />} />
                <Route path="/login" element={<Login />} />
                <Route path="/nova-senha" element={<NovaSenha />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </GuidedSetupProvider>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
