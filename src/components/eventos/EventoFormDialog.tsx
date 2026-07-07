import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { PackageData } from "@/data/packagesData";
import {
  Evento,
  EventType,
  FunnelType,
  funnelTabs,
  getDefaultStageForFunnel,
  isStageValidForFunnel,
  recalculateEventoGuestPricing,
  stageMap,
  Stage,
} from "@/features/eventos";
import { normalizeBrazilMobilePhoneForStorage, toBrazilPhoneInputValue } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface EventoFormValues {
  aniversariante_data_nascimento: string | null;
  aniversariante_nome: string | null;
  cliente_email: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  data_evento: string | null;
  etapa: Stage;
  funil: FunnelType;
  hora_evento: string | null;
  observacoes: string | null;
  origem: string | null;
  pacote_nome: string | null;
  quantidade_convidados: number | null;
  status_interno: "novo" | "ativo" | "pendente" | "finalizado" | "perdido" | "cancelado";
  tipo_evento: EventType;
  valor_adicionais: number;
  valor_entrada: number;
  valor_pacote: number;
  valor_total: number;
}

interface EventoFormDialogProps {
  initialEvento?: Evento | null;
  initialFunnel?: FunnelType;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EventoFormValues) => Promise<void> | void;
  open: boolean;
  packages?: PackageData[];
}

interface EventoFormState {
  aniversariante_data_nascimento: string;
  aniversariante_nome: string;
  cliente_email: string;
  cliente_nome: string;
  cliente_telefone: string;
  data_evento: string;
  etapa: Stage;
  funil: FunnelType;
  hora_evento: string;
  observacoes: string;
  origem: string;
  pacote_nome: string;
  quantidade_convidados: string;
  tipo_evento: EventType;
  valor_adicionais: string;
  valor_entrada: string;
  valor_pacote: string;
}

const positiveNumberString = z
  .string()
  .trim()
  .refine((value) => value === "" || Number(value) >= 0, "Informe um valor maior ou igual a zero.");

const eventoFormSchema = z
  .object({
    aniversariante_data_nascimento: z.string(),
    aniversariante_nome: z.string().trim(),
    cliente_email: z.union([z.literal(""), z.string().email("Informe um e-mail valido.")]),
    cliente_nome: z.string().trim().min(2, "Informe o nome do cliente."),
    cliente_telefone: z.string().trim(),
    data_evento: z.string(),
    etapa: z.string(),
    funil: z.enum(["vendas", "festa", "executadas"]),
    hora_evento: z.string(),
    observacoes: z.string().trim(),
    origem: z.string().trim(),
    pacote_nome: z.string().trim(),
    quantidade_convidados: z
      .string()
      .trim()
      .refine((value) => value === "" || Number(value) >= 0, "Informe uma quantidade valida."),
    tipo_evento: z.enum(["festa", "visita"]),
    valor_adicionais: positiveNumberString,
    valor_entrada: positiveNumberString,
    valor_pacote: positiveNumberString,
  })
  .superRefine((values, context) => {
    if (!isStageValidForFunnel(values.funil, values.etapa as Stage)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A etapa selecionada nao pertence ao funil atual.",
        path: ["etapa"],
      });
    }
  });

const getInitialFormState = (
  initialEvento?: Evento | null,
  initialFunnel: FunnelType = "vendas",
): EventoFormState => {
  const funil = initialEvento?.funil ?? initialFunnel;

  return {
    aniversariante_data_nascimento: initialEvento?.aniversariante_data_nascimento ?? "",
    aniversariante_nome: initialEvento?.aniversariante_nome ?? "",
    cliente_email: initialEvento?.cliente_email ?? "",
    cliente_nome: initialEvento?.cliente_nome ?? "",
    cliente_telefone: toBrazilPhoneInputValue(initialEvento?.cliente_telefone),
    data_evento: initialEvento?.data_evento ?? "",
    etapa: initialEvento?.etapa ?? getDefaultStageForFunnel(funil),
    funil,
    hora_evento: initialEvento?.hora_evento?.slice(0, 5) ?? "",
    observacoes: initialEvento?.observacoes ?? "",
    origem: initialEvento?.origem ?? "",
    pacote_nome: initialEvento?.pacote_nome ?? "",
    quantidade_convidados: initialEvento?.quantidade_convidados?.toString() ?? "",
    tipo_evento: initialEvento?.tipo_evento ?? "festa",
    valor_adicionais: initialEvento?.valor_adicionais.toString() ?? "0",
    valor_entrada: initialEvento?.valor_entrada.toString() ?? "0",
    valor_pacote: initialEvento?.valor_pacote.toString() ?? "0",
  };
};

const optionalString = (value: string) => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const optionalNumber = (value: string) => (value.trim() ? Number(value) : null);

const moneyValue = (value: string) => (value.trim() ? Number(value) : 0);

export const EventoFormDialog = ({
  initialEvento,
  initialFunnel = "vendas",
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
  packages = [],
}: EventoFormDialogProps) => {
  const [form, setForm] = useState<EventoFormState>(() => getInitialFormState(initialEvento, initialFunnel));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(getInitialFormState(initialEvento, initialFunnel));
      setFormError(null);
    }
  }, [initialEvento, initialFunnel, open]);

  const stages = useMemo(() => stageMap[form.funil], [form.funil]);
  const totalValue = moneyValue(form.valor_pacote) + moneyValue(form.valor_adicionais);
  const hasLinkedPackagePricing = Boolean(initialEvento?.pacote_id && packages.length > 0);

  const updateForm = (values: Partial<EventoFormState>) => {
    setForm((currentForm) => ({ ...currentForm, ...values }));
  };

  const applyGuestPricing = useCallback(
    (currentForm: EventoFormState, guestCountValue: string, eventDate?: string) => {
      const nextForm: EventoFormState = {
        ...currentForm,
        quantidade_convidados: guestCountValue,
        ...(eventDate !== undefined ? { data_evento: eventDate } : {}),
      };

      if (!initialEvento?.pacote_id || packages.length === 0) {
        return nextForm;
      }

      const guestCount = guestCountValue.trim() ? Number(guestCountValue) : 0;
      if (!Number.isFinite(guestCount) || guestCount <= 0) {
        return nextForm;
      }

      const pricing = recalculateEventoGuestPricing({
        adicionaisSnapshot: initialEvento.adicionais_snapshot,
        dataEvento: (eventDate ?? currentForm.data_evento) || null,
        guestCount,
        pacoteId: initialEvento.pacote_id,
        packages,
        valorAdicionais: moneyValue(currentForm.valor_adicionais),
        valorPacote: moneyValue(currentForm.valor_pacote),
      });

      return {
        ...nextForm,
        valor_adicionais: pricing.valor_adicionais?.toString() ?? nextForm.valor_adicionais,
        valor_pacote: pricing.valor_pacote?.toString() ?? nextForm.valor_pacote,
      };
    },
    [initialEvento, packages],
  );

  const handleGuestCountChange = (value: string) => {
    setForm((currentForm) => applyGuestPricing(currentForm, value));
  };

  const handleEventDateChange = (value: string) => {
    setForm((currentForm) => applyGuestPricing(currentForm, currentForm.quantidade_convidados, value));
  };

  const handleFunnelChange = (funil: FunnelType) => {
    updateForm({
      etapa: getDefaultStageForFunnel(funil),
      funil,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsedForm = eventoFormSchema.safeParse(form);

    if (!parsedForm.success) {
      setFormError(parsedForm.error.issues[0]?.message ?? "Revise os dados informados.");
      return;
    }

    const values = parsedForm.data;

    await onSubmit({
      aniversariante_data_nascimento: optionalString(values.aniversariante_data_nascimento),
      aniversariante_nome: optionalString(values.aniversariante_nome),
      cliente_email: optionalString(values.cliente_email),
      cliente_nome: values.cliente_nome.trim(),
      cliente_telefone: normalizeBrazilMobilePhoneForStorage(values.cliente_telefone),
      data_evento: optionalString(values.data_evento),
      etapa: values.etapa as Stage,
      funil: values.funil,
      hora_evento: optionalString(values.hora_evento),
      observacoes: optionalString(values.observacoes),
      origem: optionalString(values.origem),
      pacote_nome: optionalString(values.pacote_nome),
      quantidade_convidados: optionalNumber(values.quantidade_convidados),
      status_interno: values.etapa === "perdido" ? "perdido" : "ativo",
      tipo_evento: values.tipo_evento,
      valor_adicionais: moneyValue(values.valor_adicionais),
      valor_entrada: moneyValue(values.valor_entrada),
      valor_pacote: moneyValue(values.valor_pacote),
      valor_total: totalValue,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialEvento ? "Editar evento" : "Novo evento"}</DialogTitle>
          <DialogDescription>
            Registre os dados principais do cliente e mantenha a etapa alinhada ao funil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Cliente">
              <Input
                required
                value={form.cliente_nome}
                onChange={(event) => updateForm({ cliente_nome: event.target.value })}
                placeholder="Nome do responsavel"
              />
            </Field>

            <Field label="Telefone">
              <PhoneInput
                value={form.cliente_telefone}
                onChange={(value) => updateForm({ cliente_telefone: value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>

            <Field label="E-mail">
              <Input
                type="email"
                value={form.cliente_email}
                onChange={(event) => updateForm({ cliente_email: event.target.value })}
                placeholder="cliente@email.com"
              />
            </Field>

            <Field label="Origem">
              <Input
                value={form.origem}
                onChange={(event) => updateForm({ origem: event.target.value })}
                placeholder="Instagram, indicacao, Google..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Funil">
              <Select value={form.funil} onValueChange={(value) => handleFunnelChange(value as FunnelType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {funnelTabs.map((funnel) => (
                    <SelectItem key={funnel.key} value={funnel.key}>
                      {funnel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Etapa">
              <Select value={form.etapa} onValueChange={(value) => updateForm({ etapa: value as Stage })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.key} value={stage.key}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tipo">
              <Select value={form.tipo_evento} onValueChange={(value) => updateForm({ tipo_evento: value as EventType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="festa">Festa</SelectItem>
                  <SelectItem value="visita">Visita</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Aniversariante">
              <Input
                value={form.aniversariante_nome}
                onChange={(event) => updateForm({ aniversariante_nome: event.target.value })}
                placeholder="Nome da crianca"
              />
            </Field>

            <Field label="Nascimento">
              <Input
                type="date"
                value={form.aniversariante_data_nascimento}
                onChange={(event) => updateForm({ aniversariante_data_nascimento: event.target.value })}
              />
            </Field>

            <Field label="Data do evento">
              <Input
                type="date"
                value={form.data_evento}
                onChange={(event) => handleEventDateChange(event.target.value)}
              />
            </Field>

            <Field label="Horario">
              <Input
                type="time"
                value={form.hora_evento}
                onChange={(event) => updateForm({ hora_evento: event.target.value })}
              />
            </Field>

            <Field label="Convidados">
              <Input
                min="0"
                type="number"
                value={form.quantidade_convidados}
                onChange={(event) => handleGuestCountChange(event.target.value)}
                placeholder="40"
              />
              {hasLinkedPackagePricing ? (
                <p className="text-xs text-muted-foreground">
                  O valor do pacote é recalculado automaticamente conforme a tabela de preços.
                </p>
              ) : null}
            </Field>

            <Field label="Pacote">
              <Input
                value={form.pacote_nome}
                onChange={(event) => updateForm({ pacote_nome: event.target.value })}
                placeholder="Pacote Ouro"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Valor do pacote">
              <Input
                min="0"
                step="0.01"
                type="number"
                value={form.valor_pacote}
                onChange={(event) => updateForm({ valor_pacote: event.target.value })}
              />
            </Field>

            <Field label="Adicionais">
              <Input
                min="0"
                step="0.01"
                type="number"
                value={form.valor_adicionais}
                onChange={(event) => updateForm({ valor_adicionais: event.target.value })}
              />
            </Field>

            <Field label="Entrada">
              <Input
                min="0"
                step="0.01"
                type="number"
                value={form.valor_entrada}
                onChange={(event) => updateForm({ valor_entrada: event.target.value })}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm">
            Total previsto: <span className="font-semibold">R$ {totalValue.toFixed(2).replace(".", ",")}</span>
          </div>

          <Field label="Observacoes">
            <Textarea
              rows={3}
              value={form.observacoes}
              onChange={(event) => updateForm({ observacoes: event.target.value })}
              placeholder="Preferencias, detalhes do atendimento ou combinados importantes"
            />
          </Field>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);
