import { Link } from "react-router-dom";
import { TrendingUp, Wallet } from "lucide-react";

import { FinanceiroSummaryStats } from "@/components/financeiro/FinanceiroSummaryStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEventoFinanceiroSummary } from "@/features/financeiro";
import { Evento } from "@/features/eventos";

interface EventoResultadoFinanceiroCardProps {
  event: Evento;
  eventoId: number;
}

export const EventoResultadoFinanceiroCard = ({ event, eventoId }: EventoResultadoFinanceiroCardProps) => {
  const { isLoading, summary } = useEventoFinanceiroSummary(event);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="h-4 w-4 text-festa-rosa" />
          Resultado Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !summary ? (
          <p className="text-sm italic text-muted-foreground">Carregando resultado financeiro...</p>
        ) : (
          <FinanceiroSummaryStats
            entradaTotal={summary.entradaTotal}
            margemPercent={summary.margemPercent}
            resultado={summary.resultadoFesta}
            saidaTotal={summary.saidaTotal}
          />
        )}

        <Button asChild className="mt-4 gap-2" variant="outline">
          <Link to={`/crm/evento/${eventoId}/financeiro`}>
            <Wallet className="h-4 w-4" />
            Gerenciar esta festa
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
