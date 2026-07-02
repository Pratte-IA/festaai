import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import RecompraReport from "@/components/RecompraReport";
import LeadsPerdidosReport from "@/components/LeadsPerdidosReport";
import FinanceiroReport from "@/components/FinanceiroReport";
import FestasExecutadasReport from "@/components/FestasExecutadasReport";
import HistoricoFinanceiroReport from "@/components/HistoricoFinanceiroReport";
import OcupacaoReport from "@/components/OcupacaoReport";
import PosVendaReport from "@/components/PosVendaReport";
import { Users, UserX, DollarSign, CalendarDays, Star, ChevronRight, History, PartyPopper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ReportComponentProps, ReportPeriod } from "@/features/reports";

const reports = [
  {
    id: "recompra",
    title: "Clientes para Recompra",
    description: "Identifique clientes com potencial de fechar nova festa",
    icon: Users,
    accent: "bg-rosa/15 text-rosa",
  },
  {
    id: "leads-perdidos",
    title: "Leads Perdidos",
    description: "Leads que não fecharam e podem ser reativados",
    icon: UserX,
    accent: "bg-coral/15 text-coral",
  },
  {
    id: "financeiro",
    title: "Financeiro — Valores em Aberto",
    description: "Controle clientes com saldo devedor",
    icon: DollarSign,
    accent: "bg-warning/15 text-warning",
  },
  {
    id: "historico-financeiro",
    title: "Financeiro — Histórico",
    description: "Todo o histórico de entradas e pagamentos recebidos",
    icon: History,
    accent: "bg-success/15 text-success",
  },
  {
    id: "festas-executadas",
    title: "Festas Executadas",
    description: "Lista completa de festas do funil executadas",
    icon: PartyPopper,
    accent: "bg-festa-blue/15 text-festa-blue",
  },
  {
    id: "ocupacao",
    title: "Agenda / Ocupação",
    description: "Analise o uso do espaço e taxa de ocupação",
    icon: CalendarDays,
    accent: "bg-primary/15 text-primary",
  },
  {
    id: "pos-venda",
    title: "Pós-Venda",
    description: "Acompanhe relacionamento e feedback dos clientes",
    icon: Star,
    accent: "bg-lilas/15 text-lilas",
  },
];

const reportComponents: Record<string, { component: React.FC<ReportComponentProps>; title: string; subtitle: string }> = {
  recompra: { component: RecompraReport, title: "Clientes para Recompra", subtitle: "Clientes que já realizaram festas e têm potencial de retorno" },
  "leads-perdidos": { component: LeadsPerdidosReport, title: "Leads Perdidos", subtitle: "Leads sem contato há mais de 7 dias que podem ser reativados" },
  financeiro: { component: FinanceiroReport, title: "Financeiro — Valores em Aberto", subtitle: "Clientes com saldo devedor pendente" },
  "historico-financeiro": {
    component: HistoricoFinanceiroReport,
    title: "Financeiro — Histórico",
    subtitle: "Entradas, pagamentos e quitações de festas executadas (filtradas pela data da festa)",
  },
  "festas-executadas": {
    component: FestasExecutadasReport,
    title: "Festas Executadas",
    subtitle: "Todas as festas do funil executadas, igual ao CRM",
  },
  ocupacao: { component: OcupacaoReport, title: "Agenda / Ocupação", subtitle: "Análise de uso do espaço por período e dia da semana" },
  "pos-venda": { component: PosVendaReport, title: "Pós-Venda", subtitle: "Acompanhamento de feedback e relacionamento pós-festa" },
};

const Relatorios = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<ReportPeriod>({
    endDate: `${currentYear}-12-31`,
    startDate: `${currentYear}-01-01`,
  });

  if (activeReport && reportComponents[activeReport]) {
    const { component: ReportComponent, title, subtitle } = reportComponents[activeReport];
    return (
      <AppLayout>
        <div className="mb-6">
          <button
            onClick={() => setActiveReport(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 flex items-center gap-1"
          >
            ← Voltar aos relatórios
          </button>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="glass-card mb-6 grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          {activeReport !== "festas-executadas" ? (
            <>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Início do período</label>
                <Input
                  type="date"
                  value={period.startDate}
                  onChange={(event) => setPeriod((current) => ({ ...current, startDate: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Fim do período</label>
                <Input
                  type="date"
                  value={period.endDate}
                  onChange={(event) => setPeriod((current) => ({ ...current, endDate: event.target.value }))}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground md:col-span-2">
              Este relatório lista todas as festas do funil executadas. Use os filtros do relatório para
              refinar por data da festa, cliente ou criança.
            </p>
          )}
        </div>
        <ReportComponent period={period} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Relatórios acionáveis para impulsionar vendas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className="glass-card p-5 text-left hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.accent}`}>
                <report.icon className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mt-3">{report.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
          </button>
        ))}
      </div>
    </AppLayout>
  );
};

export default Relatorios;
