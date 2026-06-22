import { Link } from "react-router-dom";
import { PropsWithChildren } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AdminPageShellProps extends PropsWithChildren {
  backHref?: string;
  backLabel?: string;
  description?: string;
  title: string;
}

export const AdminPageShell = ({
  backHref = "/admin",
  backLabel = "Voltar para Admin",
  children,
  description,
  title,
}: AdminPageShellProps) => (
  <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(81,88,231,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbf7ff_100%)] px-4 py-8 text-foreground sm:px-6 lg:px-10">
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Button asChild className="w-fit" variant="outline">
        <Link to={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      <header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin FestaAI — Comercial
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </header>

      {children}
    </div>
  </main>
);
