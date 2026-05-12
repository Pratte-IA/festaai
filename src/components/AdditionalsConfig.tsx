import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Additional } from "@/data/packagesData";
import {
  useCreateTenantAdditional,
  useDeleteTenantAdditional,
  useTenantAdditionals,
} from "@/features/configuracoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const categoryLabels: Record<string, string> = {
  buffet: "Buffet",
  estrutura: "Estrutura",
  equipe: "Equipe",
  entretenimento: "Entretenimento",
  outros: "Outros",
};

interface Props {
  hideHeader?: boolean;
}

const AdditionalsConfig = ({ hideHeader }: Props) => {
  const { data: additionals = [], isLoading } = useTenantAdditionals();
  const createAdditional = useCreateTenantAdditional();
  const deleteAdditional = useDeleteTenantAdditional();
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Additional, "id">>({
    category: "outros",
    name: "",
    price: 0,
    type: "fixo",
  });

  const saveAdditional = async () => {
    if (!draft.name.trim()) return;

    try {
      await createAdditional.mutateAsync(draft);
      toast({ title: "Adicional salvo" });
      setDraft({ category: "outros", name: "", price: 0, type: "fixo" });
      setIsCreating(false);
    } catch {
      toast({
        title: "Nao foi possivel salvar o adicional",
        description: "Revise os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      {hideHeader && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreating((current) => !current)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Adicional
          </button>
        </div>
      )}

      {isCreating && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-primary/40 bg-card/60 p-4 md:grid-cols-5">
          <Input
            className="md:col-span-2"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Nome do adicional"
          />
          <Input
            min="0"
            step="0.01"
            type="number"
            value={draft.price || ""}
            onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
            placeholder="Valor"
          />
          <select
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value as Additional["category"] })}
            className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-sm text-foreground"
          >
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <Button onClick={saveAdditional} disabled={createAdditional.isPending}>
            Salvar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando adicionais...</p>}
        {!isLoading && additionals.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center md:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Nenhum adicional cadastrado.</p>
          </div>
        )}
        {additionals.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border/60 bg-card/40 p-4 flex items-center justify-between hover:border-border transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                  item.type === "fixo"
                    ? "bg-primary/10 text-primary"
                    : "bg-rosa/10 text-rosa"
                }`}>
                  {item.type === "fixo" ? "Fixo" : "Por unidade"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">
                  {formatCurrency(item.price)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {categoryLabels[item.category]}
                </span>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await deleteAdditional.mutateAsync(item.id);
                  toast({ title: "Adicional removido" });
                } catch {
                  toast({
                    title: "Nao foi possivel remover o adicional",
                    description: "Tente novamente em instantes.",
                    variant: "destructive",
                  });
                }
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdditionalsConfig;
