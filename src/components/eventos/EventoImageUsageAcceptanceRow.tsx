import { Camera } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type ImageUsageAcceptanceStatus,
  useEventoImageUsageAcceptance,
} from "@/features/eventos";

interface EventoImageUsageAcceptanceRowProps {
  eventoId: number;
}

const statusBadgeClassName: Record<ImageUsageAcceptanceStatus, string> = {
  authorized:
    "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  declined:
    "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  pending: "text-muted-foreground",
};

export const EventoImageUsageAcceptanceRow = ({
  eventoId,
}: EventoImageUsageAcceptanceRowProps) => {
  const { isLoading, label, status } = useEventoImageUsageAcceptance(eventoId);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Camera className="h-3.5 w-3.5 shrink-0" />
        Uso de imagem (aniversariante e família)
      </span>
      {isLoading ? (
        <span className="text-sm text-muted-foreground italic">Carregando...</span>
      ) : (
        <Badge variant="outline" className={cn("font-medium", statusBadgeClassName[status])}>
          {label}
        </Badge>
      )}
    </div>
  );
};
