import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Loader2, PartyPopper } from "lucide-react";

import { ContractTemplateEditorPanel } from "@/components/contracts/ContractTemplateEditorPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTenantFinancialSettings } from "@/features/configuracoes";
import { useTenantPackages } from "@/features/configuracoes/use-tenant-packages";
import {
  CONTRACT_PREVIEW_PLACEHOLDER,
  computePackageExtraGuestUnitPrice,
  defaultTenantContractTemplateParams,
  isTenantContractTemplateParamsComplete,
  renderContractTemplatePreview,
  validateTenantContractTemplateParams,
  type TenantContractTemplateParams,
} from "@/features/eventos/contracts/contract-template-params";
import { getPackagePriceForGuests } from "@/features/eventos/closing-form-runtime";
import type { ContractTemplateKey } from "@/features/eventos/contracts/contract-template-types";
import { isLegacyContractTemplateStub } from "@/features/eventos/contracts/resolve-contract-template-html";
import {
  useCompleteContractModelsReview,
  useRestoreContractTemplateHtml,
  useSaveContractTemplateHtml,
  useSaveContractTemplateParams,
  useSyncLegacyContractTemplates,
  useTenantContractModuleSettings,
  useTenantContractTypeOptions,
} from "@/features/eventos/use-tenant-contract-module-settings";
import { useTenantCompanyProfile } from "@/features/guided-setup/use-tenant-company-profile";
import { toast } from "@/hooks/use-toast";

const templateIcons: Record<ContractTemplateKey, typeof Building2> = {
  aluguel_espaco: Building2,
  aluguel_espaco_festa_completa: PartyPopper,
};

const inputClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ContractModelsReviewStepProps {
  mode?: "setup" | "edit";
  onParamsSaved?: () => void;
  onRestartSetup?: () => void | Promise<void>;
  onReviewCompleted?: () => void;
}

export const ContractModelsReviewStep = ({
  mode = "setup",
  onParamsSaved,
  onRestartSetup,
  onReviewCompleted,
}: ContractModelsReviewStepProps) => {
  const { data: options = [], error, isLoading } = useTenantContractTypeOptions();
  const enabledOptions = useMemo(() => options.filter((option) => option.enabled), [options]);
  const requiresFestaCompletaFields = useMemo(
    () => enabledOptions.some((option) => option.key === "aluguel_espaco_festa_completa"),
    [enabledOptions],
  );
  const validationOptions = useMemo(
    () => ({ requiresFestaCompletaFields }),
    [requiresFestaCompletaFields],
  );
  const { data: moduleSettings } = useTenantContractModuleSettings();
  const { data: companyProfile } = useTenantCompanyProfile();
  const { data: financialSettings } = useTenantFinancialSettings();
  const { data: packages = [] } = useTenantPackages();
  const completeReview = useCompleteContractModelsReview();
  const saveParams = useSaveContractTemplateParams();
  const saveTemplateHtml = useSaveContractTemplateHtml();
  const restoreTemplateHtml = useRestoreContractTemplateHtml();
  const syncLegacyTemplates = useSyncLegacyContractTemplates();
  const legacySyncStarted = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paramsSaved, setParamsSaved] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [templateDrafts, setTemplateDrafts] = useState<Partial<Record<ContractTemplateKey, string>>>(
    {},
  );
  const [templateDirty, setTemplateDirty] = useState<Partial<Record<ContractTemplateKey, boolean>>>(
    {},
  );
  const [templateSaved, setTemplateSaved] = useState<Partial<Record<ContractTemplateKey, boolean>>>(
    {},
  );
  const [params, setParams] = useState<TenantContractTemplateParams>(() =>
    defaultTenantContractTemplateParams(),
  );

  useEffect(() => {
    const stored = moduleSettings?.templateParams;
    const defaults = defaultTenantContractTemplateParams();
    const nextParams = {
      ...defaults,
      ...stored,
      comarca_foro: stored?.comarca_foro || companyProfile?.addressCity || defaults.comarca_foro,
      titular_conta:
        stored?.titular_conta || companyProfile?.companyName?.trim() || defaults.titular_conta,
    };
    setParams(nextParams);
    setParamsSaved(isTenantContractTemplateParamsComplete(nextParams, validationOptions));
  }, [
    companyProfile?.addressCity,
    companyProfile?.companyName,
    moduleSettings?.templateParams,
    validationOptions,
  ]);

  const packageSample = useMemo(
    () => packages.find((pkg) => pkg.active) ?? packages[0] ?? null,
    [packages],
  );

  const extraGuestPricePreview = useMemo(
    () => computePackageExtraGuestUnitPrice(packageSample),
    [packageSample],
  );

  const extraGuestPriceSummary = useMemo(() => {
    if (!packageSample || extraGuestPricePreview == null) return null;

    const guestCount =
      packageSample.includedGuests ?? packageSample.pricingTiers?.[0]?.minGuests ?? null;
    if (guestCount == null || guestCount <= 0) return null;

    const totalValue = getPackagePriceForGuests(packageSample, guestCount);
    const formattedTotal = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(totalValue);
    const formattedUnit = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(extraGuestPricePreview);

    return `${formattedTotal} ÷ ${guestCount} convidados = ${formattedUnit} (pacote ${packageSample.name})`;
  }, [extraGuestPricePreview, packageSample]);

  const currentOption = enabledOptions[currentIndex];
  const totalModels = enabledOptions.length;
  const isLastModel = currentIndex >= totalModels - 1;

  useEffect(() => {
    setIsEditingTemplate(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!enabledOptions.length || legacySyncStarted.current || syncLegacyTemplates.isPending) {
      return;
    }

    const hasLegacyStub = enabledOptions.some((option) =>
      isLegacyContractTemplateStub(option.storedTemplateHtml),
    );

    if (!hasLegacyStub) return;

    legacySyncStarted.current = true;

    void syncLegacyTemplates.mutateAsync().then((result) => {
      if (result.syncedCount > 0) {
        setTemplateDrafts({});
        setTemplateDirty({});
        setTemplateSaved({});
      }
    });
  }, [enabledOptions, syncLegacyTemplates]);

  useEffect(() => {
    if (!currentOption) return;

    setTemplateDrafts((current) => {
      if (current[currentOption.key] != null) return current;
      return {
        ...current,
        [currentOption.key]: currentOption.templateHtml,
      };
    });

    setTemplateSaved((current) => {
      if (current[currentOption.key] != null) return current;
      return {
        ...current,
        [currentOption.key]: currentOption.isCustomized,
      };
    });
  }, [currentOption]);

  const currentTemplateDraft = currentOption
    ? (templateDrafts[currentOption.key] ?? currentOption.templateHtml)
    : "";

  const previewHtml = useMemo(() => {
    if (!currentOption || !currentTemplateDraft) return "";

    return renderContractTemplatePreview(currentTemplateDraft, {
      companyProfile,
      financialSettings: financialSettings ?? null,
      packageSample,
      params,
    });
  }, [
    companyProfile,
    currentOption,
    currentTemplateDraft,
    financialSettings,
    packageSample,
    params,
  ]);

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
    setParamsSaved(false);
  };

  const handleTemplateDraftChange = (html: string) => {
    if (!currentOption) return;

    setTemplateDrafts((current) => ({
      ...current,
      [currentOption.key]: html,
    }));
    setTemplateDirty((current) => ({
      ...current,
      [currentOption.key]: true,
    }));
    setTemplateSaved((current) => ({
      ...current,
      [currentOption.key]: false,
    }));
  };

  const handleSaveTemplate = async () => {
    if (!currentOption?.id) {
      toast({
        title: "Modelo indisponível",
        description: "Salve a seleção de modelos antes de personalizar as cláusulas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await saveTemplateHtml.mutateAsync({
        templateHtml: currentTemplateDraft,
        templateId: currentOption.id,
        templateKey: currentOption.key,
        version: currentOption.version,
      });

      setTemplateDrafts((current) => ({
        ...current,
        [currentOption.key]: result.templateHtml,
      }));
      setTemplateDirty((current) => ({
        ...current,
        [currentOption.key]: false,
      }));
      setTemplateSaved((current) => ({
        ...current,
        [currentOption.key]: true,
      }));
      setIsEditingTemplate(false);
      toast({
        title: "Cláusulas salvas",
        description: "A versão personalizada deste modelo foi salva para o seu espaço.",
      });
    } catch (mutationError) {
      toast({
        title: "Não foi possível salvar as cláusulas",
        description:
          mutationError instanceof Error ? mutationError.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreTemplate = async () => {
    if (!currentOption?.id) return;

    try {
      const result = await restoreTemplateHtml.mutateAsync({
        templateId: currentOption.id,
        templateKey: currentOption.key,
        version: currentOption.version,
      });

      setTemplateDrafts((current) => ({
        ...current,
        [currentOption.key]: result.templateHtml,
      }));
      setTemplateDirty((current) => ({
        ...current,
        [currentOption.key]: false,
      }));
      setTemplateSaved((current) => ({
        ...current,
        [currentOption.key]: false,
      }));
      toast({
        title: "Modelo padrão restaurado",
        description: "As cláusulas voltaram ao texto original do sistema.",
      });
    } catch (mutationError) {
      toast({
        title: "Não foi possível restaurar o modelo",
        description:
          mutationError instanceof Error ? mutationError.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleSaveParams = async () => {
    const validationError = validateTenantContractTemplateParams(params, validationOptions);
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      return;
    }

    try {
      await saveParams.mutateAsync({
        params,
        requiresFestaCompletaFields,
      });
      setParamsSaved(true);
      toast({
        title: "Parâmetros salvos",
        description: "As informações de parametrização foram salvas no banco de dados.",
      });
      onParamsSaved?.();
    } catch (mutationError) {
      toast({
        title: "Não foi possível salvar os parâmetros",
        description:
          mutationError instanceof Error ? mutationError.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const hasUnsavedTemplateChanges = useMemo(
    () => enabledOptions.some((option) => templateDirty[option.key]),
    [enabledOptions, templateDirty],
  );

  const handleConfirm = async () => {
    if (!isLastModel) {
      if (hasUnsavedTemplateChanges) {
        toast({
          title: "Salve as cláusulas antes de continuar",
          description: "Há alterações no texto do contrato que ainda não foram salvas.",
          variant: "destructive",
        });
        return;
      }

      setCurrentIndex((index) => index + 1);
      return;
    }

    if (!paramsSaved) {
      toast({
        title: "Salve os parâmetros antes de concluir",
        description: "Preencha todos os campos e clique em Salvar parâmetros.",
        variant: "destructive",
      });
      return;
    }

    if (hasUnsavedTemplateChanges) {
      toast({
        title: "Salve as cláusulas antes de concluir",
        description: "Há alterações no texto do contrato que ainda não foram salvas.",
        variant: "destructive",
      });
      return;
    }

    const validationError = validateTenantContractTemplateParams(params, validationOptions);
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      return;
    }

    try {
      await completeReview.mutateAsync({
        params,
        requiresFestaCompletaFields,
      });
      toast({
        title: mode === "edit" ? "Revisão concluída" : "Modelos revisados",
        description:
          mode === "edit"
            ? "A parametrização está completa."
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
    <div className="mx-auto max-w-6xl space-y-6" data-guided-setup-allowed>
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
                  Preencha todos os campos e salve antes de concluir a revisão dos modelos.
                </p>
                {paramsSaved ? (
                  <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Parâmetros salvos no banco de dados.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Há alterações não salvas ou campos pendentes.
                  </p>
                )}
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
                    value={params.valor_hora_extra ?? 0}
                    onChange={(value) => updateParam("valor_hora_extra", value)}
                    className={inputClassName}
                  />
                </div>

                {requiresFestaCompletaFields ? (
                  <>
                    <div>
                      <Label htmlFor="convidado-extra">Valor por convidado extra</Label>
                      <div
                        id="convidado-extra"
                        className={`${inputClassName} bg-muted/40 text-muted-foreground`}
                      >
                        {extraGuestPricePreview != null
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(extraGuestPricePreview)
                          : "—"}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Calculado automaticamente na contratação: valor total do pacote ÷ número de
                        convidados inclusos.
                        {extraGuestPriceSummary ? (
                          <>
                            {" "}
                            Exemplo com seu pacote: {extraGuestPriceSummary}.
                          </>
                        ) : null}
                      </p>
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
                    <div>
                      <Label htmlFor="prazo-alteracao-convidados">
                        Prazo para alteração de convidados (dias)
                      </Label>
                      <Input
                        id="prazo-alteracao-convidados"
                        type="number"
                        min={0}
                        value={params.prazo_alteracao_convidados ?? ""}
                        onChange={(event) =>
                          updateParam(
                            "prazo_alteracao_convidados",
                            event.target.value ? Number(event.target.value) : null,
                          )
                        }
                        className={inputClassName}
                      />
                    </div>
                  </>
                ) : null}
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
                <div>
                  <Label htmlFor="prazo-confirmacao-entrada">
                    Prazo para confirmação da entrada (dias)
                  </Label>
                  <Input
                    id="prazo-confirmacao-entrada"
                    type="number"
                    min={1}
                    value={params.prazo_confirmacao_entrada ?? ""}
                    onChange={(event) =>
                      updateParam(
                        "prazo_confirmacao_entrada",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    className={inputClassName}
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={saveParams.isPending || completeReview.isPending}
                onClick={() => void handleSaveParams()}
              >
                {saveParams.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando parâmetros...
                  </>
                ) : (
                  "Salvar parâmetros"
                )}
              </Button>
            </div>

            <ContractTemplateEditorPanel
              isEditing={isEditingTemplate}
              isRestoring={restoreTemplateHtml.isPending}
              isSaving={saveTemplateHtml.isPending}
              onCancelEdit={() => setIsEditingTemplate(false)}
              onDraftChange={handleTemplateDraftChange}
              onRestoreDefault={() => void handleRestoreTemplate()}
              onSave={() => void handleSaveTemplate()}
              onStartEdit={() => setIsEditingTemplate(true)}
              previewHtml={previewHtml}
              templateDraft={currentTemplateDraft}
              templateDirty={Boolean(currentOption && templateDirty[currentOption.key])}
              templateSaved={Boolean(currentOption && templateSaved[currentOption.key])}
            />
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

            <Button
              type="button"
              disabled={completeReview.isPending || saveParams.isPending}
              onClick={() => void handleConfirm()}
            >
              {completeReview.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Concluindo...
                </>
              ) : isLastModel ? (
                isEditMode ? "Concluir revisão dos modelos" : "Concluir revisão e continuar"
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
