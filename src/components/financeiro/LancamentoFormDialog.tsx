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
  FINANCEIRO_CATEGORIAS_SAIDA_EVENTO,
  FINANCEIRO_CATEGORIAS_SAIDA_GERAL,
  useCreateFinanceiroLancamento,
} from "@/features/financeiro";
import { toast } from "@/hooks/use-toast";

type LancamentoFormMode = "upsell" | "despesa_evento" | "despesa_geral" | "entrada_geral";

interface LancamentoFormDialogProps {
  eventoId?: number | null;
  mode: LancamentoFormMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const modeLabels: Record<LancamentoFormMode, string> = {
  despesa_evento: "Nova despesa da festa",
  despesa_geral: "Nova despesa geral",
  entrada_geral: "Nova entrada geral",
  upsell: "Nova venda extra",
};

export const LancamentoFormDialog = ({ eventoId, mode, onOpenChange, open }: LancamentoFormDialogProps) => {
  const createLancamento = useCreateFinanceiroLancamento();
  const [dataLancamento, setDataLancamento] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [categoria, setCategoria] = useState("");

  const resetForm = () => {
    setDataLancamento("");
    setValor("");
    setDescricao("");
    setObservacao("");
    setCategoria("");
  };

  const handleSubmit = async () => {
    const parsedValor = Number(valor);

    if (!dataLancamento || !Number.isFinite(parsedValor) || parsedValor <= 0) {
      toast({
        title: "Dados invalidos",
        description: "Informe data e valor validos.",
        variant: "destructive",
      });
      return;
    }

    const isUpsell = mode === "upsell";
    const isEntradaGeral = mode === "entrada_geral";
    const isDespesa = mode === "despesa_evento" || mode === "despesa_geral";

    if (isDespesa && !categoria) {
      toast({
        title: "Categoria obrigatoria",
        description: "Selecione uma categoria para a despesa.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createLancamento.mutateAsync({
        categoria: isUpsell ? "upsell" : isEntradaGeral ? "outros" : categoria,
        data_lancamento: dataLancamento,
        descricao: descricao.trim() || null,
        eventoId: mode === "despesa_geral" || mode === "entrada_geral" ? null : eventoId ?? null,
        observacao: observacao.trim() || null,
        origem: isUpsell ? "upsell" : "manual",
        tipo: isDespesa ? "saida" : "entrada",
        valor: parsedValor,
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

  const categoriaOptions =
    mode === "despesa_geral" ? FINANCEIRO_CATEGORIAS_SAIDA_GERAL : FINANCEIRO_CATEGORIAS_SAIDA_EVENTO;

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
            <Label htmlFor="valor-lancamento">Valor (R$)</Label>
            <Input
              id="valor-lancamento"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
            />
          </div>

          {(mode === "despesa_evento" || mode === "despesa_geral") && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoriaOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="descricao-lancamento">Descricao</Label>
            <Input
              id="descricao-lancamento"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Ex.: Decoração extra, aluguel do mes..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao-lancamento">Observacao</Label>
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
