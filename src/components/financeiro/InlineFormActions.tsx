import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface InlineFormActionsProps {
  isPending?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}

export const InlineFormActions = ({
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel = "Salvar",
}: InlineFormActionsProps) => (
  <div className="flex justify-end gap-2">
    <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
      Cancelar
    </Button>
    <Button size="sm" onClick={onSubmit} disabled={isPending}>
      {submitLabel}
    </Button>
  </div>
);

export const InlineFormShell = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={`rounded-lg border border-primary/30 bg-muted/30 p-3 space-y-3 ${className}`}>
    {children}
  </div>
);
