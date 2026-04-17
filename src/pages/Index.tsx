import AppLayout from "@/components/AppLayout";
import MetricCard from "@/components/MetricCard";
import MiniCalendar from "@/components/MiniCalendar";
import PartyList from "@/components/PartyList";
import AlertItem from "@/components/AlertItem";
import { Users, PartyPopper, TrendingUp, DollarSign, CreditCard, Clock, MessageSquare } from "lucide-react";

const Dashboard = () => {
  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Vendas Metrics */}
      <div className="mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendas</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Users} title="Leads no período" value="47" change={12} accent="primary" />
        <MetricCard icon={PartyPopper} title="Festas fechadas" value="18" change={8} accent="rosa" />
        <MetricCard icon={TrendingUp} title="Taxa de conversão" value="38%" change={5} accent="lilas" />
        <MetricCard icon={DollarSign} title="Valor vendido" value="R$ 72.400" change={15} accent="success" />
      </div>

      {/* Financeiro Metrics */}
      <div className="mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financeiro</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard icon={DollarSign} title="Faturamento do mês" value="R$ 58.200" change={10} accent="success" />
        <MetricCard icon={CreditCard} title="Valor a receber" value="R$ 24.800" accent="warning" />
        <MetricCard icon={Clock} title="Saldo pendente" value="R$ 12.300" accent="coral" />
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
                <span className="font-semibold text-warning">3</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Clientes em redes sociais</span>
                <span className="font-semibold text-primary">5</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Oportunidades futuras</span>
                <span className="font-semibold text-rosa">2</span>
              </div>
            </div>
          </div>

          {/* Comparativo */}
          <div className="glass-card p-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-3">vs. Mês Anterior</h3>
            <div className="space-y-3">
              {[
                { label: "Festas", current: 18, previous: 15, up: true },
                { label: "Faturamento", current: "R$ 58,2k", previous: "R$ 52,1k", up: true },
                { label: "Leads", current: 47, previous: 52, up: false },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{String(item.previous)}</span>
                    <span className="text-foreground">→</span>
                    <span className={`font-semibold ${item.up ? "text-success" : "text-coral"}`}>
                      {String(item.current)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right: Party list + Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <PartyList />

          {/* Atenção necessária */}
          <div className="glass-card p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Precisa de Atenção</h3>
              <span className="ml-auto text-xs font-medium text-warning bg-warning/15 px-2 py-0.5 rounded-full">5 itens</span>
            </div>
            <div className="space-y-2">
              <AlertItem type="pendencia" title="Ana Silva - Festa 19/04" description="Planejamento não respondido há 3 dias" />
              <AlertItem type="contrato" title="Pedro Lima - Festa 28/04" description="Contrato pendente de assinatura" />
              <AlertItem type="prazo" title="João Santos - Festa 22/04" description="Pagamento atrasado - 2ª parcela" />
              <AlertItem type="pendencia" title="Carla Oliveira - Festa 03/05" description="Aguardando confirmação de tema" />
              <AlertItem type="contrato" title="Lucas Ferreira - Festa 10/05" description="Proposta enviada sem retorno" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
