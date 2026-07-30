import { Link } from "react-router-dom";
import { PropsWithChildren, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AdminPageShellProps extends PropsWithChildren {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  description?: string;
  title: string;
}

export const AdminPageShell = ({
  actions,
  backHref,
  backLabel = "Voltar",
  children,
  description,
  title,
}: AdminPageShellProps) => (
  <main className="px-4 py-8 sm:px-6 lg:px-10">
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {backHref ? (
        <Button asChild className="w-fit" variant="outline">
          <Link to={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      ) : null}

      <header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0 pt-1">{actions}</div> : null}
        </div>
      </header>

      {children}
    </div>
  </main>
);
