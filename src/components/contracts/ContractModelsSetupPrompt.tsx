import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, PartyPopper, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  type ContractTemplateKey,
} from "@/features/eventos/contracts/contract-template-types";
import {
  useSaveContractModuleModels,
  useTenantContractTypeOptions,
} from "@/features/eventos/use-tenant-contract-module-settings";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const templateIcons: Record<ContractTemplateKey, typeof Building2> = {
  aluguel_espaco: Building2,
  aluguel_espaco_festa_completa: PartyPopper,
};

export const ContractModelsSetupPrompt = () => {
  const { data: adminCapability, isLoading: isAdminLoading } = useTenantAdminCapability();
  const { data: options = [], isLoading: isOptionsLoading } = useTenantContractTypeOptions();
  const saveModels = useSaveContractModuleModels();
  const [enabledKeys, setEnabledKeys] = useState<Set<ContractTemplateKey>>(new Set());

  useEffect(() => {
    if (options.length === 0) return;

    setEnabledKeys(new Set(options.filter((option) => option.enabled).map((option) => option.key)));
  }, [options]);

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.definition.sortOrder - b.definition.sortOrder),
    [options],
  );

  const toggleKey = (key: ContractTemplateKey, checked: boolean) => {
    setEnabledKeys((previous) => {
      const next = new Set(previous);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (enabledKeys.size === 0) {
      toast({
        title: "Selecione ao menos um tipo de contrato.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveModels.mutateAsync({ enabledKeys: [...enabledKeys] });
      toast({
        title: "Modelos selecionados",
        description: "Revise cada modelo antes de aceitar os termos do módulo.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível salvar os modelos",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  if (isAdminLoading || isOptionsLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando modelos de contrato...
      </div>
    );
  }

  if (!adminCapability?.isTenantAdmin) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Configuração pendente do administrador</CardTitle>
          <CardDescription>
            Um administrador do espaço precisa escolher quais tipos de contrato serão utilizados
            antes de habilitar o módulo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Modelos de contrato</CardTitle>
        <CardDescription>
          Escolha quais tipos de contrato seu espaço utilizará. Você poderá revisar e personalizar
          as cláusulas no próximo passo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            {sortedOptions.map((option) => {
              const Icon = templateIcons[option.key];
              const checked = enabledKeys.has(option.key);

              return (
                <label
                  key={option.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors",
                    checked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-background/40 hover:border-border",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      checked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-foreground">{option.definition.name}</p>
                      <Switch
                        checked={checked}
                        onCheckedChange={(value) => toggleKey(option.key, value)}
                        aria-label={`Habilitar ${option.definition.name}`}
                      />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {option.definition.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Habilite um ou os dois modelos. Pelo menos um tipo deve ficar ativo para continuar.
          </p>

          <Button type="submit" disabled={saveModels.isPending || enabledKeys.size === 0}>
            {saveModels.isPending ? "Salvando..." : "Salvar modelos e continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
