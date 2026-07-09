import { useEffect, useState } from "react";

import { InlineFormActions, InlineFormShell } from "@/components/financeiro/InlineFormActions";
import { Input } from "@/components/ui/input";
import {
  Evento,
  EventoPagamento,
  useCreateEventoPagamento,
  useUpdateEvento,
  useUpdateEventoPagamento,
} from "@/features/eventos";
import { toast } from "@/hooks/use-toast";

export type PagamentoRecebidoFormTarget =
  | { kind: "create"; eventoId: number }
  | { kind: "entrada"; evento: Evento; eventoId: number }
  | { kind: "pagamento"; eventoId: number; pagamento: EventoPagamento };

interface PagamentoRecebidoInlineFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  target: PagamentoRecebidoFormTarget;
}

const mergeEntradaDate = (currentIso: string | null, nextDate: string) => {
  if (!currentIso) {
    return `${nextDate}T12:00:00.000Z`;
  }

  const timePart = currentIso.includes("T") ? currentIso.slice(currentIso.indexOf("T")) : "T12:00:00.000Z";
  return `${nextDate}${timePart}`;
};

export const PagamentoRecebidoInlineForm = ({
  onCancel,
  onSuccess,
  target,
}: PagamentoRecebidoInlineFormProps) => {
  const createPagamento = useCreateEventoPagamento();
  const updatePagamento = useUpdateEventoPagamento();
  const updateEvento = useUpdateEvento();

  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const isEntrada = target.kind === "entrada";
  const isCreate = target.kind === "create";
  const isPending = createPagamento.isPending || updatePagamento.isPending || updateEvento.isPending;

  useEffect(() => {
    if (target.kind === "create") {
      setData("");
      setDescricao("");
      setValor("");
      return;
    }

    if (target.kind === "entrada") {
      setData((target.evento.fechamento_confirmado_em ?? target.evento.created_at).slice(0, 10));
      setDescricao(target.evento.forma_pagamento_entrada?.trim() ?? "");
      setValor(String(target.evento.valor_entrada));
      return;
    }

    setData(target.pagamento.data_pagamento);
    setDescricao(target.pagamento.observacao?.trim() ?? "");
    setValor(String(target.pagamento.valor));
  }, [target]);

  const handleSubmit = async () => {
    const parsedValor = Number(valor);

    if (!data || !Number.isFinite(parsedValor) || parsedValor <= 0) {
      toast({
        title: "Dados invalidos",
        description: "Informe data e valor validos.",
        variant: "destructive",
      });
      return;
    }

    const descricaoNormalizada = descricao.trim() || null;

    try {
      if (target.kind === "create") {
        await createPagamento.mutateAsync({
          data_pagamento: data,
          eventoId: target.eventoId,
          observacao: descricaoNormalizada,
          valor: parsedValor,
        });
        toast({ title: "Pagamento registrado" });
      } else if (target.kind === "pagamento") {
        await updatePagamento.mutateAsync({
          data_pagamento: data,
          eventoId: target.eventoId,
          id: target.pagamento.id,
          observacao: descricaoNormalizada,
          valor: parsedValor,
        });
        toast({ title: "Pagamento atualizado" });
      } else {
        await updateEvento.mutateAsync({
          eventoId: target.eventoId,
          values: {
            fechamento_confirmado_em: mergeEntradaDate(target.evento.fechamento_confirmado_em, data),
            forma_pagamento_entrada: descricaoNormalizada,
            valor_entrada: parsedValor,
          },
        });
        toast({ title: "Entrada atualizada" });
      }

      onSuccess();
    } catch {
      toast({
        title: "Nao foi possivel salvar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <InlineFormShell>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Input type="date" value={data} onChange={(event) => setData(event.target.value)} />
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Valor (R$)"
          value={valor}
          onChange={(event) => setValor(event.target.value)}
        />
        <Input
          placeholder={isEntrada ? "Forma de pagamento / descricao" : "Descricao"}
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
        />
      </div>
      <InlineFormActions
        isPending={isPending}
        onCancel={onCancel}
        onSubmit={() => void handleSubmit()}
        submitLabel={isCreate ? "Registrar" : "Salvar"}
      />
    </InlineFormShell>
  );
};
