import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FINANCEIRO_CATEGORIAS_ENTRADA,
  FINANCEIRO_CATEGORIAS_SAIDA,
  isFinanceiroCategoriaDesconto,
  resolveFinanceiroLancamentoValor,
  useCreateFinanceiroLancamento,
} from "@/features/financeiro";
import { toast } from "@/hooks/use-toast";

export type LancamentoFormMode = "entrada_evento" | "entrada_geral" | "despesa_evento" | "despesa_geral";

interface LancamentoFormDialogProps {
  defaultCategoria?: string;
  eventoId?: number | null;
  mode: LancamentoFormMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const modeLabels: Record<LancamentoFormMode, string> = {
  despesa_evento: "Nova despesa da festa",
  despesa_geral: "Nova despesa geral",
  entrada_evento: "Nova entrada da festa",
  entrada_geral: "Nova entrada geral",
};

const defaultCategoriaByMode: Record<LancamentoFormMode, string> = {
  despesa_evento: "",
  despesa_geral: "",
  entrada_evento: "pagamento_contrato",
  entrada_geral: "pagamento_contrato",
};

export const LancamentoFormDialog = ({
  defaultCategoria,
  eventoId,
  mode,
  onOpenChange,
  open,
}: LancamentoFormDialogProps) => {
  const createLancamento = useCreateFinanceiroLancamento();
  const [dataLancamento, setDataLancamento] = useState("");
  const [valor, setValor] = useState("");
  const [complemento, setComplemento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [categoria, setCategoria] = useState(defaultCategoria ?? defaultCategoriaByMode[mode]);

  const isEntrada = mode === "entrada_evento" || mode === "entrada_geral";
  const isDesconto = isEntrada && isFinanceiroCategoriaDesconto(categoria);
  const categoriaOptions = isEntrada ? FINANCEIRO_CATEGORIAS_ENTRADA : FINANCEIRO_CATEGORIAS_SAIDA;

  const resetForm = () => {
    setDataLancamento("");
    setValor("");
    setComplemento("");
    setObservacao("");
    setCategoria(defaultCategoria ?? defaultCategoriaByMode[mode]);
  };

  const handleSubmit = async () => {
    const parsedValor = Number(valor);
    const valorResolvido = categoria ? resolveFinanceiroLancamentoValor(categoria, parsedValor) : null;

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

    if (!categoria) {
      toast({
        title: "Descricao obrigatoria",
        description: "Selecione uma descricao para o lancamento.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createLancamento.mutateAsync({
        categoria,
        data_lancamento: dataLancamento,
        descricao: complemento.trim() || null,
        eventoId: mode === "despesa_geral" || mode === "entrada_geral" ? null : eventoId ?? null,
        observacao: observacao.trim() || null,
        origem: "manual",
        tipo: isEntrada ? "entrada" : "saida",
        valor: valorResolvido,
      });

      toast({ title: "Lancamento registrado" });
      resetForm();
      onOpenChange(false);
    } catch {
      toast({
        title: "Nao foi possivel salvar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{modeLabels[mode]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data-lancamento">Data</Label>
            <Input
              id="data-lancamento"
              type="date"
              value={dataLancamento}
              onChange={(event) => setDataLancamento(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor-lancamento">
              {isDesconto ? "Valor do desconto (R$)" : "Valor (R$)"}
            </Label>
            <Input
              id="valor-lancamento"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
            />
            {isDesconto ? (
              <p className="text-xs text-muted-foreground">
                Informe o valor positivo; sera registrado como negativo nas entradas.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a descricao" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoriaOptions).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usada para unificar o total gasto ou recebido em cada item no fim do mes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complemento-lancamento">Complemento (opcional)</Label>
            <Input
              id="complemento-lancamento"
              value={complemento}
              onChange={(event) => setComplemento(event.target.value)}
              placeholder="Ex.: Festa da Maria, fornecedor X..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao-lancamento">Observacao interna</Label>
            <Textarea
              id="observacao-lancamento"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createLancamento.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
