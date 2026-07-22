import AppLayout from "@/components/AppLayout";
import MetricCard from "@/components/MetricCard";
import MiniCalendar from "@/components/MiniCalendar";
import { DashboardCommercialActivity } from "@/components/dashboard/DashboardCommercialActivity";
import { DashboardNeedsAttention } from "@/components/dashboard/DashboardNeedsAttention";
import { DashboardTodayGuide } from "@/components/dashboard/DashboardTodayGuide";
import { PublicFormCopyButton } from "@/components/formulario-contratacao/PublicFormCopyButton";
import { CreditCard, Clock, Wallet, Receipt, DollarSign } from "lucide-react";
import { useDashboardData } from "@/features/dashboard";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const Dashboard = () => {
  const { data, error, isLoading } = useDashboardData();
  const metrics = data?.metrics;

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

      <div className="mb-8">
        <DashboardNeedsAttention attention={data?.needsAttention} isLoading={isLoading} />
      </div>

      <div className="mb-8">
        <div className="glass-card animate-fade-in p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Financeiro</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard embedded icon={DollarSign} title="Faturamento do mês" value={isLoading ? "..." : currencyFormatter.format(metrics?.monthRevenue ?? 0)} accent="success" />
            <MetricCard embedded icon={Wallet} title="Faturamento Entradas" value={isLoading ? "..." : currencyFormatter.format(metrics?.monthFestaEntradas ?? 0)} accent="primary" />
            <MetricCard embedded icon={Receipt} title="Pagamentos recebidos no mês" value={isLoading ? "..." : currencyFormatter.format(metrics?.monthPaymentsReceived ?? 0)} accent="lilas" />
            <MetricCard embedded icon={CreditCard} title="Valor a receber" value={isLoading ? "..." : currencyFormatter.format(metrics?.toReceive ?? 0)} accent="warning" />
            <MetricCard embedded icon={Clock} title="Saldo Pendente - Em Atraso" value={isLoading ? "..." : currencyFormatter.format(metrics?.pendingBalance ?? 0)} accent="coral" />
          </div>
        </div>
      </div>

      <div className="max-w-md">
        <MiniCalendar />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
