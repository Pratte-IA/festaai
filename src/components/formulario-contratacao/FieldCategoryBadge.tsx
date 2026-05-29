import { Badge } from "@/components/ui/badge";
import {
  ClosingFormFieldCategory,
  closingFormFieldCategoryLabels,
} from "@/features/configuracoes";
import { cn } from "@/lib/utils";

const categoryStyles: Record<ClosingFormFieldCategory, string> = {
  comercial: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  contratual: "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200",
  experiencia: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  financeiro: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  interno: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  operacional: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

interface FieldCategoryBadgeProps {
  category: ClosingFormFieldCategory;
  className?: string;
}

export const FieldCategoryBadge = ({ category, className }: FieldCategoryBadgeProps) => (
  <Badge
    variant="outline"
    className={cn("font-medium", categoryStyles[category], className)}
  >
    {closingFormFieldCategoryLabels[category]}
  </Badge>
);
