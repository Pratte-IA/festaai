import { ReactNode } from "react";

export interface SettingsSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const SettingsSection = ({
  title,
  description,
  action,
  children,
}: SettingsSectionProps) => {
  const showHeader = Boolean(title ?? description ?? action);

  return (
    <section className="space-y-5">
      {showHeader && (
        <div className="flex items-end justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className={`text-sm text-muted-foreground ${title ? "mt-1" : ""}`}>{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
};
