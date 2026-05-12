import AppLayout from "@/components/AppLayout";
import MetricCard from "@/components/MetricCard";
import MiniCalendar from "@/components/MiniCalendar";
import PartyList from "@/components/PartyList";
import AlertItem from "@/components/AlertItem";
import { Users, PartyPopper, TrendingUp, DollarSign, CreditCard, Clock, MessageSquare } from "lucide-react";
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      {error && (
        <div className="glass-card mb-6 border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Nao foi possivel carregar os dados do dashboard.
        </div>
      )}

      {/* Vendas Metrics */}
      <div className="mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendas</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Users} title="Leads no período" value={isLoading ? "..." : String(metrics?.leadsInPeriod ?? 0)} accent="primary" />
        <MetricCard icon={PartyPopper} title="Festas fechadas" value={isLoading ? "..." : String(metrics?.closedParties ?? 0)} accent="rosa" />
        <MetricCard icon={TrendingUp} title="Taxa de conversão" value={isLoading ? "..." : `${metrics?.conversionRate ?? 0}%`} accent="lilas" />
        <MetricCard icon={DollarSign} title="Valor vendido" value={isLoading ? "..." : currencyFormatter.format(metrics?.soldValue ?? 0)} accent="success" />
      </div>

      {/* Financeiro Metrics */}
      <div className="mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financeiro</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard icon={DollarSign} title="Faturamento do mês" value={isLoading ? "..." : currencyFormatter.format(metrics?.monthRevenue ?? 0)} accent="success" />
        <MetricCard icon={CreditCard} title="Valor a receber" value={isLoading ? "..." : currencyFormatter.format(metrics?.toReceive ?? 0)} accent="warning" />
        <MetricCard icon={Clock} title="Saldo pendente" value={isLoading ? "..." : currencyFormatter.format(metrics?.pendingBalance ?? 0)} accent="coral" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar */}
        <div className="lg:col-span-1 space-y-6">
          <MiniCalendar />

          {/* Pós-venda */}
          <div className="glass-card p-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pós-venda</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Feedbacks pendentes</span>
                <span className="font-semibold text-warning">{isLoading ? "..." : metrics?.feedbackPending ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Clientes em redes sociais</span>
                <span className="font-semibold text-primary">{isLoading ? "..." : metrics?.socialMediaClients ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Oportunidades futuras</span>
                <span className="font-semibold text-rosa">{isLoading ? "..." : metrics?.futureOpportunities ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Resumo operacional */}
          <div className="glass-card p-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-3">Resumo do mês</h3>
            <div className="space-y-3">
              {[
                { label: "Festas fechadas", value: isLoading ? "..." : metrics?.closedParties ?? 0 },
                { label: "Faturamento", value: isLoading ? "..." : currencyFormatter.format(metrics?.monthRevenue ?? 0) },
                { label: "Leads no período", value: isLoading ? "..." : metrics?.leadsInPeriod ?? 0 },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{String(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right: Party list + Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <PartyList isLoading={isLoading} parties={data?.upcomingParties ?? []} />

          {/* Atenção necessária */}
          <div className="glass-card p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Precisa de Atenção</h3>
              <span className="ml-auto text-xs font-medium text-warning bg-warning/15 px-2 py-0.5 rounded-full">{alerts.length} itens</span>
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
