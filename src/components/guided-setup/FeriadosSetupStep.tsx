import { Loader2 } from "lucide-react";

import { GuidedSetupContinueBar } from "@/components/guided-setup/GuidedSetupContinueBar";
import { TenantHolidaysConfig } from "@/pages/configuracoes/Feriados";
import { useTenantHolidayCalendar } from "@/features/configuracoes/use-tenant-holidays";
import { useFinishGuidedSetupStep } from "@/features/guided-setup/use-finish-guided-setup-step";

interface FeriadosSetupStepProps {
  onCompleted?: () => void;
}

export const FeriadosSetupStep = ({ onCompleted }: FeriadosSetupStepProps) => {
  const year = new Date().getFullYear();
  const { data: entries = [], isLoading } = useTenantHolidayCalendar(year);
  const { finishStep, isPending } = useFinishGuidedSetupStep("feriados");

  const additionalCount = entries.filter((row) => row.source === "tenant" && row.active).length;

  const handleContinue = () => {
    void finishStep({
      onSuccess: onCompleted,
      successMessage: "Feriados configurados.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando feriados...
      </div>
    );
  }

  return (
    <div data-guided-setup-allowed className="space-y-6">
      <TenantHolidaysConfig hideHeader />
      <GuidedSetupContinueBar
        description={
          additionalCount === 0
            ? "Revise as datas automáticas e, se quiser, cadastre feriados da cidade ou da empresa. Você pode continuar e ajustar depois em Configurações."
            : `${additionalCount} feriado${additionalCount === 1 ? "" : "s"} adicional${additionalCount === 1 ? "" : "is"} cadastrado${additionalCount === 1 ? "" : "s"}. Você pode editar depois em Configurações.`
        }
        isPending={isPending}
        onContinue={handleContinue}
      />
    </div>
  );
};
