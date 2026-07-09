import AppLayout from "@/components/AppLayout";
import MetricCard from "@/components/MetricCard";
import MiniCalendar from "@/components/MiniCalendar";
import AlertItem from "@/components/AlertItem";
import { DashboardCommercialActivity } from "@/components/dashboard/DashboardCommercialActivity";
import { DashboardTodayGuide } from "@/components/dashboard/DashboardTodayGuide";
import { PublicFormCopyButton } from "@/components/formulario-contratacao/PublicFormCopyButton";
import { CreditCard, Clock, MessageSquare, Wallet, Receipt, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/features/dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useDashboardData();
  const metrics = data?.metrics;
  const alerts = data?.alerts ?? [];

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu guia do dia — o que fazer agora e o que o FestaAI cuida por você
          </p>
        </div>
        <PublicFormCopyButton />
      </div>

      {error && (
        <div className="glass-card mb-6 border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Nao foi possivel carregar os dados do dashboard.
        </div>
      )}

      <DashboardTodayGuide
        festaAiDailyStatus={data?.festaAiDailyStatus}
        isLoading={isLoading}
        operationalGuide={data?.operationalGuide}
      />

      <DashboardCommercialActivity activity={data?.commercialActivity} isLoading={isLoading} />

      <div className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financeiro</span>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={DollarSign} title="Faturamento do mês" value={isLoading ? "..." : currencyFormatter.format(metrics?.monthRevenue ?? 0)} accent="success" />
        <MetricCard icon={Wallet} title="Faturamento Entradas" value={isLoading ? "..." : currencyFormatter.format(metrics?.monthFestaEntradas ?? 0)} accent="primary" />
        <MetricCard icon={Receipt} title="Pagamentos recebidos no mês" value={isLoading ? "..." : currencyFormatter.format(metrics?.monthPaymentsReceived ?? 0)} accent="lilas" />
        <MetricCard icon={CreditCard} title="Valor a receber" value={isLoading ? "..." : currencyFormatter.format(metrics?.toReceive ?? 0)} accent="warning" />
        <MetricCard icon={Clock} title="Saldo Pendente - Em Atraso" value={isLoading ? "..." : currencyFormatter.format(metrics?.pendingBalance ?? 0)} accent="coral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <MiniCalendar />

          <div className="glass-card animate-fade-in p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Pós-venda</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Feedbacks pendentes</span>
                <span className="font-semibold text-warning">{isLoading ? "..." : metrics?.feedbackPending ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Clientes em redes sociais</span>
                <span className="font-semibold text-primary">{isLoading ? "..." : metrics?.socialMediaClients ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Oportunidades futuras</span>
                <span className="font-semibold text-rosa">{isLoading ? "..." : metrics?.futureOpportunities ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="glass-card animate-fade-in p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Resumo do mês</h3>
            <div className="space-y-3">
              {[
                { label: "Festas fechadas", value: isLoading ? "..." : metrics?.closedParties ?? 0 },
                { label: "Faturamento", value: isLoading ? "..." : currencyFormatter.format(metrics?.monthRevenue ?? 0) },
                { label: "Leads no período", value: isLoading ? "..." : metrics?.leadsInPeriod ?? 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{String(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="glass-card animate-fade-in p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Precisa de Atenção</h3>
              <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                {alerts.length} itens
              </span>
            </div>
            <div className="space-y-2">
              {isLoading && <p className="text-sm text-muted-foreground">Carregando prioridades...</p>}
              {!isLoading && alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma pendência crítica no momento.</p>
              )}
              {alerts.map((alert) => (
                <AlertItem
                  key={`${alert.type}-${alert.eventoId}-${alert.description}`}
                  type={alert.type}
                  title={alert.title}
                  description={alert.description}
                  onClick={() => navigate(`/crm/evento/${alert.eventoId}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
