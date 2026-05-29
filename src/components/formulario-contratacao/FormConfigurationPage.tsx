import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { AcceptanceTermsTab } from "@/components/formulario-contratacao/AcceptanceTermsTab";
import { FormPreviewPanel } from "@/components/formulario-contratacao/FormPreviewPanel";
import { FormStructureTab } from "@/components/formulario-contratacao/FormStructureTab";
import { AddonsTab } from "@/components/formulario-contratacao/AddonsTab";
import { PackagesTab } from "@/components/formulario-contratacao/PackagesTab";
import { PaymentTab } from "@/components/formulario-contratacao/PaymentTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  DEFAULT_FORM_CONFIGURATION_TAB,
  FORM_CONFIGURATION_TABS,
  FormConfigurationTabId,
  isFormConfigurationTabId,
} from "./form-configuration-tabs";

export const FormConfigurationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo((): FormConfigurationTabId => {
    const tabParam = searchParams.get("tab");
    return isFormConfigurationTabId(tabParam) ? tabParam : DEFAULT_FORM_CONFIGURATION_TAB;
  }, [searchParams]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!tabParam || !isFormConfigurationTabId(tabParam)) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    if (!isFormConfigurationTabId(value)) return;
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="max-w-6xl space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList
          className={cn(
            "flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl",
            "bg-muted/40 p-1",
          )}
        >
          {FORM_CONFIGURATION_TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {FORM_CONFIGURATION_TABS.map(({ id }) => (
          <TabsContent key={id} value={id} className="mt-0 focus-visible:outline-none">
            {id === "estrutura" ? (
              <FormStructureTab />
            ) : id === "pacotes" ? (
              <PackagesTab />
            ) : id === "adicionais" ? (
              <AddonsTab />
            ) : id === "pagamento" ? (
              <PaymentTab />
            ) : id === "aceites" ? (
              <AcceptanceTermsTab />
            ) : id === "preview" ? (
              <FormPreviewPanel />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
