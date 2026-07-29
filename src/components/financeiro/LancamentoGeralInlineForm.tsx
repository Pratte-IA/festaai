import { useState } from "react";

import { InlineFormActions, InlineFormShell } from "@/components/financeiro/InlineFormActions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const showCompetencia = !isEntrada;

  const [dataLancamento, setDataLancamento] = useState("");
  const [competenciaMonth, setCompetenciaMonth] = useState("");
  const [valor, setValor] = useState("");
  const [complemento, setComplemento] = useState("");
  const [categoria, setCategoria] = useState("");

  const resolvedCategoria = isEntrada ? ENTRADA_GERAL_CATEGORIA : categoria;

  const handleDataLancamentoChange = (value: string) => {
    setDataLancamento(value);
    if (showCompetencia && value && !competenciaMonth) {
      setCompetenciaMonth(value.slice(0, 7));
    }
  };

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

    if (showCompetencia && !competenciaMonth) {
      toast({
        title: "Competencia obrigatoria",
        description: "Informe o mes em que a despesa entra no resultado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createLancamento.mutateAsync({
        categoria: resolvedCategoria,
        data_competencia: showCompetencia ? `${competenciaMonth}-01` : undefined,
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
        className={`grid gap-3 ${
          showCompetencia
            ? "sm:grid-cols-2 lg:grid-cols-5"
            : showCategoriaSelect
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        <div className="space-y-1.5">
          <Label htmlFor="despesa-geral-pagamento">
            {isEntrada ? "Data" : "Data de pagamento"}
          </Label>
          <Input
            id="despesa-geral-pagamento"
            type="date"
            value={dataLancamento}
            onChange={(event) => handleDataLancamentoChange(event.target.value)}
          />
          {showCompetencia ? (
            <p className="text-[11px] leading-snug text-muted-foreground">
              Quando o dinheiro saiu da conta (fluxo de caixa).
            </p>
          ) : null}
        </div>

        {showCompetencia ? (
          <div className="space-y-1.5">
            <Label htmlFor="despesa-geral-competencia">Mes no resultado</Label>
            <Input
              id="despesa-geral-competencia"
              type="month"
              value={competenciaMonth}
              onChange={(event) => setCompetenciaMonth(event.target.value)}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Em qual mes essa despesa entra na Competencia.
            </p>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="despesa-geral-valor">Valor (R$)</Label>
          <Input
            id="despesa-geral-valor"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={valor}
            onChange={(event) => setValor(event.target.value)}
          />
        </div>

        {showCategoriaSelect ? (
          <div className="space-y-1.5">
            <Label htmlFor="despesa-geral-categoria">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger id="despesa-geral-categoria">
                <SelectValue placeholder="Ex.: aluguel, marketing" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FINANCEIRO_CATEGORIAS_SAIDA).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="despesa-geral-complemento">Complemento</Label>
          <Input
            id="despesa-geral-complemento"
            placeholder="Opcional"
            value={complemento}
            onChange={(event) => setComplemento(event.target.value)}
          />
        </div>
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
