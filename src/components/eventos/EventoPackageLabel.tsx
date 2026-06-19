import { Badge } from "@/components/ui/badge";
import { getEventoPackageDisplay } from "@/features/eventos/evento-package-display";
import type { Evento } from "@/features/eventos";
import type { PackageData } from "@/data/packagesData";
import { cn } from "@/lib/utils";

interface EventoPackageLabelProps {
  className?: string;
  evento: Pick<Evento, "pacote_id" | "pacote_nome">;
  packages?: PackageData[];
  showLegacyBadge?: boolean;
}

export const EventoPackageLabel = ({
  className,
  evento,
  packages = [],
  showLegacyBadge = true,
}: EventoPackageLabelProps) => {
  const { isLegacy, label } = getEventoPackageDisplay(evento, packages);

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span className={isLegacy ? "text-foreground" : undefined}>{label}</span>
      {showLegacyBadge && isLegacy && (
        <Badge variant="outline" className="text-[10px] font-normal">
          Legado
        </Badge>
      )}
    </span>
  );
};
