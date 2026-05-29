import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { EventoContractStatus } from "./contract-types";

export const contractStatusLabels: Record<EventoContractStatus, string> = {
  accepted: "Aceito",
  cancelled: "Cancelado",
  draft: "Rascunho",
  generated: "Aguardando aceite",
  superseded: "Substituído",
};

const contractStatusStyles: Record<EventoContractStatus, string> = {
  accepted: "bg-success/15 text-success border-success/30 hover:bg-success/15",
  cancelled: "bg-muted text-muted-foreground border-border hover:bg-muted",
  draft: "bg-muted text-muted-foreground border-border hover:bg-muted",
  generated: "border-warning/50 text-warning bg-warning/5 hover:bg-warning/5",
  superseded: "bg-muted text-muted-foreground border-border hover:bg-muted",
};

interface ContractStatusBadgeProps {
  className?: string;
  status: EventoContractStatus;
}

export const ContractStatusBadge = ({ status, className }: ContractStatusBadgeProps) => (
  <Badge variant="outline" className={cn(contractStatusStyles[status], className)}>
    {contractStatusLabels[status]}
  </Badge>
);
