import { LucideIcon } from "lucide-react";

interface FormTabPlaceholderProps {
  description: string;
  icon: LucideIcon;
  phaseLabel?: string;
  title: string;
}

export const FormTabPlaceholder = ({
  description,
  icon: Icon,
  phaseLabel = "Próxima fase",
  title,
}: FormTabPlaceholderProps) => (
  <div className="glass-card flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Icon className="h-7 w-7" aria-hidden />
    </div>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{phaseLabel}</p>
    <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
  </div>
);
