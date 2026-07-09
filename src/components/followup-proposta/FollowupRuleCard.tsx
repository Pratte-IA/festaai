import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FollowupRuleVariant = "primary" | "destructive" | "neutral";

const variantStyles: Record<FollowupRuleVariant, { border: string; bg: string; icon: string }> = {
  primary: {
    border: "border-primary/25",
    bg: "bg-primary/5",
    icon: "text-primary",
  },
  destructive: {
    border: "border-destructive/25",
    bg: "bg-destructive/5",
    icon: "text-destructive",
  },
  neutral: {
    border: "border-border/60",
    bg: "bg-card/40",
    icon: "text-success",
  },
};

interface FollowupRuleCardProps {
  children: ReactNode;
  icon?: LucideIcon;
  title: string;
  variant?: FollowupRuleVariant;
}

export const FollowupRuleCard = ({
  children,
  icon: Icon = Clock,
  title,
  variant = "primary",
}: FollowupRuleCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn("rounded-xl border p-4 space-y-3", styles.border, styles.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", styles.icon)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const FollowupRuleList = ({ children }: { children: ReactNode }) => (
  <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-4">{children}</ul>
);

interface FollowupSectionProps {
  children: ReactNode;
}

/** Agrupa regra de disparo + painel de mensagem correspondente */
export const FollowupSection = ({ children }: FollowupSectionProps) => (
  <div className="space-y-3">{children}</div>
);
