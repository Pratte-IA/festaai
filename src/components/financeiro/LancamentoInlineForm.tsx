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
  const isDespesa = variant === "despesa";
  const showCategoriaSelect = isDespesa;
  const showCompetencia = isDespesa;

  const [dataLancamento, setDataLancamento] = useState("");
  const [competenciaMonth, setCompetenciaMonth] = useState("");
  const [valor, setValor] = useState("");
  const [complemento, setComplemento] = useState("");
  const [categoria, setCategoria] = useState("");

  const resolvedCategoria =
    variant === "despesa" ? categoria : fixedCategoriaByVariant[variant];

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
        className={`grid gap-3 ${
          showCompetencia
            ? "sm:grid-cols-2 lg:grid-cols-5"
            : showCategoriaSelect
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        <div className="space-y-1.5">
          <Label htmlFor={`evento-lancamento-pagamento-${variant}`}>
            {isDespesa ? "Data de pagamento" : "Data"}
          </Label>
          <Input
            id={`evento-lancamento-pagamento-${variant}`}
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
            <Label htmlFor="evento-despesa-competencia">Mes no resultado</Label>
            <Input
              id="evento-despesa-competencia"
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
          <Label htmlFor={`evento-lancamento-valor-${variant}`}>
            {isDesconto ? "Valor do desconto (R$)" : "Valor (R$)"}
          </Label>
          <Input
            id={`evento-lancamento-valor-${variant}`}
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
            <Label htmlFor="evento-despesa-categoria">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger id="evento-despesa-categoria">
                <SelectValue placeholder="Ex.: buffet, decoracao" />
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
          <Label htmlFor={`evento-lancamento-complemento-${variant}`}>
            {isDesconto ? "Motivo" : "Complemento"}
          </Label>
          <Input
            id={`evento-lancamento-complemento-${variant}`}
            placeholder="Opcional"
            value={complemento}
            onChange={(event) => setComplemento(event.target.value)}
          />
        </div>
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
