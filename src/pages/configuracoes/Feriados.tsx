import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Loader2, Plus, RotateCcw } from "lucide-react";

import { SettingsPageHeader, SettingsStatChip } from "@/components/configuracoes/SettingsPageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getSettingsPageMeta } from "@/pages/configuracoes/settings-page-meta";
import {
  defaultTenantHolidayInput,
  HOLIDAY_KIND_LABELS,
  HOLIDAY_RECURRENCE_LABELS,
  HOLIDAY_SCOPE_LABELS,
  type HolidayKind,
  type TenantHolidayCalendarEntry,
  type TenantHolidayInput,
  type TenantHolidayScope,
} from "@/features/configuracoes/holiday-types";
import {
  useCreateTenantHoliday,
  useDeleteTenantHoliday,
  useTenantHolidayCalendar,
  useToggleTenantHolidayActive,
  useUpdateTenantHoliday,
} from "@/features/configuracoes/use-tenant-holidays";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const formatDateBr = (iso: string) => {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

const toTenantHolidayInput = (row: TenantHolidayCalendarEntry): TenantHolidayInput => ({
  active: row.active,
  holidayDate: row.date,
  kind: row.kind,
  name: row.name,
  recursAnnually: row.recursAnnually,
  scope: row.scope === "national" ? "municipal" : row.scope,
});

interface TenantHolidaysConfigProps {
  hideHeader?: boolean;
}

export const TenantHolidaysConfig = ({ hideHeader = false }: TenantHolidaysConfigProps) => {
  const meta = getSettingsPageMeta("feriados")!;
  const { toast } = useToast();
  const [year, setYear] = useState(currentYear);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TenantHolidayInput>(defaultTenantHolidayInput);
  const [inactiveTwinId, setInactiveTwinId] = useState<number | null>(null);

  const calendarQuery = useTenantHolidayCalendar(year);
  const createHoliday = useCreateTenantHoliday(year);
  const updateHoliday = useUpdateTenantHoliday(year);
  const toggleActive = useToggleTenantHolidayActive(year);
  const deleteHoliday = useDeleteTenantHoliday(year);

  const entries = calendarQuery.data ?? [];
  const automatic = entries.filter((row) => row.source === "automatic");
  const additional = entries.filter((row) => row.source === "tenant");
  const additionalActive = additional.filter((row) => row.active);
  const isEditing = editingId != null;

  const automaticDates = useMemo(
    () => new Set(automatic.map((row) => row.date)),
    [automatic],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultTenantHolidayInput());
    setInactiveTwinId(null);
    setDialogOpen(true);
  };

  const openEdit = (row: TenantHolidayCalendarEntry) => {
    if (row.id == null) return;
    setEditingId(row.id);
    setForm(toTenantHolidayInput(row));
    setInactiveTwinId(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setInactiveTwinId(null);

    if (!form.name.trim() || !form.holidayDate) {
      toast({
        title: "Preencha nome e data",
        variant: "destructive",
      });
      return;
    }

    if (!form.recursAnnually && automaticDates.has(form.holidayDate)) {
      toast({
        title: "Data já automática",
        description:
          "Esta data já está no calendário automático. Não é necessário cadastrá-la novamente.",
        variant: "destructive",
      });
      return;
    }

    if (form.recursAnnually) {
      const md = form.holidayDate.slice(5);
      const fixedAutomaticMd = new Set(
        automatic
          .filter((row) => row.recurrenceType === "fixed_annual")
          .map((row) => row.date.slice(5)),
      );
      if (fixedAutomaticMd.has(md)) {
        toast({
          title: "Dia/mês já automático",
          description:
            "Este dia e mês coincidem com um feriado automático fixo. Não é necessário cadastrá-lo novamente.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (isEditing && editingId != null) {
        await updateHoliday.mutateAsync({ id: editingId, input: form });
        toast({ title: "Feriado atualizado" });
      } else {
        await createHoliday.mutateAsync(form);
        toast({ title: "Feriado cadastrado" });
      }
      setDialogOpen(false);
      setEditingId(null);
    } catch (error) {
      const twinId =
        !isEditing && error && typeof error === "object" && "inactiveTwinId" in error
          ? Number((error as { inactiveTwinId?: number }).inactiveTwinId)
          : null;
      if (twinId) {
        setInactiveTwinId(twinId);
        return;
      }
      const message = error instanceof Error ? error.message : "Não foi possível salvar.";
      toast({ title: "Erro ao salvar", description: message, variant: "destructive" });
    }
  };

  const handleReactivate = async () => {
    if (!inactiveTwinId) return;
    try {
      await toggleActive.mutateAsync({ active: true, id: inactiveTwinId });
      toast({ title: "Feriado reativado" });
      setDialogOpen(false);
      setInactiveTwinId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível reativar.";
      toast({ title: "Erro ao reativar", description: message, variant: "destructive" });
    }
  };

  return (
    <div className={hideHeader ? "space-y-6" : "max-w-6xl space-y-8"}>
      {!hideHeader ? (
        <SettingsPageHeader
          title={meta.title}
          description={meta.description}
          stats={
            <>
              <SettingsStatChip>{automatic.length} automáticas</SettingsStatChip>
              <SettingsStatChip>
                {additionalActive.length} adicionais ativas
                {additional.length !== additionalActive.length
                  ? ` (${additional.length - additionalActive.length} inativas)`
                  : ""}
              </SettingsStatChip>
            </>
          }
          renderAction={(className) => (
            <Button type="button" className={className} onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Adicionar feriado
            </Button>
          )}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SettingsStatChip>{automatic.length} automáticas</SettingsStatChip>
            <SettingsStatChip>
              {additionalActive.length} adicionais ativas
              {additional.length !== additionalActive.length
                ? ` (${additional.length - additionalActive.length} inativas)`
                : ""}
            </SettingsStatChip>
          </div>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Adicionar feriado
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="holiday-year" className="text-sm text-muted-foreground">
          Ano
        </Label>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger id="holiday-year" className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {calendarQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando calendário…
        </div>
      ) : calendarQuery.isError ? (
        <p className="text-sm text-destructive">
          {calendarQuery.error instanceof Error
            ? calendarQuery.error.message
            : "Não foi possível carregar o calendário."}
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Datas consideradas automaticamente na precificação
              </h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
                Estes feriados e datas especiais já são considerados automaticamente na precificação.
                Não é necessário cadastrá-los novamente.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Data</th>
                    <th className="px-4 py-2.5 font-medium">Nome</th>
                    <th className="px-4 py-2.5 font-medium">Abrangência</th>
                    <th className="px-4 py-2.5 font-medium">Tipo</th>
                    <th className="px-4 py-2.5 font-medium">Recorrência</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {automatic.map((row) => (
                    <tr key={`auto-${row.date}-${row.name}`} className="border-t border-border/50">
                      <td className="px-4 py-2.5 tabular-nums">{formatDateBr(row.date)}</td>
                      <td className="px-4 py-2.5">{row.name}</td>
                      <td className="px-4 py-2.5">{HOLIDAY_SCOPE_LABELS[row.scope]}</td>
                      <td className="px-4 py-2.5">{HOLIDAY_KIND_LABELS[row.kind]}</td>
                      <td className="px-4 py-2.5">
                        {HOLIDAY_RECURRENCE_LABELS[row.recurrenceType]}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                          Considerado automaticamente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Feriados adicionais da sua cidade ou empresa
                </h2>
                <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
                  Cadastre somente feriados estaduais, municipais ou datas especiais que não
                  aparecem na lista automática.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                Adicionar
              </Button>
            </div>

            {additional.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
                Nenhum feriado adicional cadastrado para {year}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Data</th>
                      <th className="px-4 py-2.5 font-medium">Nome</th>
                      <th className="px-4 py-2.5 font-medium">Abrangência</th>
                      <th className="px-4 py-2.5 font-medium">Tipo</th>
                      <th className="px-4 py-2.5 font-medium">Recorrência</th>
                      <th className="px-4 py-2.5 font-medium">Ativo</th>
                      <th className="px-4 py-2.5 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additional.map((row) => (
                      <tr
                        key={`tenant-${row.id}-${row.date}`}
                        className={cn(
                          "border-t border-border/50",
                          !row.active && "opacity-60",
                        )}
                      >
                        <td className="px-4 py-2.5 tabular-nums">{formatDateBr(row.date)}</td>
                        <td className="px-4 py-2.5">{row.name}</td>
                        <td className="px-4 py-2.5">{HOLIDAY_SCOPE_LABELS[row.scope]}</td>
                        <td className="px-4 py-2.5">{HOLIDAY_KIND_LABELS[row.kind]}</td>
                        <td className="px-4 py-2.5">
                          {HOLIDAY_RECURRENCE_LABELS[row.recurrenceType]}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.id != null ? (
                            <Switch
                              checked={row.active}
                              onCheckedChange={(checked) => {
                                void toggleActive.mutateAsync({ active: checked, id: row.id! }).catch(
                                  (error) => {
                                    toast({
                                      title: "Erro ao atualizar",
                                      description:
                                        error instanceof Error
                                          ? error.message
                                          : "Não foi possível alterar o status.",
                                      variant: "destructive",
                                    });
                                  },
                                );
                              }}
                              aria-label={row.active ? "Desativar feriado" : "Ativar feriado"}
                            />
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.id != null ? (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(row)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (!window.confirm(`Excluir “${row.name}”?`)) return;
                                  void deleteHoliday.mutateAsync(row.id!).then(
                                    () => toast({ title: "Feriado excluído" }),
                                    (error) =>
                                      toast({
                                        title: "Erro ao excluir",
                                        description:
                                          error instanceof Error
                                            ? error.message
                                            : "Não foi possível excluir.",
                                        variant: "destructive",
                                      }),
                                  );
                                }}
                              >
                                Excluir
                              </Button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setInactiveTwinId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar feriado" : "Adicionar feriado"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize os dados deste feriado adicional."
                : "Cadastre apenas datas que não aparecem na lista automática."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <Label htmlFor="holiday-name">Nome</Label>
              <Input
                id="holiday-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holiday-date">Data</Label>
              <Input
                id="holiday-date"
                type="date"
                value={form.holidayDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, holidayDate: event.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Abrangência</Label>
                <Select
                  value={form.scope}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, scope: value as TenantHolidayScope }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state">Estadual</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="tenant">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.kind}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, kind: value as HolidayKind }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official">Oficial</SelectItem>
                    <SelectItem value="optional">Facultativo / comercial</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <Checkbox
                checked={form.recursAnnually}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, recursAnnually: Boolean(checked) }))
                }
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">Repete todo ano</span>
                <span className="block text-xs text-muted-foreground">
                  Usa o mesmo dia e mês nos próximos anos. Datas móveis automáticas (Carnaval,
                  Sexta Santa, Corpus) podem coexistir no calendário.
                </span>
              </span>
            </label>

            {inactiveTwinId ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm">
                <p>
                  Já existe um registro idêntico inativo. Reative-o em vez de criar uma
                  duplicata.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => void handleReactivate()}
                  disabled={toggleActive.isPending}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Reativar registro existente
                </Button>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createHoliday.isPending || updateHoliday.isPending}
              >
                {createHoliday.isPending || updateHoliday.isPending
                  ? "Salvando…"
                  : isEditing
                    ? "Salvar alterações"
                    : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ConfiguracoesFeriados = () => <TenantHolidaysConfig />;

export default ConfiguracoesFeriados;
