import { useEffect, useState } from "react";
import { PackageData, Additional, PricingTier } from "@/data/packagesData";
import type { EstruturaBlock } from "@/data/packagesData";
import { Trash2 } from "lucide-react";
import { buffetTemplates, itemSuggestions } from "@/data/packageTemplates";
import {
  Users, Calendar, UtensilsCrossed, Gamepad2, UsersRound,
  Plus, X, Check, ChevronRight, ChevronLeft, Sparkles,
  Info, DollarSign, Tag, Package as PackageIcon, ArrowLeft
} from "lucide-react";

interface PackageWizardProps {
  onCancel: () => void;
  onSave: (pkg: PackageData) => void;
  tenantEstrutura: EstruturaBlock;
}

const cloneEstrutura = (e: EstruturaBlock): EstruturaBlock => ({
  brinquedos: [...e.brinquedos],
  espaco: [...e.espaco],
  decoracao: [...e.decoracao],
});

const steps = [
  { key: "info", label: "Informações", icon: Info },
  { key: "buffet", label: "Buffet", icon: UtensilsCrossed },
  { key: "equipe", label: "Equipe", icon: UsersRound },
  { key: "precos", label: "Preços", icon: DollarSign },
  { key: "adicionais", label: "Adicionais", icon: Tag },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const emptyPackage: PackageData = {
  id: crypto.randomUUID(),
  name: "",
  description: "",
  buffet: { salgados: [], doces: [], bebidas: [] },
  estrutura: { brinquedos: [], espaco: [], decoracao: [] },
  equipe: { garcom: 1, monitora: 1, limpeza: 1 },
  pricingTiers: [
    { id: crypto.randomUUID(), minGuests: 1, maxGuests: 20, weekdayPrice: 0, weekendPrice: 0 },
  ],
};

const PackageWizard = ({ onCancel, onSave, tenantEstrutura }: PackageWizardProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [pkg, setPkg] = useState<PackageData>(() => ({
    ...emptyPackage,
    estrutura: cloneEstrutura(tenantEstrutura),
  }));
  const [additionals, setAdditionals] = useState<Additional[]>([]);

  useEffect(() => {
    setPkg((p) => ({ ...p, estrutura: cloneEstrutura(tenantEstrutura) }));
  }, [tenantEstrutura]);

  const finalize = (data: PackageData) =>
    onSave({ ...data, estrutura: cloneEstrutura(tenantEstrutura) });

  const currentStep = steps[stepIndex];

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const updateBuffet = (field: keyof typeof pkg.buffet, value: string[]) =>
    setPkg({ ...pkg, buffet: { ...pkg.buffet, [field]: value } });

  const applyBuffetTemplate = (key: keyof typeof buffetTemplates) =>
    setPkg({ ...pkg, buffet: { ...buffetTemplates[key] } });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para pacotes
        </button>
        <button
          onClick={() => finalize(pkg)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Check className="w-4 h-4" /> Salvar pacote
        </button>
      </div>

      {/* Stepper */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx === stepIndex;
            const isDone = idx < stepIndex;
            return (
              <button
                key={s.key}
                onClick={() => setStepIndex(idx)}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : isDone
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-xs font-medium hidden md:inline ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground hidden md:inline" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <currentStep.icon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                {stepIndex + 1}. {currentStep.label}
              </h2>
            </div>

            {/* STEP: Info */}
            {currentStep.key === "info" && (
              <div className="space-y-4">
                <Field label="Nome do pacote">
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(e) => setPkg({ ...pkg, name: e.target.value })}
                    placeholder="Ex: Pacote Premium"
                    className="input-base"
                  />
                </Field>
                <Field label="Descrição comercial">
                  <textarea
                    value={pkg.description}
                    onChange={(e) => setPkg({ ...pkg, description: e.target.value })}
                    placeholder="Texto de venda que aparecerá nas propostas..."
                    rows={3}
                    className="input-base resize-none"
                  />
                </Field>
                <p className="text-xs text-muted-foreground">
                  A faixa de convidados é definida na etapa <span className="text-foreground font-medium">Preços</span>, junto com cada tabela de valor.
                </p>
              </div>
            )}

            {/* STEP: Buffet */}
            {currentStep.key === "buffet" && (
              <div className="space-y-5">
                <p className="text-xs text-muted-foreground">
                  Os brinquedos previstos na festa seguem o que você definiu em Configurações &gt;
                  Estrutura — o preview ao lado apenas espelha essa lista.
                </p>
                <TemplateSelector
                  label="Usar modelo padrão de buffet"
                  options={[
                    { key: "basico", label: "Básico" },
                    { key: "completo", label: "Completo" },
                    { key: "gourmet", label: "Gourmet" },
                  ]}
                  onSelect={(key) => applyBuffetTemplate(key as keyof typeof buffetTemplates)}
                />
                <ItemList
                  label="Salgados"
                  items={pkg.buffet.salgados}
                  suggestions={itemSuggestions.salgados}
                  onChange={(v) => updateBuffet("salgados", v)}
                />
                <ItemList
                  label="Doces"
                  items={pkg.buffet.doces}
                  suggestions={itemSuggestions.doces}
                  onChange={(v) => updateBuffet("doces", v)}
                />
                <ItemList
                  label="Bebidas"
                  items={pkg.buffet.bebidas}
                  suggestions={itemSuggestions.bebidas}
                  onChange={(v) => updateBuffet("bebidas", v)}
                />
              </div>
            )}

            {currentStep.key === "equipe" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Defina a quantidade de profissionais inclusos no pacote.
                </p>
                {(["garcom", "monitora", "limpeza"] as const).map((role) => (
                  <div key={role} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{role}</p>
                      <p className="text-xs text-muted-foreground">Profissionais inclusos</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setPkg({
                            ...pkg,
                            equipe: { ...pkg.equipe, [role]: Math.max(0, pkg.equipe[role] - 1) },
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/70 text-foreground flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-base font-semibold text-foreground">
                        {pkg.equipe[role]}
                      </span>
                      <button
                        onClick={() =>
                          setPkg({
                            ...pkg,
                            equipe: { ...pkg.equipe, [role]: pkg.equipe[role] + 1 },
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP: Preços */}
            {currentStep.key === "precos" && (
              <PrecosStep
                tiers={pkg.pricingTiers}
                onChange={(tiers) => setPkg({ ...pkg, pricingTiers: tiers })}
              />
            )}

            {/* STEP: Adicionais */}
            {currentStep.key === "adicionais" && (
              <AdicionaisStep additionals={additionals} setAdditionals={setAdditionals} />
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-foreground text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            {stepIndex < steps.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Avançar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => finalize(pkg)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors"
              >
                <Check className="w-4 h-4" /> Concluir e salvar
              </button>
            )}
          </div>
        </div>

        {/* Preview lateral */}
        <PackagePreview pkg={pkg} additionals={additionals} />
      </div>
    </div>
  );
};

/* ===== Subcomponentes ===== */

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
    {children}
  </div>
);

const TemplateSelector = ({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: { key: string; label: string }[];
  onSelect: (key: string) => void;
}) => (
  <div className="bg-gradient-to-r from-primary/10 to-rosa/10 border border-primary/20 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="w-4 h-4 text-primary" />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          className="px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background border border-border text-xs font-medium text-foreground transition-colors"
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const ItemList = ({
  label,
  items,
  suggestions,
  onChange,
}: {
  label: string;
  items: string[];
  suggestions: string[];
  onChange: (items: string[]) => void;
}) => {
  const [input, setInput] = useState("");
  const available = suggestions.filter((s) => !items.includes(s));

  const add = (val: string) => {
    const v = val.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setInput("");
  };

  const remove = (val: string) => onChange(items.filter((i) => i !== val));

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-2">{label}</label>

      {/* Itens selecionados */}
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Nenhum item adicionado</span>
        )}
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
          >
            {item}
            <button onClick={() => remove(item)} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input + add */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(input))}
          placeholder={`Digite um novo ${label.toLowerCase().slice(0, -1)}...`}
          className="input-base flex-1 text-sm"
        />
        <button
          onClick={() => add(input)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {/* Sugestões */}
      {available.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Sugestões</p>
          <div className="flex flex-wrap gap-1.5">
            {available.slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="text-xs bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground px-2 py-1 rounded-full transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PrecosStep = ({
  tiers,
  onChange,
}: {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
}) => {
  const updateTier = (id: string, patch: Partial<PricingTier>) =>
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const removeTier = (id: string) => onChange(tiers.filter((t) => t.id !== id));

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const min = last ? last.maxGuests + 1 : 1;
    onChange([
      ...tiers,
      {
        id: crypto.randomUUID(),
        minGuests: min,
        maxGuests: min + 19,
        weekdayPrice: 0,
        weekendPrice: 0,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Defina faixas de convidados com valores específicos para dias de semana e finais de semana/feriados.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="text-left font-medium py-2 pr-2">Convidados (faixa)</th>
              <th className="text-left font-medium py-2 px-2">Preço semana</th>
              <th className="text-left font-medium py-2 px-2">Preço fim de semana</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id} className="border-b border-border/50">
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tier.minGuests}
                      onChange={(e) => updateTier(tier.id, { minGuests: Number(e.target.value) })}
                      className="input-base w-16 text-sm"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">a</span>
                    <input
                      type="number"
                      value={tier.maxGuests}
                      onChange={(e) => updateTier(tier.id, { maxGuests: Number(e.target.value) })}
                      className="input-base w-16 text-sm"
                      min={0}
                    />
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="number"
                      value={tier.weekdayPrice || ""}
                      onChange={(e) =>
                        updateTier(tier.id, { weekdayPrice: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="input-base pl-8 text-sm w-full"
                    />
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-rosa" />
                    <input
                      type="number"
                      value={tier.weekendPrice || ""}
                      onChange={(e) =>
                        updateTier(tier.id, { weekendPrice: Number(e.target.value) })
                      }
                      placeholder="0"
                      className="input-base pl-8 text-sm w-full"
                    />
                  </div>
                </td>
                <td className="py-2 pl-2">
                  <button
                    onClick={() => removeTier(tier.id)}
                    disabled={tiers.length === 1}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addTier}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary hover:text-primary text-sm font-medium text-muted-foreground transition-colors"
      >
        <Plus className="w-4 h-4" /> Adicionar faixa
      </button>
    </div>
  );
};

const AdicionaisStep = ({
  additionals,
  setAdditionals,
}: {
  additionals: Additional[];
  setAdditionals: (a: Additional[]) => void;
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Additional["category"]>("outros");
  const [type, setType] = useState<Additional["type"]>("fixo");

  const add = () => {
    if (!name.trim() || !price) return;
    setAdditionals([
      ...additionals,
      { id: crypto.randomUUID(), name, price: Number(price), category, type },
    ]);
    setName("");
    setPrice("");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Crie itens opcionais que podem ser incluídos sob demanda nas propostas.
      </p>

      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do adicional"
            className="input-base text-sm"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preço (R$)"
            className="input-base text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Additional["category"])}
            className="input-base text-sm"
          >
            <option value="buffet">Buffet</option>
            <option value="estrutura">Estrutura</option>
            <option value="equipe">Equipe</option>
            <option value="entretenimento">Entretenimento</option>
            <option value="outros">Outros</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Additional["type"])}
            className="input-base text-sm"
          >
            <option value="fixo">Fixo</option>
            <option value="por_unidade">Por unidade</option>
          </select>
        </div>
        <button
          onClick={add}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Adicionar adicional
        </button>
      </div>

      {additionals.length > 0 && (
        <div className="space-y-2">
          {additionals.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.category} • {a.type === "fixo" ? "Fixo" : "Por unidade"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(a.price)}
                </span>
                <button
                  onClick={() => setAdditionals(additionals.filter((x) => x.id !== a.id))}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const PackagePreview = ({ pkg, additionals }: { pkg: PackageData; additionals: Additional[] }) => (
  <div className="lg:col-span-1">
    <div className="glass-card p-5 lg:sticky lg:top-4 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <PackageIcon className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Preview da proposta
        </p>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground">
          {pkg.name || <span className="text-muted-foreground italic">Nome do pacote</span>}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
          {pkg.description || "Descrição comercial aparecerá aqui..."}
        </p>
        {pkg.pricingTiers.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {pkg.pricingTiers[0].minGuests}–
            {pkg.pricingTiers[pkg.pricingTiers.length - 1].maxGuests} convidados
          </div>
        )}
      </div>

      <PreviewBlock
        icon={<UtensilsCrossed className="w-3.5 h-3.5 text-coral" />}
        title="Buffet"
        sections={[
          { label: "Salgados", items: pkg.buffet.salgados },
          { label: "Doces", items: pkg.buffet.doces },
          { label: "Bebidas", items: pkg.buffet.bebidas },
        ]}
      />

      <PreviewBlock
        icon={<Gamepad2 className="w-3.5 h-3.5 text-primary" />}
        title="Brinquedos"
        sections={[{ label: "Inclusos", items: pkg.estrutura.brinquedos }]}
      />

      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <UsersRound className="w-3.5 h-3.5 text-success" />
          <p className="text-xs font-semibold text-foreground">Equipe</p>
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>{pkg.equipe.garcom}x Garçom · {pkg.equipe.monitora}x Monitora · {pkg.equipe.limpeza}x Limpeza</p>
        </div>
      </div>

      <div className="pt-3 border-t border-border space-y-1.5">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
          Tabela de preços
        </p>
        {pkg.pricingTiers.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nenhuma faixa cadastrada</p>
        )}
        {pkg.pricingTiers.map((tier) => (
          <div key={tier.id} className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              {tier.minGuests}–{tier.maxGuests} convidados
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="text-muted-foreground">Seg-Sex</span>
              <span className="font-semibold text-foreground">{formatCurrency(tier.weekdayPrice)}</span>
            </div>
            <div className="flex items-center justify-between pl-4">
              <span className="text-muted-foreground">Sáb-Dom</span>
              <span className="font-semibold text-rosa">{formatCurrency(tier.weekendPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      {additionals.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-semibold text-foreground mb-2">
            Adicionais ({additionals.length})
          </p>
          <div className="space-y-1">
            {additionals.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">{a.name}</span>
                <span className="text-foreground font-medium">{formatCurrency(a.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const PreviewBlock = ({
  icon,
  title,
  sections,
}: {
  icon: React.ReactNode;
  title: string;
  sections: { label: string; items: string[] }[];
}) => {
  const hasContent = sections.some((s) => s.items.length > 0);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-xs font-semibold text-foreground">{title}</p>
      </div>
      {!hasContent && <p className="text-xs text-muted-foreground italic">Nenhum item</p>}
      <div className="space-y-1.5">
        {sections.map(
          (s) =>
            s.items.length > 0 && (
              <div key={s.label}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="text-xs text-foreground">{s.items.join(", ")}</p>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default PackageWizard;
