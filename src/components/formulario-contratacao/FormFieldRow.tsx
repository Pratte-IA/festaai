import { ChevronDown, ChevronUp, Lock, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ClosingFormField,
  closingFormFieldTypeLabels,
  closingFormSectionLabels,
} from "@/features/configuracoes";
import { cn } from "@/lib/utils";

import { FieldCategoryBadge } from "./FieldCategoryBadge";
import { UsageBadges } from "./UsageBadges";

interface FormFieldRowProps {
  canMoveDown: boolean;
  canMoveUp: boolean;
  field: ClosingFormField;
  isBusy?: boolean;
  onDelete?: (field: ClosingFormField) => void;
  onEdit: (field: ClosingFormField) => void;
  onMove: (field: ClosingFormField, direction: "down" | "up") => void;
  onToggleActive: (field: ClosingFormField, active: boolean) => void;
  onToggleRequired: (field: ClosingFormField, required: boolean) => void;
}

export const FormFieldRow = ({
  canMoveDown,
  canMoveUp,
  field,
  isBusy,
  onDelete,
  onEdit,
  onMove,
  onToggleActive,
  onToggleRequired,
}: FormFieldRowProps) => {
  const activeToggleDisabled = field.isLocked || isBusy;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/20 px-4 py-4 last:border-b-0",
        !field.active && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex shrink-0 flex-col gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canMoveUp || isBusy}
            onClick={() => onMove(field, "up")}
            aria-label="Mover campo para cima"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canMoveDown || isBusy}
            onClick={() => onMove(field, "down")}
            aria-label="Mover campo para baixo"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{field.label}</p>
            {field.isSystem && (
              <Badge variant="secondary" className="text-[11px]">
                Sistema
              </Badge>
            )}
            {field.isLocked && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/40 text-[11px] text-amber-700 dark:text-amber-200"
              >
                <Lock className="h-3 w-3" aria-hidden />
                Crítico
              </Badge>
            )}
            {!field.active && (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                Inativo
              </Badge>
            )}
          </div>

          {field.description && (
            <p className="text-xs leading-relaxed text-muted-foreground">{field.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{closingFormFieldTypeLabels[field.fieldType]}</span>
            <span aria-hidden>·</span>
            <span>{closingFormSectionLabels[field.section]}</span>
            {field.fieldKey && (
              <>
                <span aria-hidden>·</span>
                <code className="rounded bg-muted/60 px-1 py-0.5 text-[10px]">{field.fieldKey}</code>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FieldCategoryBadge category={field.category} />
            <UsageBadges usage={field.usage} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={field.required}
              disabled={isBusy || (field.isLocked && field.required)}
              onCheckedChange={(checked) => onToggleRequired(field, checked)}
            />
            Obrigatório
          </label>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={field.active}
              disabled={activeToggleDisabled}
              onCheckedChange={(checked) => onToggleActive(field, checked)}
            />
            Ativo
          </label>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isBusy}
              onClick={() => onEdit(field)}
              aria-label={`Editar ${field.label}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {!field.isSystem && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isBusy}
                onClick={() => onDelete(field)}
                aria-label={`Excluir ${field.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
