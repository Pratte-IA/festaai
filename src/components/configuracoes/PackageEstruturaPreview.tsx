import { Gamepad2 } from "lucide-react";
import type { EstruturaBlock } from "@/data/packagesData";

interface PackageEstruturaPreviewProps {
  estrutura: EstruturaBlock;
}

const ChipList = ({ items, label }: { items: string[]; label?: string }) => (
  <div>
    {label !== undefined ? (
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
    ) : null}
    {items.length === 0 ? (
      <p className="text-xs text-muted-foreground/80 italic">Nenhum item</p>
    ) : (
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-full">
            {item}
          </span>
        ))}
      </div>
    )}
  </div>
);

export const PackageEstruturaPreview = ({ estrutura }: PackageEstruturaPreviewProps) => (
  <div className="rounded-xl bg-card/60 border border-border/40 p-4 space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Gamepad2 className="w-4 h-4 text-primary" aria-hidden />
      Brinquedos
    </div>
    <ChipList items={estrutura.brinquedos} />
  </div>
);
