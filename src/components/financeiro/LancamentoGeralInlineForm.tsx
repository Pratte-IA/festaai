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

export type LancamentoGeralInlineFormMode = "entrada_geral" | "despesa_geral";

interface LancamentoGeralInlineFormProps {
  mode: LancamentoGeralInlineFormMode;
  onCancel: () => void;
  onSuccess: () => void;
}

const ENTRADA_GERAL_CATEGORIA = "outras_receitas";

export const LancamentoGeralInlineForm = ({
  mode,
  onCancel,
  onSuccess,
}: LancamentoGeralInlineFormProps) => {
  const createLancamento = useCreateFinanceiroLancamento();
  const isEntrada = mode === "entrada_geral";
  const showCategoriaSelect = !isEntrada;

  const [dataLancamento, setDataLancamento] = useState("");
  const [valor, setValor] = useState("");
  const [complemento, setComplemento] = useState("");
  const [categoria, setCategoria] = useState("");

  const resolvedCategoria = isEntrada ? ENTRADA_GERAL_CATEGORIA : categoria;

  const handleSubmit = async () => {
    const parsedValor = Number(valor);
    const valorResolvido = resolvedCategoria
      ? resolveFinanceiroLancamentoValor(resolvedCategoria, parsedValor)
      : null;

    if (!dataLancamento || valorResolvido == null) {
      toast({
        title: "Dados invalidos",
        description: "Informe data e valor validos.",
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
        eventoId: null,
        origem: "manual",
        tipo: isEntrada ? "entrada" : "saida",
        valor: valorResolvido,
      });

      toast({ title: isEntrada ? "Entrada registrada" : "Despesa registrada" });
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
          placeholder="Valor (R$)"
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
          placeholder="Complemento (opcional)"
          value={complemento}
          onChange={(event) => setComplemento(event.target.value)}
        />
      </div>
      <InlineFormActions
        isPending={createLancamento.isPending}
        onCancel={onCancel}
        onSubmit={() => void handleSubmit()}
        submitLabel={isEntrada ? "Registrar entrada" : "Registrar despesa"}
      />
    </InlineFormShell>
  );
};
