import { useState } from "react";
import { useCreateTenantPackage, useDeleteTenantPackage, useTenantPackages } from "@/features/configuracoes";
import PackageWizard from "./PackageWizard";
import {
  Users, ChevronDown, ChevronUp, UtensilsCrossed,
  Gamepad2, UsersRound, Plus, Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface Props {
  hideHeader?: boolean;
}

const PackagesConfig = ({ hideHeader }: Props) => {
  const { data: packages = [], isLoading } = useTenantPackages();
  const createPackage = useCreateTenantPackage();
  const deletePackage = useDeleteTenantPackage();
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedPkg(expandedPkg === id ? null : id);
  };

  if (wizardOpen) {
    return (
      <PackageWizard
        onCancel={() => setWizardOpen(false)}
          onSave={async (pkg) => {
            const { id: _id, ...packageInput } = pkg;
            try {
              await createPackage.mutateAsync(packageInput);
              toast({ title: "Pacote salvo", description: "O pacote foi adicionado as configuracoes." });
              setWizardOpen(false);
            } catch {
              toast({
                title: "Nao foi possivel salvar o pacote",
                description: "Revise os dados e tente novamente.",
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
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Pacote
          </button>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end">
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Pacote
          </button>
        </div>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando pacotes...</p>}
        {!isLoading && packages.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum pacote cadastrado. Clique em "Novo Pacote" para começar.
            </p>
          </div>
        )}
        {packages.map((pkg) => {
          const isExpanded = expandedPkg === pkg.id;
          const minWeekday = Math.min(...pkg.pricingTiers.map((t) => t.weekdayPrice));
          const minWeekend = Math.min(...pkg.pricingTiers.map((t) => t.weekendPrice));
          const minGuests = pkg.pricingTiers[0]?.minGuests ?? 0;
          const maxGuests = pkg.pricingTiers[pkg.pricingTiers.length - 1]?.maxGuests ?? 0;

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
                      {pkg.pricingTiers.length} {pkg.pricingTiers.length === 1 ? "faixa de preço" : "faixas de preço"}
                    </span>
                  </div>
                </div>

                {/* Price highlight */}
                {pkg.pricingTiers.length > 0 && (
                  <div className="hidden sm:flex items-center gap-6 pr-2">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Semana</p>
                      <p className="text-base font-bold text-foreground">{formatCurrency(minWeekday)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Fim de semana</p>
                      <p className="text-base font-bold text-primary">{formatCurrency(minWeekend)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deletePackage.mutateAsync(pkg.id);
                        toast({ title: "Pacote removido" });
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
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Bebidas</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.buffet.bebidas.map((item) => (
                            <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Estrutura */}
                    <div className="rounded-xl bg-card/60 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Gamepad2 className="w-4 h-4 text-primary" />
                        Estrutura
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Brinquedos</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.estrutura.brinquedos.map((item) => (
                            <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Espaço</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.estrutura.espaco.map((item) => (
                            <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Decoração</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.estrutura.decoracao.map((item) => (
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
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Garçom</span>
                          <span className="text-sm font-medium text-foreground">{pkg.equipe.garcom}x</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Monitora</span>
                          <span className="text-sm font-medium text-foreground">{pkg.equipe.monitora}x</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Limpeza</span>
                          <span className="text-sm font-medium text-foreground">{pkg.equipe.limpeza}x</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Tiers Detail */}
                  {pkg.pricingTiers.length > 0 && (
                    <div className="rounded-xl bg-card/60 p-4">
                      <p className="text-sm font-semibold text-foreground mb-3">Faixas de preço</p>
                      <div className="space-y-1.5">
                        {pkg.pricingTiers.map((tier) => (
                          <div key={tier.id} className="grid grid-cols-3 gap-3 text-sm py-1.5">
                            <span className="text-muted-foreground">
                              {tier.minGuests}–{tier.maxGuests} convidados
                            </span>
                            <span className="text-foreground text-right sm:text-left">
                              <span className="text-muted-foreground text-xs mr-1">semana</span>
                              {formatCurrency(tier.weekdayPrice)}
                            </span>
                            <span className="text-foreground font-medium text-right">
                              <span className="text-muted-foreground text-xs mr-1 font-normal">fds</span>
                              {formatCurrency(tier.weekendPrice)}
                            </span>
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
