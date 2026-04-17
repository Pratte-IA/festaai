import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { CommercialPlan, SetupType, defaultPlans } from "@/data/plansData";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface Props {
  hideHeader?: boolean;
}

const emptyPlan: Omit<CommercialPlan, "id"> = {
  nome: "",
  setupTipo: "avista",
  setupValor: 0,
  setupParcelas: null,
  mensalidadeValor: 0,
  fidelidadeMeses: null,
  ativo: true,
};

const PlansConfig = ({ hideHeader }: Props) => {
  const [plans, setPlans] = useState<CommercialPlan[]>(defaultPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<CommercialPlan, "id">>(emptyPlan);

  const startCreate = () => {
    setDraft(emptyPlan);
    setIsCreating(true);
    setEditingId(null);
  };

  const startEdit = (plan: CommercialPlan) => {
    const { id, ...rest } = plan;
    setDraft(rest);
    setEditingId(id);
    setIsCreating(false);
  };

  const cancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setDraft(emptyPlan);
  };

  const save = () => {
    if (!draft.nome.trim()) return;
    const normalized: Omit<CommercialPlan, "id"> = {
      ...draft,
      setupParcelas: draft.setupTipo === "parcelado" ? draft.setupParcelas || 1 : null,
      fidelidadeMeses: draft.fidelidadeMeses || null,
    };

    if (editingId) {
      setPlans((prev) =>
        prev.map((p) => (p.id === editingId ? { id: editingId, ...normalized } : p)),
      );
    } else {
      setPlans((prev) => [...prev, { id: crypto.randomUUID(), ...normalized }]);
    }
    cancel();
  };

  const remove = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) cancel();
  };

  const toggleActive = (id: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p)));
  };

  const renderForm = () => (
    <div className="rounded-xl border border-primary/40 bg-card/60 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          {editingId ? "Editar plano" : "Novo plano"}
        </h3>
        <button
          onClick={cancel}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Nome do plano
          </label>
          <input
            type="text"
            value={draft.nome}
            onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
            placeholder="Ex: Profissional"
            className="w-full bg-background/50 border border-border/60 rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Tipo de setup
          </label>
          <div className="flex gap-2">
            {(["avista", "parcelado"] as SetupType[]).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setDraft({ ...draft, setupTipo: tipo })}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  draft.setupTipo === tipo
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/50 text-muted-foreground border-border/60 hover:border-border"
                }`}
              >
                {tipo === "avista" ? "À vista" : "Parcelado"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Valor do setup (R$)
          </label>
          <input
            type="number"
            value={draft.setupValor || ""}
            onChange={(e) => setDraft({ ...draft, setupValor: Number(e.target.value) })}
            placeholder="0"
            className="w-full bg-background/50 border border-border/60 rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {draft.setupTipo === "parcelado" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Número de parcelas
            </label>
            <input
              type="number"
              min={1}
              value={draft.setupParcelas || ""}
              onChange={(e) =>
                setDraft({ ...draft, setupParcelas: Number(e.target.value) })
              }
              placeholder="Ex: 3"
              className="w-full bg-background/50 border border-border/60 rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Mensalidade (R$)
          </label>
          <input
            type="number"
            value={draft.mensalidadeValor || ""}
            onChange={(e) =>
              setDraft({ ...draft, mensalidadeValor: Number(e.target.value) })
            }
            placeholder="0"
            className="w-full bg-background/50 border border-border/60 rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Fidelidade em meses (opcional)
          </label>
          <input
            type="number"
            min={0}
            value={draft.fidelidadeMeses || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                fidelidadeMeses: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder="Sem fidelidade"
            className="w-full bg-background/50 border border-border/60 rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={cancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Check className="w-4 h-4" />
          {editingId ? "Salvar alterações" : "Criar plano"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {hideHeader && (
        <div className="flex justify-end">
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo plano
          </button>
        </div>
      )}

      {(isCreating || editingId) && renderForm()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isEditing = editingId === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-5 transition-colors ${
                isEditing
                  ? "border-primary/60 bg-card/60"
                  : plan.ativo
                  ? "border-border/60 bg-card/40 hover:border-border"
                  : "border-border/40 bg-card/20 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-foreground">{plan.nome}</h4>
                  <span
                    className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      plan.ativo
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {plan.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(plan)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(plan.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-border/40 pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    Setup
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(plan.setupValor)}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      {plan.setupTipo === "parcelado"
                        ? `em ${plan.setupParcelas}x`
                        : "à vista"}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    Mensalidade
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(plan.mensalidadeValor)}
                    <span className="text-xs text-muted-foreground font-normal">/mês</span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    Fidelidade
                  </p>
                  <p className="text-sm text-foreground">
                    {plan.fidelidadeMeses
                      ? `${plan.fidelidadeMeses} meses`
                      : "Sem fidelidade"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleActive(plan.id)}
                className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-lg hover:bg-background/60"
              >
                {plan.ativo ? "Desativar plano" : "Ativar plano"}
              </button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum plano cadastrado. Clique em "Novo plano" para criar.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlansConfig;
