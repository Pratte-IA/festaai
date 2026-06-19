import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const SettingsStatChip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">
    {children}
  </span>
);

interface SettingsPageHeaderProps {
  title: string;
  description: string;
  className?: string;
  renderAction?: (className: string) => ReactNode;
  stats?: ReactNode;
}

export const SettingsPageHeader = ({
  title,
  description,
  className,
  renderAction,
  stats,
}: SettingsPageHeaderProps) => (
  <header className={cn("space-y-2", className)}>
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {renderAction?.("hidden shrink-0 md:inline-flex")}
    </div>
    <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    {renderAction?.("w-full shrink-0 sm:w-auto md:hidden")}
    {stats ? <div className="flex flex-wrap items-center gap-2 pt-0.5">{stats}</div> : null}
  </header>
);
