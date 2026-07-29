import { Badge } from "@/components/ui/badge";
import { CRM_PRIORITY_LABELS, type CrmPriority } from "@/features/radar-crm";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANTS: Record<CrmPriority, string> = {
  high: "border-transparent bg-destructive/15 text-destructive",
  medium: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  low: "border-transparent bg-muted text-muted-foreground",
};

interface RadarPriorityBadgeProps {
  priority: CrmPriority;
  className?: string;
}

export const RadarPriorityBadge = ({ priority, className }: RadarPriorityBadgeProps) => (
  <Badge className={cn("font-medium", PRIORITY_VARIANTS[priority], className)} variant="outline">
    {CRM_PRIORITY_LABELS[priority]}
  </Badge>
);
