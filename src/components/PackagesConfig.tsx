import { useState } from "react";
import {
  useCreateTenantPackage,
  useDeleteTenantPackage,
  useTenantEstruturaSettings,
  useTenantPackages,
  useUpdateTenantPackage,
  emptyEstruturaBlock,
} from "@/features/configuracoes";
import type { PackageData } from "@/data/packagesData";
import { useCurrentTenant } from "@/features/tenants";
import PackageWizard from "./PackageWizard";
import { formatEquipeForTier, getEquipeQuantity } from "@/data/packagesData";
import { getTierBandPrice } from "@/data/pricing-schedule";
import {
  Users,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  UsersRound,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface Props {
  hideHeader?: boolean;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erro desconhecido.";

const PackagesConfig = ({ hideHeader }: Props) => {
  const { currentTenantId, isLoading: isTenantLoading } = useCurrentTenant();
  const {
    data: packages = [],
    error: packagesError,
    isLoading: isPackagesLoading,
  } = useTenantPackages();
  const createPackage = useCreateTenantPackage();
  const updatePackage = useUpdateTenantPackage();
  const deletePackage = useDeleteTenantPackage();
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<PackageData | null>(null);

  const closeWizard = () => {
    setWizardOpen(false);
    setPackageToEdit(null);
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

  const toggleExpand = (id: string) => {
    setExpandedPkg(expandedPkg === id ? null : id);
  };

  if (wizardOpen) {
    if (isLoadingEstrutura) {
      return <p className="text-sm text-muted-foreground">Carregando estrutura...</p>;
    }
    return (
      <PackageWizard
        tenantEstrutura={tenantEstrutura ?? emptyEstruturaBlock()}
        initialPackage={packageToEdit ?? undefined}
        onCancel={closeWizard}
        onValidationError={(message) =>
          toast({
            title: "Revise o pacote",
            description: message,
            variant: "destructive",
          })
        }
        onSave={async (pkg) => {
          if (!currentTenantId) {
            toast({
              title: "Empresa ainda nao carregada",
              description: "Aguarde alguns segundos e tente salvar novamente.",
              variant: "destructive",
            });
            return;
          }

          const isEditing = Boolean(packageToEdit);
          try {
            if (isEditing) {
              await updatePackage.mutateAsync(pkg);
              toast({
                title: "Pacote atualizado",
                description: "As alteracoes foram salvas com sucesso.",
              });
            } else {
              const { id: _id, ...packageInput } = pkg;
              await createPackage.mutateAsync(packageInput);
              toast({
                title: "Pacote salvo",
                description: "O pacote foi adicionado as configuracoes.",
              });
            }
            closeWizard();
          } catch (error) {
            console.error("[PackagesConfig] Falha ao salvar pacote:", error);
            toast({
              title: isEditing ? "Nao foi possivel atualizar o pacote" : "Nao foi possivel salvar o pacote",
              description: getErrorMessage(error),
              variant: "destructive",
            });
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pacotes de Festa</h2>
          <button
            onClick={openCreateWizard}
            disabled={isLoading || !currentTenantId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Novo Pacote
          </button>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end">
          <button
            onClick={openCreateWizard}
            disabled={isLoading || !currentTenantId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Novo Pacote
          </button>
        </div>
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
        {packages.map((pkg) => {
          const isExpanded = expandedPkg === pkg.id;
          const pricingTiers = pkg.pricingTiers ?? [];
          const pricingBands = pkg.pricingSchedule?.bands ?? [];
          const minGuests = pricingTiers[0]?.minGuests ?? 0;
          const maxGuests = pricingTiers[pricingTiers.length - 1]?.maxGuests ?? 0;

          return (
            <div
              key={pkg.id}
              className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden transition-colors hover:border-border"
            >
              {/* Simplified Header Card */}
              <div
                className="p-6 cursor-pointer flex items-center gap-6"
                onClick={() => toggleExpand(pkg.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-2">{pkg.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {minGuests}–{maxGuests} convidados
                    </span>
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
                        await deletePackage.mutateAsync(pkg.id);
                        toast({ title: "Pacote removido" });
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Buffet */}
                    <div className="rounded-xl bg-card/60 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UtensilsCrossed className="w-4 h-4 text-coral" />
                        Buffet
                      </div>
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
