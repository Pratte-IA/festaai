import { useState } from "react";

import { InlineFormActions, InlineFormShell } from "@/components/financeiro/InlineFormActions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FINANCEIRO_CATEGORIAS_SAIDA,
  resolveFinanceiroLancamentoValor,
  useCreateFinanceiroLancamento,
} from "@/features/financeiro";
import { toast } from "@/hooks/use-toast";

export type LancamentoInlineFormMode = "entrada_evento" | "despesa_evento";
export type LancamentoInlineFormVariant = "adicional" | "desconto" | "despesa";

interface LancamentoInlineFormProps {
  eventoId: number;
  mode: LancamentoInlineFormMode;
  onCancel: () => void;
  onSuccess: () => void;
  variant?: LancamentoInlineFormVariant;
}

const fixedCategoriaByVariant: Record<Exclude<LancamentoInlineFormVariant, "despesa">, string> = {
  adicional: "adicional_contratado",
  desconto: "desconto",
};

export const LancamentoInlineForm = ({
  eventoId,
  mode,
  onCancel,
  onSuccess,
  variant = mode === "despesa_evento" ? "despesa" : "adicional",
}: LancamentoInlineFormProps) => {
  const createLancamento = useCreateFinanceiroLancamento();
  const isEntrada = mode === "entrada_evento";
  const isDesconto = variant === "desconto";
  const showCategoriaSelect = variant === "despesa";

  const [dataLancamento, setDataLancamento] = useState("");
  const [valor, setValor] = useState("");
  const [complemento, setComplemento] = useState("");
  const [categoria, setCategoria] = useState("");

  const resolvedCategoria =
    variant === "despesa" ? categoria : fixedCategoriaByVariant[variant];

  const handleSubmit = async () => {
    const parsedValor = Number(valor);
    const valorResolvido = resolvedCategoria
      ? resolveFinanceiroLancamentoValor(resolvedCategoria, parsedValor)
      : null;

    if (!dataLancamento || valorResolvido == null) {
      toast({
        title: "Dados invalidos",
        description: isDesconto
          ? "Informe data e valor do desconto (sera lancado como negativo)."
          : "Informe data e valor validos.",
        variant: "destructive",
      });
      return;
    }

    if (!resolvedCategoria) {
      toast({
        title: "Descricao obrigatoria",
        description: "Selecione uma descricao para o lancamento.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createLancamento.mutateAsync({
        categoria: resolvedCategoria,
        data_lancamento: dataLancamento,
        descricao: complemento.trim() || null,
        eventoId,
        origem: "manual",
        tipo: isEntrada ? "entrada" : "saida",
        valor: valorResolvido,
      });

      toast({
        title: isDesconto ? "Desconto aplicado" : "Lancamento registrado",
      });
      onSuccess();
    } catch {
      toast({
        title: "Nao foi possivel salvar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const submitLabel =
    variant === "desconto"
      ? "Aplicar desconto"
      : variant === "adicional"
        ? "Registrar adicional"
        : "Registrar despesa";

  return (
    <InlineFormShell>
      <div
        className={`grid gap-2 ${showCategoriaSelect ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}
      >
        <Input
          type="date"
          value={dataLancamento}
          onChange={(event) => setDataLancamento(event.target.value)}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder={isDesconto ? "Valor do desconto (R$)" : "Valor (R$)"}
          value={valor}
          onChange={(event) => setValor(event.target.value)}
        />
        {showCategoriaSelect ? (
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Descricao" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FINANCEIRO_CATEGORIAS_SAIDA).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Input
          placeholder={isDesconto ? "Motivo do desconto (opcional)" : "Complemento (opcional)"}
          value={complemento}
          onChange={(event) => setComplemento(event.target.value)}
        />
      </div>
      {isDesconto ? (
        <p className="text-xs text-muted-foreground">
          Informe o valor positivo; sera registrado como negativo nas receitas da festa.
        </p>
      ) : null}
      <InlineFormActions
        isPending={createLancamento.isPending}
        onCancel={onCancel}
        onSubmit={() => void handleSubmit()}
        submitLabel={submitLabel}
      />
    </InlineFormShell>
  );
};
