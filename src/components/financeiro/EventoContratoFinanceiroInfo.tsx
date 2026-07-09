import { formatFinanceiroCurrency } from "@/components/financeiro/FinanceiroSummaryStats";
import {
  ConvidadosAlteracaoHistoricoEntry,
  getSignedContractFinancialSnapshot,
  parseConvidadosAlteracoesHistorico,
} from "@/features/eventos/evento-guest-pricing";
import { EventoContract } from "@/features/eventos/contracts/contract-types";
import { Evento } from "@/features/eventos";
import { formatIsoDateBR } from "@/lib/date";

interface EventoContratoFinanceiroInfoProps {
  contract?: EventoContract | null;
  descontoTotal?: number;
  event: Evento;
  receivableTotal?: number;
  upsellTotal?: number;
}

export const EventoContratoFinanceiroInfo = ({
  contract,
  descontoTotal = 0,
  event,
  receivableTotal,
  upsellTotal = 0,
}: EventoContratoFinanceiroInfoProps) => {
  const history = parseConvidadosAlteracoesHistorico(event.convidados_alteracoes_historico);
  const signedSnapshot = getSignedContractFinancialSnapshot(
    contract?.status === "accepted" ? contract.contractSnapshot.evento : undefined,
  );
  const hasSignedContract =
    contract?.status === "accepted" &&
    signedSnapshot.quantidadeConvidados != null &&
    signedSnapshot.valorTotal != null;

  const hasReceivableAdjustments = upsellTotal > 0 || descontoTotal < 0;
  const totalAReceber = receivableTotal ?? event.valor_total;

  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrato (informativo)</p>
        {hasSignedContract ? (
          <p className="mt-2 text-sm text-foreground">
            Contrato assinado para{" "}
            <span className="font-medium">{signedSnapshot.quantidadeConvidados} pessoas</span> —{" "}
            <span className="font-medium">{formatFinanceiroCurrency(signedSnapshot.valorTotal ?? 0)}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Valores atuais do evento (sem contrato assinado registrado).
          </p>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-2 border-t border-border/30 pt-3">
          {history.map((entry, index) => (
            <HistoricoAlteracaoLine key={`${entry.altered_at}-${index}`} entry={entry} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3 border-t border-border/30 pt-3">
        <InfoItem label="Pacote (atual)" value={formatFinanceiroCurrency(event.valor_pacote)} />
        <InfoItem label="Adicionais (atual)" value={formatFinanceiroCurrency(event.valor_adicionais)} />
        <InfoItem
          label="Total interno (atual)"
          value={formatFinanceiroCurrency(event.valor_total)}
          highlight={!hasReceivableAdjustments}
        />
      </div>

      {hasReceivableAdjustments ? (
        <div className="grid gap-2 sm:grid-cols-3 border-t border-border/30 pt-3">
          {upsellTotal > 0 ? (
            <InfoItem label="Novos adicionais" value={formatFinanceiroCurrency(upsellTotal)} />
          ) : null}
          {descontoTotal < 0 ? (
            <InfoItem
              label="Descontos"
              negative
              value={formatFinanceiroCurrency(descontoTotal)}
            />
          ) : null}
          <InfoItem label="Total a receber" highlight value={formatFinanceiroCurrency(totalAReceber)} />
        </div>
      ) : null}

      {hasSignedContract && history.length > 0 ? (
        <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">
          O contrato não será reenviado ou ajustado. Apenas a informação interna foi atualizada.
        </p>
      ) : null}
    </div>
  );
};

const HistoricoAlteracaoLine = ({ entry }: { entry: ConvidadosAlteracaoHistoricoEntry }) => (
  <p className="text-sm text-foreground">
    Alterado em <span className="font-medium">{formatIsoDateBR(entry.altered_at)}</span> para{" "}
    <span className="font-medium">{entry.new_guest_count} convidados</span>, novo valor{" "}
    <span className="font-medium">{formatFinanceiroCurrency(entry.new_valor_total)}</span>
  </p>
);

const InfoItem = ({
  highlight = false,
  label,
  negative = false,
  value,
}: {
  highlight?: boolean;
  label: string;
  negative?: boolean;
  value: string;
}) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p
      className={`mt-1 text-sm font-medium ${
        negative ? "text-destructive" : highlight ? "text-primary" : ""
      }`}
    >
      {value}
    </p>
  </div>
);
