import { useEffect, useState } from "react";
import {
  PackageData,
  PricingTier,
  EquipeBlock,
  createDefaultEquipe,
  formatEquipeForTier,
  formatEquipeSummary,
  getEquipeQuantity,
  itemsToLines,
  linesToItems,
  packageHasBuffet,
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
import { formatDurationMinutes, parseDurationInput } from "@/lib/duration";
import {
  buildPackageAutomationName,
  isValidPackageAutomationName,
  sanitizePackageAutomationNameInput,
} from "@/lib/package-automation-name";
import {
  Users, UtensilsCrossed, Gamepad2, UsersRound,
  Plus, X, Check, ChevronRight, ChevronLeft,
  Info, DollarSign, Package as PackageIcon, ArrowLeft
} from "lucide-react";

interface PackageWizardProps {
  onCancel: () => void;
  onSave: (
    pkg: PackageData,
    options?: { close?: boolean },
  ) => void | Promise<PackageData | void>;
  onValidationError?: (message: string) => void;
  tenantEstrutura: EstruturaBlock;
  /** Pacotes existentes para copiar o buffet (exceto o pacote em edição). */
  otherPackages?: PackageData[];
  /** Pacote existente para edição; omitir para criar um novo. */
  initialPackage?: PackageData;
  /** Exibe fluxo da configuração guiada na última etapa. */
  guidedMode?: boolean;
  onGuidedContinue?: () => void;
  guidedContinuePending?: boolean;
  onStepChange?: (stepIndex: number) => void;
}

const cloneBuffet = (buffet: PackageData["buffet"]): PackageData["buffet"] => ({
  hasBuffet: buffet.hasBuffet !== false,
  salgados: [...buffet.salgados],
  doces: [...buffet.doces],
  bolo: [...buffet.bolo],
  bebidas: [...buffet.bebidas],
});

const NO_BUFFET_TEMPLATE_KEY = "none";

const BUFFET_TEMPLATE_OPTIONS = [
  { key: NO_BUFFET_TEMPLATE_KEY, label: "Não possui buffet" },
  { key: "basico", label: "Buffet básico" },
  { key: "completo", label: "Buffet completo" },
  { key: "gourmet", label: "Buffet gourmet" },
] as const;

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
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/** Tamanho padrão de cada faixa de convidados (ex.: 1–10, 11–20). */
const GUEST_TIER_SPAN = 10;

const isPersistedPackageId = (id: string | undefined): boolean => /^\d+$/.test(id ?? "");

const clonePackage = (pkg: PackageData): PackageData => ({
  ...pkg,
  buffet: cloneBuffet(pkg.buffet),
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
    nameAutomacao: "",
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
  otherPackages = [],
  initialPackage,
  guidedMode = false,
  onGuidedContinue,
  guidedContinuePending = false,
  onStepChange,
}: PackageWizardProps) => {
  const isEditing = Boolean(initialPackage);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [pkg, setPkg] = useState<PackageData>(() =>
    initialPackage
      ? clonePackage(initialPackage)
      : { ...createEmptyPackage(), estrutura: cloneEstrutura(tenantEstrutura) },
  );
  const [automationNameTouched, setAutomationNameTouched] = useState(() =>
    Boolean(initialPackage?.nameAutomacao?.trim()),
  );
  const isPersistedPackage = isPersistedPackageId(initialPackage?.id);

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
  const [includedItemsText, setIncludedItemsText] = useState(() =>
    itemsToLines(initialPackage?.includedItems),
  );
  const [excludedItemsText, setExcludedItemsText] = useState(() =>
    itemsToLines(initialPackage?.excludedItems),
  );
  const [durationText, setDurationText] = useState(() =>
    formatDurationMinutes(initialPackage?.durationMinutes),
  );
  const [buffetTemplateKey, setBuffetTemplateKey] = useState(() =>
    initialPackage && !packageHasBuffet(initialPackage.buffet) ? NO_BUFFET_TEMPLATE_KEY : "",
  );
  const [copyBuffetPackageId, setCopyBuffetPackageId] = useState("");

  useEffect(() => {
    if (isEditing) return;
    setPkg((p) => ({ ...p, estrutura: cloneEstrutura(tenantEstrutura) }));
  }, [tenantEstrutura, isEditing]);

  useEffect(() => {
    onStepChange?.(stepIndex);
  }, [onStepChange, stepIndex]);

  const buildPayload = (data: PackageData): PackageData | null => {
    if (!data.name.trim()) {
      onValidationError?.("Informe o nome do pacote antes de salvar.");
      return null;
    }

    const automationName = sanitizePackageAutomationNameInput(data.nameAutomacao);
    if (!isValidPackageAutomationName(automationName)) {
      onValidationError?.(
        "Informe um identificador válido para automação (ex.: basico, roda_gigante).",
      );
      return null;
    }

    const trimmedDuration = durationText.trim();
    let durationMinutes: number | null = null;
    if (trimmedDuration) {
      const parsedDuration = parseDurationInput(trimmedDuration);
      if (parsedDuration === null) {
        onValidationError?.("Duração inválida. Use formatos como 1h30, 2h ou 45min.");
        return null;
      }
      durationMinutes = parsedDuration;
    }

    return {
      ...data,
      durationMinutes,
      nameAutomacao: automationName,
      estrutura: cloneEstrutura(tenantEstrutura),
    };
  };

  const persistPackage = async (data: PackageData, close: boolean) => {
    const payload = buildPayload(data);
    if (!payload) return false;

    setIsSaving(true);
    try {
      const saved = await onSave(payload, { close });
      if (!saved) return false;

      setPkg(clonePackage(saved));
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const finalize = async (data: PackageData, close = true) => {
    const payload = buildPayload(data);
    if (!payload) {
      setStepIndex(0);
      return false;
    }

    setIsSaving(true);
    try {
      await onSave(payload, { close });
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  const currentStep = steps[stepIndex];

  const goNext = async () => {
    const saved = await persistPackage(pkg, false);
    if (!saved) {
      if (!pkg.name.trim()) {
        setStepIndex(0);
      }
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const handleGuidedContinue = async () => {
    const saved = await finalize(pkg, true);
    if (saved) {
      onGuidedContinue?.();
    }
  };
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const updateBuffet = (field: keyof PackageData["buffet"], value: string[]) => {
    if (field === "hasBuffet") return;
    setPkg((current) => ({
      ...current,
      buffet: { ...current.buffet, hasBuffet: true, [field]: value },
    }));
    if (buffetTemplateKey === NO_BUFFET_TEMPLATE_KEY) {
      setBuffetTemplateKey("");
    }
  };

  const applyNoBuffet = () => {
    setPkg((current) => ({
      ...current,
      buffet: { hasBuffet: false, salgados: [], doces: [], bolo: [], bebidas: [] },
    }));
    setBuffetTemplateKey(NO_BUFFET_TEMPLATE_KEY);
    setCopyBuffetPackageId("");
  };

  const applyBuffetTemplate = (key: keyof typeof buffetTemplates) => {
    setPkg((current) => ({
      ...current,
      buffet: { hasBuffet: true, ...cloneBuffet(buffetTemplates[key]) },
    }));
    setBuffetTemplateKey(key);
    setCopyBuffetPackageId("");
  };

  const applyBuffetFromPackage = (packageId: string) => {
    const source = otherPackages.find((item) => item.id === packageId);
    if (!source) return;

    setPkg((current) => ({
      ...current,
      buffet: cloneBuffet(source.buffet),
    }));
    setCopyBuffetPackageId(packageId);
    setBuffetTemplateKey(
      packageHasBuffet(source.buffet) ? "" : NO_BUFFET_TEMPLATE_KEY,
    );
  };

  const hasBuffet = packageHasBuffet(pkg.buffet);

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
            onClick={() => void finalize(pkg, true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                    onChange={(e) => {
                      const name = e.target.value;
                      setPkg((current) => ({
                        ...current,
                        name,
                        nameAutomacao:
                          !automationNameTouched && !isPersistedPackage
                            ? buildPackageAutomationName(name)
                            : current.nameAutomacao,
                      }));
                    }}
                    placeholder="Ex: Pacote Premium"
                    className="input-base"
                  />
                </Field>
                <Field label="Identificador para automação">
                  <input
                    type="text"
                    value={pkg.nameAutomacao}
                    onChange={(e) => {
                      setAutomationNameTouched(true);
                      setPkg({
                        ...pkg,
                        nameAutomacao: sanitizePackageAutomationNameInput(e.target.value),
                      });
                    }}
                    placeholder="Ex: basico, roda_gigante, cafe_colonial"
                    className="input-base font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Usado pelos agentes no n8n. Minúsculas, sem acentos, sem a palavra &quot;pacote&quot;.
                  </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Duração">
                    <input
                      type="text"
                      value={durationText}
                      onChange={(e) => setDurationText(e.target.value)}
                      onBlur={() => {
                        const trimmed = durationText.trim();
                        if (!trimmed) {
                          setDurationText("");
                          setPkg((current) => ({ ...current, durationMinutes: null }));
                          return;
                        }

                        const parsed = parseDurationInput(trimmed);
                        if (parsed === null) return;

                        const formatted = formatDurationMinutes(parsed);
                        setDurationText(formatted);
                        setPkg((current) => ({ ...current, durationMinutes: parsed }));
                      }}
                      placeholder="Ex: 1h30, 2h, 45min"
                      className="input-base"
                    />
                  </Field>
                  <Field label="Convidados inclusos">
                    <input
                      type="number"
                      min="0"
                      value={pkg.includedGuests ?? ""}
                      onChange={(e) =>
                        setPkg({
                          ...pkg,
                          includedGuests: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="Ex: 50"
                      className="input-base"
                    />
                  </Field>
                </div>
                <Field label="Itens inclusos (um por linha)">
                  <textarea
                    value={includedItemsText}
                    onChange={(e) => {
                      const value = e.target.value;
                      setIncludedItemsText(value);
                      setPkg((current) => ({
                        ...current,
                        includedItems: linesToItems(value),
                      }));
                    }}
                    placeholder={"Ex: Decoração básica\nGarçom"}
                    rows={3}
                    className="input-base resize-none"
                  />
                </Field>
                <Field label="Itens não inclusos (um por linha)">
                  <textarea
                    value={excludedItemsText}
                    onChange={(e) => {
                      const value = e.target.value;
                      setExcludedItemsText(value);
                      setPkg((current) => ({
                        ...current,
                        excludedItems: linesToItems(value),
                      }));
                    }}
                    placeholder={"Ex: Bolo personalizado\nDoces finos"}
                    rows={3}
                    className="input-base resize-none"
                  />
                </Field>
                <Field label="Regras do pacote">
                  <textarea
                    value={pkg.rules ?? ""}
                    onChange={(e) => setPkg({ ...pkg, rules: e.target.value || null })}
                    placeholder="Regras comerciais, restrições ou observações..."
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
                  Monte o cardápio por categoria ou marque que o pacote não inclui buffet — ideal
                  para locação somente do espaço.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Modelo de buffet">
                    <select
                      value={buffetTemplateKey}
                      onChange={(e) => {
                        const key = e.target.value;
                        if (!key) {
                          setBuffetTemplateKey("");
                          return;
                        }
                        if (key === NO_BUFFET_TEMPLATE_KEY) {
                          applyNoBuffet();
                          return;
                        }
                        applyBuffetTemplate(key as keyof typeof buffetTemplates);
                      }}
                      className="input-base text-sm"
                    >
                      <option value="">Selecione um modelo de buffet</option>
                      {BUFFET_TEMPLATE_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {otherPackages.length > 0 && hasBuffet && (
                    <Field label="Copiar buffet de outro pacote">
                      <select
                        value={copyBuffetPackageId}
                        onChange={(e) => {
                          const packageId = e.target.value;
                          if (!packageId) {
                            setCopyBuffetPackageId("");
                            return;
                          }
                          applyBuffetFromPackage(packageId);
                        }}
                        className="input-base text-sm"
                      >
                        <option value="">Selecione um pacote</option>
                        {otherPackages.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
                {!hasBuffet ? (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <p className="text-sm text-foreground font-medium">Buffet não incluso</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este pacote cobre apenas o que estiver descrito nas informações e preços — por
                      exemplo, aluguel do salão sem alimentação.
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                onClick={() => void goNext()}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Avançar"} <ChevronRight className="w-4 h-4" />
              </button>
            ) : guidedMode ? (
              <button
                onClick={() => void handleGuidedContinue()}
                disabled={isSaving || guidedContinuePending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSaving || guidedContinuePending ? "Salvando..." : "Salvar e continuar"}
              </button>
            ) : (
              <button
                onClick={() => void finalize(pkg, true)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Concluir e salvar
              </button>
            )}
          </div>
        </div>

        {/* Preview lateral */}
        <PackagePreview pkg={pkg} />
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

const PackagePreview = ({ pkg }: { pkg: PackageData }) => (
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
        emptyMessage={
          !packageHasBuffet(pkg.buffet) ? "Buffet não incluso neste pacote" : undefined
        }
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
    </div>
  </div>
);

const PreviewBlock = ({
  icon,
  title,
  sections,
  emptyMessage,
}: {
  icon: React.ReactNode;
  title: string;
  sections: { label: string; items: string[] }[];
  emptyMessage?: string;
}) => {
  const hasContent = sections.some((s) => s.items.length > 0);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <p className="text-xs font-semibold text-foreground">{title}</p>
      </div>
      {emptyMessage ? (
        <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>
      ) : !hasContent ? (
        <p className="text-xs text-muted-foreground italic">Nenhum item</p>
      ) : null}
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
