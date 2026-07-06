import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AppLayout from "@/components/AppLayout";
import { FinanceiroDreTab } from "@/components/financeiro/FinanceiroDreTab";
import { FinanceiroEntradasTab } from "@/components/financeiro/FinanceiroEntradasTab";
import { FinanceiroMonthFilter } from "@/components/financeiro/FinanceiroMonthFilter";
import { FinanceiroSaidasTab } from "@/components/financeiro/FinanceiroSaidasTab";
import { LancamentoFormDialog } from "@/components/financeiro/LancamentoFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildDreEntradas,
  buildDreSaidas,
  FinanceiroDisplayItem,
  getDefaultFinanceiroMonth,
  getMonthRange,
  useDeleteFinanceiroLancamento,
  useFinanceiroContratoEntradas,
  useFinanceiroLancamentos,
} from "@/features/financeiro";
import { toast } from "@/hooks/use-toast";

type FinanceiroTab = "dre" | "entradas" | "saidas";

const isFinanceiroTab = (value: string | null): value is FinanceiroTab =>
  value === "dre" || value === "entradas" || value === "saidas";

const Financeiro = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: FinanceiroTab = isFinanceiroTab(tabParam) ? tabParam : "dre";

  const [month, setMonth] = useState(getDefaultFinanceiroMonth);
  const [despesaDialogOpen, setDespesaDialogOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);

  const { from, to } = useMemo(() => getMonthRange(month), [month]);
  const { data: lancamentos = [], isLoading: isLancamentosLoading } = useFinanceiroLancamentos({ from, to });
  const { data: contratoEntradas = [], isLoading: isContratoLoading } = useFinanceiroContratoEntradas(from, to);
  const deleteLancamento = useDeleteFinanceiroLancamento();

  const dreEntradas = useMemo(
    () => buildDreEntradas(contratoEntradas, lancamentos),
    [contratoEntradas, lancamentos],
  );
  const dreSaidas = useMemo(() => buildDreSaidas(lancamentos), [lancamentos]);
  const isLoading = isLancamentosLoading || isContratoLoading;

  const handleTabChange = (value: string) => {
    if (!isFinanceiroTab(value)) {
      return;
    }

    setSearchParams(value === "dre" ? {} : { tab: value }, { replace: true });
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
            DRE com entrada do contrato na assinatura; saldo e demais valores por lancamento manual.
          </p>
        </div>

        <div className="mb-6">
          <FinanceiroMonthFilter month={month} onMonthChange={setMonth} />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas">Saidas</TabsTrigger>
          </TabsList>

          <TabsContent value="dre">
            <FinanceiroDreTab entradas={dreEntradas} isLoading={isLoading} saidas={dreSaidas} />
          </TabsContent>

          <TabsContent value="entradas">
            <FinanceiroEntradasTab
              entradas={dreEntradas}
              isLoading={isLoading}
              onAddEntrada={() => setEntradaDialogOpen(true)}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="saidas">
            <FinanceiroSaidasTab
              isLoading={isLoading}
              onAddDespesa={() => setDespesaDialogOpen(true)}
              onDelete={handleDelete}
              saidas={dreSaidas}
            />
          </TabsContent>
        </Tabs>
      </div>

      <LancamentoFormDialog open={despesaDialogOpen} onOpenChange={setDespesaDialogOpen} mode="despesa_geral" />
      <LancamentoFormDialog open={entradaDialogOpen} onOpenChange={setEntradaDialogOpen} mode="entrada_geral" />
    </AppLayout>
  );
};

export default Financeiro;
