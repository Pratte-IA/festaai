import { useEffect, useState } from "react";
import {
  PackageData,
  Additional,
  PricingTier,
  EquipeBlock,
  createDefaultEquipe,
  formatEquipeForTier,
  formatEquipeSummary,
  getEquipeQuantity,
  syncEquipeWithTiers,
  type PricingSchedule,
} from "@/data/packagesData";
import {
  buildPricingSchedule,
  createEmptyBandPrices,
  DEFAULT_PRICING_SCHEDULE,
  formatBandDays,
  getTierBandPrice,
  PRICING_SCHEDULE_PRESETS,
  remapTierBandPrices,
  type PricingSchedulePresetId,
} from "@/data/pricing-schedule";
import type { EstruturaBlock } from "@/data/packagesData";
import { ItemList } from "@/components/ItemList";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Trash2 } from "lucide-react";
import { buffetTemplates, itemSuggestions } from "@/data/packageTemplates";
import {
  Users, UtensilsCrossed, Gamepad2, UsersRound,
  Plus, X, Check, ChevronRight, ChevronLeft, Sparkles,
  Info, DollarSign, Tag, Package as PackageIcon, ArrowLeft
} from "lucide-react";

interface PackageWizardProps {
  onCancel: () => void;
  onSave: (pkg: PackageData) => void | Promise<void>;
  onValidationError?: (message: string) => void;
  tenantEstrutura: EstruturaBlock;
  /** Pacote existente para edição; omitir para criar um novo. */
  initialPackage?: PackageData;
}

const cloneEstrutura = (e: EstruturaBlock): EstruturaBlock => ({
  brinquedos: [...e.brinquedos],
  espaco: [...e.espaco],
  decoracao: [...e.decoracao],
});

const steps = [
  { key: "info", label: "Informações", icon: Info },
  { key: "buffet", label: "Buffet", icon: UtensilsCrossed },
  { key: "precos", label: "Preços", icon: DollarSign },
  { key: "equipe", label: "Equipe", icon: UsersRound },
  { key: "adicionais", label: "Adicionais", icon: Tag },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/** Tamanho padrão de cada faixa de convidados (ex.: 1–10, 11–20). */
const GUEST_TIER_SPAN = 10;

const clonePackage = (pkg: PackageData): PackageData => ({
  ...pkg,
  buffet: {
    salgados: [...pkg.buffet.salgados],
    doces: [...pkg.buffet.doces],
    bolo: [...pkg.buffet.bolo],
    bebidas: [...pkg.buffet.bebidas],
  },
  estrutura: cloneEstrutura(pkg.estrutura),
  equipe: pkg.equipe.map((role) => ({
    ...role,
    quantitiesByTier: { ...role.quantitiesByTier },
  })),
  pricingSchedule: {
    ...pkg.pricingSchedule,
    bands: pkg.pricingSchedule.bands.map((band) => ({ ...band, days: [...band.days] })),
  },
  pricingTiers: pkg.pricingTiers.map((tier) => ({
    ...tier,
    bandPrices: { ...tier.bandPrices },
  })),
});

const createEmptyPackage = (): PackageData => {
  const pricingSchedule = DEFAULT_PRICING_SCHEDULE;
  const defaultTier = {
    id: crypto.randomUUID(),
    minGuests: 1,
    maxGuests: GUEST_TIER_SPAN,
    bandPrices: createEmptyBandPrices(pricingSchedule.bands),
  };

  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    buffet: { salgados: [], doces: [], bolo: [], bebidas: [] },
    estrutura: { brinquedos: [], espaco: [], decoracao: [] },
    pricingSchedule,
    pricingTiers: [defaultTier],
    equipe: createDefaultEquipe([defaultTier.id]),
  };
};

const PackageWizard = ({
  onCancel,
  onSave,
  onValidationError,
  tenantEstrutura,
  initialPackage,
}: PackageWizardProps) => {
  const isEditing = Boolean(initialPackage);
  const [stepIndex, setStepIndex] = useState(0);
  const [pkg, setPkg] = useState<PackageData>(() =>
    initialPackage
      ? clonePackage(initialPackage)
      : { ...createEmptyPackage(), estrutura: cloneEstrutura(tenantEstrutura) },
  );

  const updatePricingTiers = (tiers: PackageData["pricingTiers"]) =>
    setPkg((current) => ({
      ...current,
      pricingTiers: tiers,
      equipe: syncEquipeWithTiers(current.equipe, tiers),
    }));

  const updatePricingSchedule = (presetId: PricingSchedulePresetId) => {
    setPkg((current) => {
      const nextSchedule = buildPricingSchedule(presetId);
      return {
        ...current,
        pricingSchedule: nextSchedule,
        pricingTiers: current.pricingTiers.map((tier) => ({
          ...tier,
          bandPrices: remapTierBandPrices(
            tier.bandPrices,
            current.pricingSchedule.bands,
            nextSchedule.bands,
          ),
        })),
      };
    });
  };
  const [additionals, setAdditionals] = useState<Additional[]>([]);

  useEffect(() => {
    if (isEditing) return;
    setPkg((p) => ({ ...p, estrutura: cloneEstrutura(tenantEstrutura) }));
  }, [tenantEstrutura, isEditing]);

  const finalize = (data: PackageData) => {
    if (!data.name.trim()) {
      onValidationError?.("Informe o nome do pacote antes de salvar.");
      setStepIndex(0);
      return;
    }

    void onSave({ ...data, estrutura: cloneEstrutura(tenantEstrutura) });
  };

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
        <div className="flex items-center gap-3">
          {isEditing && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Editando: <span className="text-foreground font-medium">{initialPackage?.name}</span>
            </span>
          )}
          <button
            onClick={() => finalize(pkg)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Check className="w-4 h-4" /> {isEditing ? "Salvar alterações" : "Salvar pacote"}
          </button>
        </div>
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
                  label="Bolo"
                  items={pkg.buffet.bolo}
                  suggestions={itemSuggestions.bolo}
                  onChange={(v) => updateBuffet("bolo", v)}
                />
                <ItemList
                  label="Bebidas"
                  items={pkg.buffet.bebidas}
                  suggestions={itemSuggestions.bebidas}
                  onChange={(v) => updateBuffet("bebidas", v)}
                />
              </div>
            )}

            {currentStep.key === "precos" && (
              <PrecosStep
                schedule={pkg.pricingSchedule}
                tiers={pkg.pricingTiers}
                onScheduleChange={updatePricingSchedule}
                onTiersChange={updatePricingTiers}
              />
            )}

            {currentStep.key === "equipe" && (
              <EquipeStep
                equipe={pkg.equipe}
                tiers={pkg.pricingTiers}
                onChange={(equipe) => setPkg({ ...pkg, equipe })}
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

const EquipeStep = ({
  equipe,
  tiers,
  onChange,
}: {
  equipe: EquipeBlock;
  tiers: PackageData["pricingTiers"];
  onChange: (equipe: EquipeBlock) => void;
}) => {
  const [newRoleLabel, setNewRoleLabel] = useState("");

  const updateQuantity = (roleId: string, tierId: string, quantity: number) =>
    onChange(
      equipe.map((role) =>
        role.id === roleId
          ? {
              ...role,
              quantitiesByTier: {
                ...role.quantitiesByTier,
                [tierId]: Math.max(0, quantity),
              },
            }
          : role,
      ),
    );

  const removeRole = (id: string) => onChange(equipe.filter((role) => role.id !== id));

  const addCustomRole = () => {
    const label = newRoleLabel.trim();
    if (!label) return;
    onChange([
      ...equipe,
      {
        id: crypto.randomUUID(),
        label,
        quantitiesByTier: Object.fromEntries(tiers.map((tier) => [tier.id, 1])),
      },
    ]);
    setNewRoleLabel("");
  };

  if (tiers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre ao menos uma faixa de convidados na etapa de Preços antes de definir a equipe.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A equipe inclusa varia conforme o número de convidados. Defina quantos profissionais entram
        em cada faixa — use a mesma lógica da tabela de preços.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/20">
              <th className="text-left font-medium py-2.5 px-3">Profissional</th>
              {tiers.map((tier) => (
                <th key={tier.id} className="text-center font-medium py-2.5 px-2 whitespace-nowrap">
                  {tier.minGuests}–{tier.maxGuests} conv.
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {equipe.map((role) => (
              <tr key={role.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 px-3 font-medium text-foreground">{role.label}</td>
                {tiers.map((tier) => {
                  const qty = getEquipeQuantity(role, tier.id);
                  return (
                    <td key={tier.id} className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(role.id, tier.id, qty - 1)}
                          className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/70 text-foreground flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(role.id, tier.id, qty + 1)}
                          className="w-7 h-7 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  );
                })}
                <td className="py-3 pr-2">
                  <button
                    type="button"
                    onClick={() => removeRole(role.id)}
                    disabled={equipe.length === 1}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Remover tipo de profissional"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        <p className="text-xs font-medium text-foreground">Outro tipo de profissional</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newRoleLabel}
            onChange={(e) => setNewRoleLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomRole()}
            placeholder="Ex.: Recepcionista, DJ, Cozinheiro..."
            className="input-base text-sm flex-1"
          />
          <button
            type="button"
            onClick={addCustomRole}
            disabled={!newRoleLabel.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

const PrecosStep = ({
  schedule,
  tiers: tiersProp,
  onScheduleChange,
  onTiersChange,
}: {
  schedule: PricingSchedule;
  tiers: PricingTier[];
  onScheduleChange: (presetId: PricingSchedulePresetId) => void;
  onTiersChange: (tiers: PricingTier[]) => void;
}) => {
  const tiers = tiersProp ?? [];
  const bands = schedule.bands;

  const updateTier = (id: string, patch: Partial<PricingTier>) =>
    onTiersChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const updateBandPrice = (tierId: string, bandId: string, price: number) =>
    onTiersChange(
      tiers.map((tier) =>
        tier.id === tierId
          ? { ...tier, bandPrices: { ...tier.bandPrices, [bandId]: price } }
          : tier,
      ),
    );

  const removeTier = (id: string) => onTiersChange(tiers.filter((t) => t.id !== id));

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const min = last ? last.maxGuests + 1 : 1;
    onTiersChange([
      ...tiers,
      {
        id: crypto.randomUUID(),
        minGuests: min,
        maxGuests: min + GUEST_TIER_SPAN - 1,
        bandPrices: last
          ? { ...last.bandPrices }
          : createEmptyBandPrices(bands),
      },
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Como seu salão divide os dias?</p>
        <p className="text-xs text-muted-foreground">
          Escolha o modelo que combina com sua operação. Os preços abaixo serão aplicados conforme o
          dia da festa (e feriados, quando indicado).
        </p>
        <div className="space-y-2">
          {PRICING_SCHEDULE_PRESETS.map((preset) => (
            <label
              key={preset.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                schedule.presetId === preset.id
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/40 hover:border-border"
              }`}
            >
              <input
                type="radio"
                name="pricing-schedule"
                checked={schedule.presetId === preset.id}
                onChange={() => onScheduleChange(preset.id)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{preset.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {bands.map((band) => (
            <span
              key={band.id}
              className="text-[10px] uppercase tracking-wide rounded-full bg-muted/60 px-2 py-1 text-muted-foreground"
            >
              {band.label} ({formatBandDays(band)}
              {band.includesHolidays ? " + feriados" : ""})
            </span>
          ))}
        </div>
        {schedule.holidayPolicy === "weekday_band" && !bands.some((b) => b.includesHolidays) && (
          <p className="text-xs text-muted-foreground italic">
            Feriados usam o preço da faixa de dias úteis.
          </p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Defina faixas de convidados (padrão de {GUEST_TIER_SPAN} em {GUEST_TIER_SPAN}) e o valor para
        cada grupo de dias.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="text-left font-medium py-2 pr-2">Convidados</th>
              {bands.map((band) => (
                <th key={band.id} className="text-left font-medium py-2 px-2 min-w-[140px]">
                  <span className="block truncate" title={band.label}>
                    {band.label}
                  </span>
                </th>
              ))}
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
                {bands.map((band) => (
                  <td key={band.id} className="py-2 px-2">
                    <CurrencyInput
                      value={getTierBandPrice(tier.bandPrices, band.id)}
                      onChange={(price) => updateBandPrice(tier.id, band.id, price)}
                      placeholder="0,00"
                      className="input-base w-full min-w-[100px] text-sm tabular-nums"
                    />
                  </td>
                ))}
                <td className="py-2 pl-2">
                  <button
                    type="button"
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
        type="button"
        onClick={addTier}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary hover:text-primary text-sm font-medium text-muted-foreground transition-colors"
      >
        <Plus className="w-4 h-4" /> Adicionar faixa de convidados
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
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<Additional["category"]>("outros");
  const [type, setType] = useState<Additional["type"]>("fixo");

  const add = () => {
    if (!name.trim() || price <= 0) return;
    setAdditionals([
      ...additionals,
      { id: crypto.randomUUID(), name, price, category, type },
    ]);
    setName("");
    setPrice(0);
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
          <CurrencyInput
            value={price}
            onChange={setPrice}
            className="input-base text-sm tabular-nums"
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
          { label: "Bolo", items: pkg.buffet.bolo },
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
        <div className="text-xs text-muted-foreground space-y-1">
          {pkg.pricingTiers.length <= 1 ? (
            <p>{formatEquipeSummary(pkg.equipe, pkg.pricingTiers)}</p>
          ) : (
            pkg.pricingTiers.map((tier) => (
              <p key={tier.id}>
                <span className="text-foreground/80">{tier.minGuests}–{tier.maxGuests}:</span>{" "}
                {formatEquipeForTier(pkg.equipe, tier.id)}
              </p>
            ))
          )}
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
            {pkg.pricingSchedule.bands.map((band, bandIndex) => (
              <div key={band.id} className="flex items-center justify-between pl-4 gap-2">
                <span className="text-muted-foreground truncate" title={band.label}>
                  {band.label}
                </span>
                <span
                  className={`font-semibold shrink-0 ${
                    bandIndex === 0 ? "text-foreground" : "text-rosa"
                  }`}
                >
                  {formatCurrency(getTierBandPrice(tier.bandPrices, band.id))}
                </span>
              </div>
            ))}
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
