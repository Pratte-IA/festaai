import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AppLayout from "@/components/AppLayout";
import { FinanceiroDashboard } from "@/components/financeiro/FinanceiroDashboard";
import { FinanceiroDreTab } from "@/components/financeiro/FinanceiroDreTab";
import { FinanceiroEntradasTab } from "@/components/financeiro/FinanceiroEntradasTab";
import { FinanceiroExportButton } from "@/components/financeiro/FinanceiroExportButton";
import { FinanceiroMonthFilter } from "@/components/financeiro/FinanceiroMonthFilter";
import { FinanceiroSaidasTab } from "@/components/financeiro/FinanceiroSaidasTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildDashboardSaidaRows,
  buildDreEntradas,
  buildDreSaidas,
  buildDreStatement,
  buildEntradasManuaisGerais,
  buildSaidasFestas,
  buildSaidasGerais,
  FinanceiroDisplayItem,
  getDefaultFinanceiroMonth,
  getMonthRange,
  useDeleteFinanceiroLancamento,
  useFinanceiroContratoEntradas,
  useFinanceiroLancamentos,
} from "@/features/financeiro";
import { toast } from "@/hooks/use-toast";

type FinanceiroTab = "dashboard" | "dre" | "entradas" | "saidas";

const isFinanceiroTab = (value: string | null): value is FinanceiroTab =>
  value === "dashboard" || value === "dre" || value === "entradas" || value === "saidas";

const Financeiro = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: FinanceiroTab = isFinanceiroTab(tabParam) ? tabParam : "dashboard";

  const [month, setMonth] = useState(getDefaultFinanceiroMonth);

  const { from, to } = useMemo(() => getMonthRange(month), [month]);
  const { data: lancamentos = [], isLoading: isLancamentosLoading } = useFinanceiroLancamentos({ from, to });
  const { data: contratoEntradas = [], isLoading: isContratoLoading } = useFinanceiroContratoEntradas(from, to);
  const deleteLancamento = useDeleteFinanceiroLancamento();

  const entradasFestas = useMemo(() => buildDreEntradas(contratoEntradas), [contratoEntradas]);
  const entradasManuais = useMemo(() => buildEntradasManuaisGerais(lancamentos), [lancamentos]);
  const saidasGerais = useMemo(() => buildSaidasGerais(lancamentos), [lancamentos]);
  const saidasFestas = useMemo(() => buildSaidasFestas(lancamentos), [lancamentos]);
  const dreSaidas = useMemo(() => buildDreSaidas(lancamentos), [lancamentos]);
  const dreStatement = useMemo(
    () => buildDreStatement(contratoEntradas, lancamentos),
    [contratoEntradas, lancamentos],
  );
  const dashboardSaidaRows = useMemo(
    () =>
      buildDashboardSaidaRows(
        dreSaidas.map((item) => ({ categoria: item.categoria, valor: item.valor })),
      ),
    [dreSaidas],
  );
  const isLoading = isLancamentosLoading || isContratoLoading;

  const exportData = useMemo(
    () => ({
      dreStatement,
      entradasFestas,
      entradasManuais,
      from,
      month,
      saidasFestas,
      saidasGerais,
      to,
    }),
    [dreStatement, entradasFestas, entradasManuais, from, month, saidasFestas, saidasGerais, to],
  );

  const handleTabChange = (value: string) => {
    if (!isFinanceiroTab(value)) {
      return;
    }

    setSearchParams(value === "dashboard" ? {} : { tab: value }, { replace: true });
  };

  const handleDelete = async (item: FinanceiroDisplayItem) => {
    if (!item.ledgerId) {
      return;
    }

    if (!window.confirm("Remover este lancamento?")) {
      return;
    }

    try {
      await deleteLancamento.mutateAsync({ eventoId: item.evento_id, id: item.ledgerId });
      toast({ title: "Lancamento removido" });
    } catch {
      toast({
        title: "Nao foi possivel remover",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visao executiva do mes com entradas, saidas, resultado e indicadores.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <FinanceiroMonthFilter month={month} onMonthChange={setMonth} />
          <FinanceiroExportButton data={exportData} disabled={isLoading} />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid h-auto w-full max-w-2xl grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas">Saidas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <FinanceiroDashboard
              contratoCount={contratoEntradas.length}
              isLoading={isLoading}
              month={month}
              saidaRows={dashboardSaidaRows}
              statement={dreStatement}
            />
          </TabsContent>

          <TabsContent value="dre">
            <FinanceiroDreTab isLoading={isLoading} month={month} statement={dreStatement} />
          </TabsContent>

          <TabsContent value="entradas">
            <FinanceiroEntradasTab
              entradasFestas={entradasFestas}
              entradasManuais={entradasManuais}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="saidas">
            <FinanceiroSaidasTab
              isLoading={isLoading}
              onDelete={handleDelete}
              saidasFestas={saidasFestas}
              saidasGerais={saidasGerais}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
