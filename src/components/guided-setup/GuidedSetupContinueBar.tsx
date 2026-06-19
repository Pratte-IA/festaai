import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface GuidedSetupContinueBarProps {
  description: string;
  disabled?: boolean;
  isPending?: boolean;
  onContinue: () => void;
}

export const GuidedSetupContinueBar = ({
  description,
  disabled = false,
  isPending = false,
  onContinue,
}: GuidedSetupContinueBarProps) => (
  <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm text-muted-foreground">{description}</p>
    <Button
      type="button"
      disabled={disabled || isPending}
      className="min-w-40 shrink-0"
      onClick={onContinue}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Salvando...
        </>
      ) : (
        "Salvar e continuar"
      )}
    </Button>
  </div>
);
