import { useState, useEffect } from "react";
import {
  useCreateTenantPackage,
  useDeleteTenantPackage,
  useDuplicateTenantPackage,
  useReorderTenantPackage,
  useTenantEstruturaSettings,
  useTenantPackages,
  useToggleTenantPackageActive,
  useUpdateTenantPackage,
  emptyEstruturaBlock,
} from "@/features/configuracoes";
import type { PackageData } from "@/data/packagesData";
import PackageWizard from "./PackageWizard";
import { useCurrentTenant } from "@/features/tenants";
import { formatDurationMinutes } from "@/lib/duration";
import { formatEquipeForTier, getEquipeQuantity, packageHasBuffet } from "@/data/packagesData";
import { getTierBandPrice } from "@/data/pricing-schedule";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Copy,
  ArrowDown,
  ArrowUp,
  Power,
  UtensilsCrossed,
  UsersRound,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error-message";
import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getPackageHeaderStats = (packages: PackageData[]) => {
  const activePackages = packages.filter((pkg) => pkg.active !== false);
  const tierCount = activePackages.reduce(
    (sum, pkg) => sum + (pkg.pricingTiers?.length ?? 0),
    0,
  );
  const maxGuests = activePackages.reduce((max, pkg) => {
    const pkgMax = (pkg.pricingTiers ?? []).reduce(
      (tierMax, tier) => Math.max(tierMax, tier.maxGuests ?? 0),
      0,
    );
    return Math.max(max, pkgMax);
  }, 0);

  return {
    activeCount: activePackages.length,
    tierCount,
    maxGuests,
  };
};

interface Props {
  adminMode?: boolean;
  guidedMode?: boolean;
  hideHeader?: boolean;
  onGuidedContinue?: () => void;
  guidedContinuePending?: boolean;
  onWizardStateChange?: (state: { isOpen: boolean; isLastStep: boolean }) => void;
}

const PackagesConfig = ({
  adminMode = false,
  guidedMode = false,
  hideHeader,
  onGuidedContinue,
  guidedContinuePending = false,
  onWizardStateChange,
}: Props) => {
  const { currentTenantId, isLoading: isTenantLoading } = useCurrentTenant();
  const {
    data: packages = [],
    error: packagesError,
    isLoading: isPackagesLoading,
  } = useTenantPackages({ includeInactive: adminMode });
  const createPackage = useCreateTenantPackage();
  const updatePackage = useUpdateTenantPackage();
  const deletePackage = useDeleteTenantPackage();
  const duplicatePackage = useDuplicateTenantPackage();
  const reorderPackage = useReorderTenantPackage();
  const togglePackageActive = useToggleTenantPackageActive();
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<PackageData | null>(null);

  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const wizardLastStepIndex = 3;

  useEffect(() => {
    if (!guidedMode) return;
    onWizardStateChange?.({
      isOpen: wizardOpen,
      isLastStep: wizardOpen && wizardStepIndex === wizardLastStepIndex,
    });
  }, [guidedMode, onWizardStateChange, wizardOpen, wizardStepIndex]);

  const closeWizard = () => {
    setWizardOpen(false);
    setPackageToEdit(null);
    setWizardStepIndex(0);
  };

  const openCreateWizard = () => {
    setPackageToEdit(null);
    setWizardOpen(true);
  };

  const openEditWizard = (pkg: PackageData) => {
    setPackageToEdit(pkg);
    setWizardOpen(true);
  };

  const { data: tenantEstrutura, isLoading: isLoadingEstrutura } = useTenantEstruturaSettings();
  const isLoading = isTenantLoading || isPackagesLoading;

  useEffect(() => {
    if (!guidedMode || isLoading || wizardOpen || packages.length > 0) return;
    openCreateWizard();
  }, [guidedMode, isLoading, packages.length, wizardOpen]);

  const toggleExpand = (id: string) => {
    setExpandedPkg(expandedPkg === id ? null : id);
  };

  if (wizardOpen) {
    if (isLoadingEstrutura) {
      return <p className="text-sm text-muted-foreground">Carregando assistente...</p>;
    }
    return (
      <PackageWizard
        key={packageToEdit?.id ?? "create"}
        tenantEstrutura={tenantEstrutura ?? emptyEstruturaBlock()}
        otherPackages={packages.filter((item) => item.id !== packageToEdit?.id)}
        initialPackage={packageToEdit ?? undefined}
        guidedMode={guidedMode}
        guidedContinuePending={guidedContinuePending}
        onGuidedContinue={onGuidedContinue}
        onStepChange={setWizardStepIndex}
        onCancel={closeWizard}
        onValidationError={(message) =>
          toast({
            title: "Revise o pacote",
            description: message,
            variant: "destructive",
          })
        }
        onSave={async (pkg, options) => {
          if (!currentTenantId) {
            toast({
              title: "Empresa ainda nao carregada",
              description: "Aguarde alguns segundos e tente salvar novamente.",
              variant: "destructive",
            });
            return;
          }

          const close = options?.close ?? true;
          const persistedId = packageToEdit?.id;

          try {
            if (persistedId) {
              const updated = await updatePackage.mutateAsync({ ...pkg, id: persistedId });
              const savedPackage = {
                ...pkg,
                id: persistedId,
                nameAutomacao: updated.nameAutomacao,
              };
              setPackageToEdit(savedPackage);
              if (close) {
                toast({
                  title: "Pacote atualizado",
                  description: "As alteracoes foram salvas com sucesso.",
                });
                closeWizard();
              }
              return savedPackage;
            }

            const { id: _id, ...packageInput } = pkg;
            const created = await createPackage.mutateAsync(packageInput);
            const savedPackage = {
              ...pkg,
              id: created.id,
              nameAutomacao: created.nameAutomacao,
            };
            setPackageToEdit(savedPackage);

            if (close) {
              toast({
                title: "Pacote salvo",
                description: "O pacote foi adicionado as configuracoes.",
              });
              closeWizard();
            }

            return savedPackage;
          } catch (error) {
            console.error("[PackagesConfig] Falha ao salvar pacote:", error);
            toast({
              title: persistedId ? "Nao foi possivel atualizar o pacote" : "Nao foi possivel salvar o pacote",
              description: getErrorMessage(error),
              variant: "destructive",
            });
          }
        }}
      />
    );
  }

  const { activeCount, tierCount, maxGuests } = getPackageHeaderStats(packages);

  const novoPacoteButton = (className?: string) => (
    <Button
      onClick={openCreateWizard}
      disabled={isLoading || !currentTenantId}
      className={cn("shrink-0", className)}
    >
      <Plus className="w-4 h-4" />
      Novo Pacote
    </Button>
  );

  return (
    <div className={hideHeader ? "space-y-4" : "space-y-5"}>
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pacotes de Festa</h2>
          {novoPacoteButton()}
        </div>
      )}

      {hideHeader && (
        <SettingsPageHeader
          title={SETTINGS_PAGE_META.pacotes.title}
          description={SETTINGS_PAGE_META.pacotes.description}
          renderAction={(className) => novoPacoteButton(className)}
          stats={
            !isLoading && !packagesError ? (
              <>
                <SettingsStatChip>
                  {activeCount} {activeCount === 1 ? "pacote ativo" : "pacotes ativos"}
                </SettingsStatChip>
                <SettingsStatChip>
                  {tierCount} {tierCount === 1 ? "faixa de preço" : "faixas de preço"}
                </SettingsStatChip>
                {maxGuests > 0 && <SettingsStatChip>até {maxGuests} convidados</SettingsStatChip>}
              </>
            ) : null
          }
        />
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando pacotes...</p>}
        {packagesError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Nao foi possivel carregar os pacotes: {getErrorMessage(packagesError)}
          </div>
        )}
        {!isLoading && !packagesError && packages.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum pacote cadastrado. Clique em "Novo Pacote" para começar.
            </p>
          </div>
        )}
        {packages.map((pkg, packageIndex) => {
          const isExpanded = expandedPkg === pkg.id;
          const isInactive = pkg.active === false;
          const pricingTiers = pkg.pricingTiers ?? [];
          const pricingBands = pkg.pricingSchedule?.bands ?? [];
          const minTierGuests = pricingTiers[0]?.minGuests ?? 0;
          const maxTierGuests = pricingTiers[pricingTiers.length - 1]?.maxGuests ?? 0;
          const guestLabel = pkg.includedGuests
            ? `${pkg.includedGuests} convidados inclusos`
            : `${minTierGuests}–${maxTierGuests} convidados`;

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl border bg-card/40 overflow-hidden transition-colors hover:border-border ${
                isInactive ? "border-border/40 opacity-70" : "border-border/60"
              }`}
            >
              {/* Simplified Header Card */}
              <div
                className="p-6 cursor-pointer flex items-center gap-6"
                onClick={() => toggleExpand(pkg.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-foreground">{pkg.name}</h3>
                    {isInactive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {guestLabel}
                    </span>
                    {pkg.durationMinutes ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span>{formatDurationMinutes(pkg.durationMinutes)}</span>
                      </>
                    ) : null}
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span className="font-mono">{pkg.nameAutomacao}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>
                      {pricingTiers.length}{" "}
                      {pricingTiers.length === 1 ? "faixa de preço" : "faixas de preço"}
                    </span>
                  </div>
                </div>

                {/* Price highlight */}
                {pricingTiers.length > 0 && pricingBands.length > 0 && (
                  <div className="hidden sm:flex items-center gap-4 pr-2">
                    {pricingBands.slice(0, 2).map((band, index) => {
                      const minPrice = Math.min(
                        ...pricingTiers.map((t) => getTierBandPrice(t.bandPrices, band.id)),
                      );
                      return (
                        <div key={band.id} className="text-right max-w-[120px]">
                          <p
                            className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 truncate"
                            title={band.label}
                          >
                            {band.label}
                          </p>
                          <p
                            className={`text-base font-bold truncate ${
                              index === 0 ? "text-foreground" : "text-primary"
                            }`}
                          >
                            {formatCurrency(minPrice)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {adminMode && (
                    <>
                      <button
                        type="button"
                        title="Mover para cima"
                        disabled={packageIndex === 0 || reorderPackage.isPending}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await reorderPackage.mutateAsync({ direction: "up", id: pkg.id });
                          } catch {
                            toast({ title: "Nao foi possivel reordenar", variant: "destructive" });
                          }
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Mover para baixo"
                        disabled={packageIndex === packages.length - 1 || reorderPackage.isPending}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await reorderPackage.mutateAsync({ direction: "down", id: pkg.id });
                          } catch {
                            toast({ title: "Nao foi possivel reordenar", variant: "destructive" });
                          }
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Duplicar pacote"
                        disabled={duplicatePackage.isPending}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await duplicatePackage.mutateAsync(pkg.id);
                            toast({ title: "Pacote duplicado" });
                          } catch {
                            toast({
                              title: "Nao foi possivel duplicar o pacote",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={isInactive ? "Ativar pacote" : "Inativar pacote"}
                        disabled={togglePackageActive.isPending}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await togglePackageActive.mutateAsync({
                              active: isInactive,
                              id: pkg.id,
                            });
                            toast({
                              title: isInactive ? "Pacote ativado" : "Pacote inativado",
                            });
                          } catch {
                            toast({
                              title: "Nao foi possivel alterar o status",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    title="Editar pacote"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditWizard(pkg);
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Excluir pacote"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const result = await deletePackage.mutateAsync(pkg.id);
                        toast({
                          title: result?.deactivated ? "Pacote inativado" : "Pacote removido",
                          description: result?.deactivated
                            ? "Este pacote ja foi usado em eventos e foi inativado em vez de excluido."
                            : undefined,
                        });
                        if (expandedPkg === pkg.id) setExpandedPkg(null);
                      } catch {
                        toast({
                          title: "Nao foi possivel remover o pacote",
                          description: "Tente novamente em instantes.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border/40 px-6 pb-6 pt-5 space-y-5 bg-muted/10">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => openEditWizard(pkg)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar pacote
                    </button>
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                  )}

                  {(pkg.includedItems?.length || pkg.excludedItems?.length || pkg.rules) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pkg.includedItems && pkg.includedItems.length > 0 && (
                        <div className="rounded-xl bg-card/60 p-4">
                          <p className="text-sm font-semibold text-foreground mb-2">Itens inclusos</p>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                            {pkg.includedItems.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {pkg.excludedItems && pkg.excludedItems.length > 0 && (
                        <div className="rounded-xl bg-card/60 p-4">
                          <p className="text-sm font-semibold text-foreground mb-2">Itens não inclusos</p>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                            {pkg.excludedItems.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {pkg.rules && (
                        <div className="rounded-xl bg-card/60 p-4 md:col-span-2">
                          <p className="text-sm font-semibold text-foreground mb-2">Regras do pacote</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pkg.rules}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Buffet */}
                    <div className="rounded-xl bg-card/60 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UtensilsCrossed className="w-4 h-4 text-coral" />
                        Buffet
                      </div>
                      {!packageHasBuffet(pkg.buffet) ? (
                        <p className="text-sm text-muted-foreground italic">Buffet não incluso</p>
                      ) : (
                        <>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Salgados</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.buffet.salgados.map((item) => (
                            <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Doces</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.buffet.doces.map((item) => (
                            <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Bolo</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.buffet.bolo.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">Nenhum bolo cadastrado</span>
                          ) : (
                            pkg.buffet.bolo.map((item) => (
                              <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">{item}</span>
                            ))
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Bebidas</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.buffet.bebidas.map((item) => (
                            <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      </div>
                        </>
                      )}
                    </div>

                    {/* Equipe */}
                    <div className="rounded-xl bg-card/60 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UsersRound className="w-4 h-4 text-success" />
                        Equipe
                      </div>
                      <div className="space-y-3 pt-1">
                        {pkg.equipe.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum profissional incluso</p>
                        ) : pricingTiers.length <= 1 ? (
                          pkg.equipe
                            .filter((role) =>
                              pricingTiers[0]
                                ? getEquipeQuantity(role, pricingTiers[0].id) > 0
                                : Object.values(role.quantitiesByTier).some((q) => q > 0),
                            )
                            .map((role) => (
                              <div key={role.id} className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{role.label}</span>
                                <span className="text-sm font-medium text-foreground">
                                  {pricingTiers[0]
                                    ? `${getEquipeQuantity(role, pricingTiers[0].id)}x`
                                    : "—"}
                                </span>
                              </div>
                            ))
                        ) : (
                          pricingTiers.map((tier) => (
                            <div key={tier.id}>
                              <p className="text-xs font-medium text-foreground mb-1">
                                {tier.minGuests}–{tier.maxGuests} convidados
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatEquipeForTier(pkg.equipe, tier.id)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Tiers Detail */}
                  {pricingTiers.length > 0 && (
                    <div className="rounded-xl bg-card/60 p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">Faixas de preço</p>
                      {pricingBands.length > 0 && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {pricingBands.map((b) => b.label).join(" · ")}
                        </p>
                      )}
                      <div className="space-y-2">
                        {pricingTiers.map((tier) => (
                          <div key={tier.id} className="text-sm py-1.5 border-b border-border/30 last:border-0">
                            <p className="text-muted-foreground mb-1">
                              {tier.minGuests}–{tier.maxGuests} convidados
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {pricingBands.map((band) => (
                                <span key={band.id} className="text-foreground">
                                  <span className="text-muted-foreground text-xs mr-1">{band.label}</span>
                                  {formatCurrency(getTierBandPrice(tier.bandPrices, band.id))}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PackagesConfig;
