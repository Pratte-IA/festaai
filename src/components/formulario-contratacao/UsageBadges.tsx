import { Badge } from "@/components/ui/badge";
import {
  CLOSING_FORM_USAGE_LABELS,
  ClosingFormFieldUsage,
} from "@/features/configuracoes";
import { cn } from "@/lib/utils";

const usageStyles: Record<keyof ClosingFormFieldUsage, string> = {
  ai: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  checklist: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  contract: "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200",
  internalTask: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  partySummary: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  reports: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
};

interface UsageBadgesProps {
  className?: string;
  usage: ClosingFormFieldUsage;
}

export const UsageBadges = ({ usage, className }: UsageBadgesProps) => {
  const activeUsages = (Object.keys(usage) as Array<keyof ClosingFormFieldUsage>).filter(
    (key) => usage[key],
  );

  if (activeUsages.length === 0) {
    return <span className="text-xs text-muted-foreground italic">Sem destino definido</span>;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {activeUsages.map((key) => (
        <Badge
          key={key}
          variant="outline"
          className={cn("text-[11px] font-medium", usageStyles[key])}
        >
          {CLOSING_FORM_USAGE_LABELS[key]}
        </Badge>
      ))}
    </div>
  );
};
