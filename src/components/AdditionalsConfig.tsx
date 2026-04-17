import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Additional, defaultAdditionals } from "@/data/packagesData";

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
  const [additionals] = useState<Additional[]>(defaultAdditionals);

  return (
    <div className="space-y-5">
      {hideHeader && (
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Novo Adicional
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdditionalsConfig;
