import { PropsWithChildren } from "react";

import { toast } from "@/hooks/use-toast";
import { useGuidedSetup } from "@/features/guided-setup/guided-setup-provider";

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  if (target.closest("[data-guided-setup-allowed]")) return false;
  if (target.closest("a[href]")) return false;
  if (target.closest("button[aria-label='Abrir menu'], button[aria-label='Fechar menu']")) return false;

  return Boolean(
    target.closest(
      "button, input, textarea, select, [role='button'], [role='combobox'], [contenteditable='true']",
    ),
  );
};

export const ReadOnlyModeGuard = ({ children }: PropsWithChildren) => {
  const { isReadOnlyMode } = useGuidedSetup();

  if (!isReadOnlyMode) return children;

  return (
    <div
      onClickCapture={(event) => {
        if (!isInteractiveTarget(event.target)) return;

        event.preventDefault();
        event.stopPropagation();

        toast({
          title: "Configuração inicial pendente",
          description: "Conclua a configuração guiada para liberar alterações na plataforma.",
        });
      }}
    >
      {children}
    </div>
  );
};
