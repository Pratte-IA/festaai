import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  accent?: "primary" | "coral" | "rosa" | "lilas" | "success" | "warning";
  /** Estilo aninhado dentro de um glass-card (igual atividade comercial). */
  embedded?: boolean;
}

const accentClasses = {
  primary: "bg-primary/15 text-primary",
  coral: "bg-coral/15 text-coral",
  rosa: "bg-rosa/15 text-rosa",
  lilas: "bg-lilas/15 text-lilas",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  accent = "primary",
  embedded = false,
}: MetricCardProps) => {
  return (
    <div
      className={cn(
        "animate-fade-in",
        embedded ? "rounded-xl border border-border/60 bg-muted/20 p-4" : "glass-card p-5",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div
          className={cn(
            "flex items-center justify-center rounded-lg",
            embedded ? "h-8 w-8" : "h-10 w-10",
            accentClasses[accent],
          )}
        >
          <Icon className={embedded ? "h-4 w-4" : "h-5 w-5"} />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              change >= 0 ? "text-success" : "text-coral",
            )}
          >
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {embedded ? (
        <>
          <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
          <p className="px-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        </>
      )}
    </div>
  );
};

export default MetricCard;
