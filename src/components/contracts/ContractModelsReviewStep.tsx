import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Loader2, PartyPopper } from "lucide-react";

import {
  ContractDocumentView,
  contractDocumentClassName,
} from "@/components/contracts/ContractDocumentView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTenantFinancialSettings } from "@/features/configuracoes";
import { useTenantPackages } from "@/features/configuracoes/use-tenant-packages";
import {
  CONTRACT_PREVIEW_PLACEHOLDER,
  defaultTenantContractTemplateParams,
  renderContractTemplatePreview,
  validateTenantContractTemplateParams,
  type TenantContractTemplateParams,
} from "@/features/eventos/contracts/contract-template-params";
import type { ContractTemplateKey } from "@/features/eventos/contracts/contract-template-types";
import {
  useCompleteContractModelsReview,
  useTenantContractModuleSettings,
  useTenantContractTypeOptions,
} from "@/features/eventos/use-tenant-contract-module-settings";
import { useTenantCompanyProfile } from "@/features/guided-setup/use-tenant-company-profile";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const templateIcons: Record<ContractTemplateKey, typeof Building2> = {
  aluguel_espaco: Building2,
  aluguel_espaco_festa_completa: PartyPopper,
};

const inputClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ContractModelsReviewStepProps {
  mode?: "setup" | "edit";
  onRestartSetup?: () => void | Promise<void>;
  onReviewCompleted?: () => void;
}

export const ContractModelsReviewStep = ({
  mode = "setup",
  onRestartSetup,
  onReviewCompleted,
}: ContractModelsReviewStepProps) => {
  const { data: options = [], error, isLoading } = useTenantContractTypeOptions();
  const enabledOptions = useMemo(() => options.filter((option) => option.enabled), [options]);
  const { data: moduleSettings } = useTenantContractModuleSettings();
  const { data: companyProfile } = useTenantCompanyProfile();
  const { data: financialSettings } = useTenantFinancialSettings();
  const { data: packages = [] } = useTenantPackages();
  const completeReview = useCompleteContractModelsReview();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [params, setParams] = useState<TenantContractTemplateParams>(() =>
    defaultTenantContractTemplateParams(),
  );

  useEffect(() => {
    const stored = moduleSettings?.templateParams;
    const defaults = defaultTenantContractTemplateParams();
    setParams({
      ...defaults,
      ...stored,
      comarca_foro: stored?.comarca_foro || companyProfile?.addressCity || defaults.comarca_foro,
      titular_conta:
        stored?.titular_conta || companyProfile?.companyName?.trim() || defaults.titular_conta,
    });
  }, [companyProfile?.addressCity, companyProfile?.companyName, moduleSettings?.templateParams]);

  const packageSample = useMemo(
    () => packages.find((pkg) => pkg.active) ?? packages[0] ?? null,
    [packages],
  );

  const currentOption = enabledOptions[currentIndex];
  const totalModels = enabledOptions.length;
  const isLastModel = currentIndex >= totalModels - 1;

  const previewHtml = useMemo(() => {
    if (!currentOption) return "";

    return renderContractTemplatePreview(currentOption.definition.placeholderHtml, {
      companyProfile,
      financialSettings: financialSettings ?? null,
      packageSample,
      params,
    });
  }, [companyProfile, currentOption, financialSettings, packageSample, params]);

  const prefilledSummary = useMemo(
    () =>
      [
        companyProfile?.companyName && `Empresa: ${companyProfile.companyName}`,
        companyProfile?.cnpj && "CNPJ cadastrado",
        companyProfile?.legalRepresentativeName &&
          `Representante: ${companyProfile.legalRepresentativeName}`,
        financialSettings?.cancellation_policy && "Política de cancelamento",
        financialSettings?.rescheduling_policy && "Política de remarcação",
        packageSample?.name && `Pacote de exemplo: ${packageSample.name}`,
      ].filter(Boolean),
    [companyProfile, financialSettings, packageSample],
  );

  const updateParam = <K extends keyof TenantContractTemplateParams>(
    key: K,
    value: TenantContractTemplateParams[K],
  ) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleConfirm = async () => {
    if (!isLastModel) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    const validationError = validateTenantContractTemplateParams(params);
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      return;
    }

    try {
      await completeReview.mutateAsync({ params });
      toast({
        title: mode === "edit" ? "Parâmetros salvos" : "Modelos revisados",
        description:
          mode === "edit"
            ? "As alterações foram aplicadas aos modelos de contrato."
            : "Confirme os termos do módulo para concluir a habilitação.",
      });
      onReviewCompleted?.();
    } catch (mutationError) {
      toast({
        title: "Não foi possível concluir a revisão",
        description:
          mutationError instanceof Error ? mutationError.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando revisão dos modelos...
      </div>
    );
  }

  if (error || !currentOption) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Não foi possível carregar os modelos para revisão.
      </div>
    );
  }

  const isEditMode = mode === "edit";
  const Icon = templateIcons[currentOption.key];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>
                {isEditMode ? "Parametrização dos modelos de contrato" : "Revisão dos modelos de contrato"}
              </CardTitle>
              <CardDescription>
                Modelo {currentIndex + 1} de {totalModels}.{" "}
                {isEditMode
                  ? "Ajuste os parâmetros e confira a prévia com os dados do seu espaço."
                  : "Revise como o contrato será exibido com os dados já configurados no seu espaço."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onRestartSetup ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void onRestartSetup()}>
                  Recomeçar configuração
                </Button>
              ) : null}
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                <Icon className="h-4 w-4" aria-hidden />
                {currentOption.definition.name}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {prefilledSummary.length > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
              <p className="font-medium text-foreground">Dados já preenchidos automaticamente</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {prefilledSummary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>
                  Campos do cliente e da festa aparecem como{" "}
                  <span className="font-medium text-foreground">{CONTRACT_PREVIEW_PLACEHOLDER}</span>{" "}
                  até o fechamento do evento.
                </li>
              </ul>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Parâmetros do contrato</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete os dados do espaço que entram em todos os modelos selecionados.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="capacidade">Capacidade máxima do espaço</Label>
                  <Input
                    id="capacidade"
                    type="number"
                    min={1}
                    value={params.capacidade_maxima_espaco ?? ""}
                    onChange={(event) =>
                      updateParam(
                        "capacidade_maxima_espaco",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <Label htmlFor="comarca">Comarca do foro</Label>
                  <Input
                    id="comarca"
                    value={params.comarca_foro}
                    onChange={(event) => updateParam("comarca_foro", event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <Label htmlFor="tolerancia">Tolerância de encerramento (minutos)</Label>
                  <Input
                    id="tolerancia"
                    type="number"
                    min={0}
                    value={params.tolerancia_encerramento ?? ""}
                    onChange={(event) =>
                      updateParam(
                        "tolerancia_encerramento",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <Label htmlFor="hora-extra">Valor da hora extra</Label>
                  <CurrencyInput
                    id="hora-extra"
                    value={params.valor_hora_extra}
                    onValueChange={(value) => updateParam("valor_hora_extra", value)}
                  />
                </div>

                {currentOption.key === "aluguel_espaco_festa_completa" && (
                  <>
                    <div>
                      <Label htmlFor="convidado-extra">Valor por convidado extra</Label>
                      <CurrencyInput
                        id="convidado-extra"
                        value={params.valor_convidado_extra}
                        onValueChange={(value) => updateParam("valor_convidado_extra", value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="idade-extra">Idade mínima para cobrança de extra</Label>
                      <Input
                        id="idade-extra"
                        type="number"
                        min={0}
                        value={params.idade_cobranca_convidado_extra ?? ""}
                        onChange={(event) =>
                          updateParam(
                            "idade_cobranca_convidado_extra",
                            event.target.value ? Number(event.target.value) : null,
                          )
                        }
                        className={inputClassName}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3 border-t border-border/50 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dados bancários
                </p>
                <div>
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={params.banco}
                    onChange={(event) => updateParam("banco", event.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="agencia">Agência</Label>
                    <Input
                      id="agencia"
                      value={params.agencia}
                      onChange={(event) => updateParam("agencia", event.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="conta">Conta</Label>
                    <Input
                      id="conta"
                      value={params.conta}
                      onChange={(event) => updateParam("conta", event.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pix">Chave Pix</Label>
                  <Input
                    id="pix"
                    value={params.chave_pix}
                    onChange={(event) => updateParam("chave_pix", event.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <Label htmlFor="titular">Titular da conta</Label>
                  <Input
                    id="titular"
                    value={params.titular_conta}
                    onChange={(event) => updateParam("titular_conta", event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-border/50 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cancelamento e remarcação
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="prazo-sem-multa">Dias sem multa extra</Label>
                    <Input
                      id="prazo-sem-multa"
                      type="number"
                      min={0}
                      value={params.prazo_cancelamento_sem_multa_adicional ?? ""}
                      onChange={(event) =>
                        updateParam(
                          "prazo_cancelamento_sem_multa_adicional",
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prazo-com-multa">Dias com multa</Label>
                    <Input
                      id="prazo-com-multa"
                      type="number"
                      min={0}
                      value={params.prazo_cancelamento_com_multa ?? ""}
                      onChange={(event) =>
                        updateParam(
                          "prazo_cancelamento_com_multa",
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="percentual-multa">Multa (%)</Label>
                    <Input
                      id="percentual-multa"
                      type="number"
                      min={0}
                      max={100}
                      value={params.percentual_multa_cancelamento ?? ""}
                      onChange={(event) =>
                        updateParam(
                          "percentual_multa_cancelamento",
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prazo-remarcacao">Remarcação (meses)</Label>
                    <Input
                      id="prazo-remarcacao"
                      type="number"
                      min={1}
                      value={params.prazo_maximo_remarcacao ?? ""}
                      onChange={(event) =>
                        updateParam(
                          "prazo_maximo_remarcacao",
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-[480px] rounded-xl border border-border/60 bg-background/60 p-4 sm:p-6">
              <div
                className={cn(
                  contractDocumentClassName,
                  "max-h-[70vh] overflow-y-auto pr-2",
                )}
              >
                <ContractDocumentView html={previewHtml} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={currentIndex === 0 || completeReview.isPending}
              onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Modelo anterior
            </Button>

            <Button type="button" disabled={completeReview.isPending} onClick={() => void handleConfirm()}>
              {completeReview.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isLastModel ? (
                isEditMode ? "Salvar parâmetros" : "Confirmar modelos e continuar"
              ) : (
                <>
                  Próximo modelo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
