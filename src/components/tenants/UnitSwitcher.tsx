import { useState } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";

import { CompanyProfileStepForm } from "@/components/guided-setup/CompanyProfileStepForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentTenant } from "@/features/tenants";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";

import { CreateFilialDialog } from "./CreateFilialDialog";

export const UnitSwitcher = ({ isTenantLoading }: { isTenantLoading: boolean }) => {
  const { currentTenant, currentUnit, setCurrentUnitId, units } = useCurrentTenant();
  const { data: adminCapability } = useTenantAdminCapability();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const canManageUnits = Boolean(adminCapability?.isTenantAdmin);

  const label = isTenantLoading ? "Carregando empresa…" : currentUnit?.name ?? currentTenant?.name ?? "Sem empresa ativa";
  const kindLabel = currentUnit?.kind === "filial" ? "Filial" : "Matriz";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Trocar casa"
          >
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-sidebar-accent-foreground">{label}</span>
              <span className="block truncate text-[11px] text-sidebar-foreground">
                {isTenantLoading ? "…" : `${kindLabel} · ${currentTenant?.slug ?? "Tenant"}`}
              </span>
            </span>
            <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sidebar-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Casas</DropdownMenuLabel>
          {units.map((unit) => (
            <DropdownMenuItem key={unit.id} onClick={() => setCurrentUnitId(unit.id)}>
              <span className="truncate">{unit.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {unit.kind === "matriz" ? "Matriz" : "Filial"}
              </span>
            </DropdownMenuItem>
          ))}
          {canManageUnits ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditOpen(true)}>Editar cadastro da casa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar filial
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateFilialDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastro da {currentUnit?.kind === "filial" ? "filial" : "matriz"}</DialogTitle>
            <DialogDescription>
              Estes dados valem só para {currentUnit?.name ?? "a casa selecionada"}.
            </DialogDescription>
          </DialogHeader>
          <CompanyProfileStepForm onCompleted={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export const AllUnitsReadToggle = () => {
  const { includeAllUnits, setIncludeAllUnits, units } = useCurrentTenant();
  const hasFilial = units.some((unit) => unit.kind === "filial");

  if (!hasFilial) return null;

  return (
    <Button
      type="button"
      variant={includeAllUnits ? "default" : "outline"}
      size="sm"
      onClick={() => setIncludeAllUnits(!includeAllUnits)}
    >
      {includeAllUnits ? "Vendo todas as casas" : "Todas as casas"}
    </Button>
  );
};
