import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CRM_PRIORITIES,
  CRM_PRIORITY_LABELS,
  CRM_STATUSES,
  CRM_STATUS_LABELS,
  type CrmPriority,
  type CrmStatus,
  type RadarCrmFilters,
} from "@/features/radar-crm";
import type { RadarFilterOptions } from "@/features/radar-crm/types";

interface RadarFiltersProps {
  filters: RadarCrmFilters;
  options: RadarFilterOptions;
  onChange: (patch: Partial<RadarCrmFilters>) => void;
  onClear: () => void;
}

const toggleArrayItem = <T extends string>(items: T[], value: T): T[] =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

const TriStateSelect = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <select
      aria-label={label}
      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "any" ? null : next === "yes");
      }}
      value={value === null ? "any" : value ? "yes" : "no"}
    >
      <option value="any">Qualquer</option>
      <option value="yes">Sim</option>
      <option value="no">Não</option>
    </select>
  </div>
);

export const RadarFilters = ({ filters, options, onChange, onClear }: RadarFiltersProps) => (
  <Card className="rounded-2xl border-white/80 bg-white/90">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Filter className="h-4 w-4 text-primary" />
        Filtros
      </CardTitle>
      <Button onClick={onClear} size="sm" type="button" variant="ghost">
        <X className="mr-1 h-3.5 w-3.5" />
        Limpar
      </Button>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cidade</Label>
          <select
            aria-label="Filtrar por cidade"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            onChange={(event) => onChange({ city: event.target.value, page: 1 })}
            value={filters.city}
          >
            <option value="">Todas</option>
            {options.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <select
            aria-label="Filtrar por estado"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            onChange={(event) => onChange({ state: event.target.value, page: 1 })}
            value={filters.state}
          >
            <option value="">Todos</option>
            {options.states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Categoria</Label>
          <select
            aria-label="Filtrar por categoria"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            onChange={(event) => onChange({ category: event.target.value, page: 1 })}
            value={filters.category}
          >
            <option value="">Todas</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Responsável</Label>
          <select
            aria-label="Filtrar por responsável"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            onChange={(event) => onChange({ assignedUserId: event.target.value, page: 1 })}
            value={filters.assignedUserId}
          >
            <option value="">Qualquer</option>
            {options.assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.full_name ?? assignee.email ?? assignee.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TriStateSelect
          label="Tem Instagram"
          onChange={(value) => onChange({ hasInstagram: value, page: 1 })}
          value={filters.hasInstagram}
        />
        <TriStateSelect
          label="Tem telefone"
          onChange={(value) => onChange({ hasPhone: value, page: 1 })}
          value={filters.hasPhone}
        />
        <TriStateSelect
          label="Tem WhatsApp"
          onChange={(value) => onChange({ hasWhatsapp: value, page: 1 })}
          value={filters.hasWhatsapp}
        />
        <TriStateSelect
          label="Tem site"
          onChange={(value) => onChange({ hasWebsite: value, page: 1 })}
          value={filters.hasWebsite}
        />
        <TriStateSelect
          label="CNPJ validado"
          onChange={(value) => onChange({ cnpjValidated: value, page: 1 })}
          value={filters.cnpjValidated}
        />
        <TriStateSelect
          label="Cadastro ativo"
          onChange={(value) => onChange({ registrationActive: value, page: 1 })}
          value={filters.registrationActive}
        />
        <TriStateSelect
          label="Tem administrador"
          onChange={(value) => onChange({ hasAdministrator: value, page: 1 })}
          value={filters.hasAdministrator}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Próxima ação de</Label>
          <Input
            onChange={(event) => onChange({ nextActionFrom: event.target.value, page: 1 })}
            type="date"
            value={filters.nextActionFrom}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Próxima ação até</Label>
          <Input
            onChange={(event) => onChange({ nextActionTo: event.target.value, page: 1 })}
            type="date"
            value={filters.nextActionTo}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.withoutContact}
            onCheckedChange={(checked) => onChange({ withoutContact: checked === true, page: 1 })}
          />
          Sem contato registrado
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.overdueNextAction}
            onCheckedChange={(checked) => onChange({ overdueNextAction: checked === true, page: 1 })}
          />
          Próxima ação atrasada
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <div className="flex flex-wrap gap-2">
            {CRM_STATUSES.map((status) => (
              <label
                className="flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                key={status}
              >
                <Checkbox
                  checked={filters.statuses.includes(status)}
                  onCheckedChange={() =>
                    onChange({
                      statuses: toggleArrayItem(filters.statuses, status),
                      page: 1,
                    })
                  }
                />
                {CRM_STATUS_LABELS[status as CrmStatus]}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Prioridade</Label>
          <div className="flex flex-wrap gap-2">
            {CRM_PRIORITIES.map((priority) => (
              <label
                className="flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                key={priority}
              >
                <Checkbox
                  checked={filters.priorities.includes(priority)}
                  onCheckedChange={() =>
                    onChange({
                      priorities: toggleArrayItem(filters.priorities, priority),
                      page: 1,
                    })
                  }
                />
                {CRM_PRIORITY_LABELS[priority as CrmPriority]}
              </label>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
