import { Badge } from "@/components/ui/badge";
import { CRM_STATUS_LABELS, type CrmStatus } from "@/features/radar-crm";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<CrmStatus, string> = {
  new_lead: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  qualifying: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  contact_started: "border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  in_conversation: "border-transparent bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  demo_scheduled: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  proposal_sent: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  negotiating: "border-transparent bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
  won: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  lost: "border-transparent bg-destructive/15 text-destructive",
};

interface RadarStatusBadgeProps {
  status: CrmStatus;
  className?: string;
}

export const RadarStatusBadge = ({ status, className }: RadarStatusBadgeProps) => (
  <Badge className={cn("font-medium", STATUS_VARIANTS[status], className)} variant="outline">
    {CRM_STATUS_LABELS[status]}
  </Badge>
);
