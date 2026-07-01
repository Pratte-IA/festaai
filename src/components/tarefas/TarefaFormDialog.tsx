import { useEffect, useState } from "react";

import type { Evento } from "@/features/eventos/types";
import { resolveProfileDisplayName } from "@/features/tarefas/resolve-tarefa-responsavel";
import type { TenantMemberWithProfile } from "@/features/usuarios";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatIsoDateBR } from "@/lib/date";

interface TarefaFormValues {
  assignedTo: string;
  dataLimite: string | null;
  eventoId: number;
  titulo: string;
}

interface TarefaEditValues {
  assignedTo: string;
  dataLimite: string | null;
  titulo: string;
}

interface TarefaFormDialogProps {
  defaultAssignedTo?: string | null;
  eventos: Evento[];
  initialValues?: Partial<TarefaFormValues>;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TarefaFormValues | TarefaEditValues) => void | Promise<void>;
  open: boolean;
  teamMembers: TenantMemberWithProfile[];
}

const getEventoOptionLabel = (evento: Evento) => {
  const parts = [evento.cliente_nome];
  if (evento.aniversariante_nome) {
    parts.push(`(${evento.aniversariante_nome})`);
  }
  if (evento.data_evento) {
    parts.push(`— ${formatIsoDateBR(evento.data_evento)}`);
  }
  return parts.join(" ");
};

const getMemberOptionLabel = (member: TenantMemberWithProfile) =>
  resolveProfileDisplayName(member.profile) ?? "Usuario";

export const TarefaFormDialog = ({
  defaultAssignedTo,
  eventos,
  initialValues,
  isSubmitting = false,
  mode,
  onOpenChange,
  onSubmit,
  open,
  teamMembers,
}: TarefaFormDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [eventoId, setEventoId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitulo(initialValues?.titulo ?? "");
    setDataLimite(initialValues?.dataLimite ?? "");
    setEventoId(initialValues?.eventoId ? String(initialValues.eventoId) : "");
    setAssignedTo(
      initialValues?.assignedTo ??
        defaultAssignedTo ??
        teamMembers[0]?.user_id ??
        "",
    );
  }, [defaultAssignedTo, initialValues, open, teamMembers]);

  const handleSubmit = () => {
    const trimmedTitulo = titulo.trim();
    if (!trimmedTitulo || !assignedTo) return;

    if (mode === "create") {
      const parsedEventoId = Number(eventoId);
      if (!parsedEventoId) return;

      void onSubmit({
        assignedTo,
        dataLimite: dataLimite || null,
        eventoId: parsedEventoId,
        titulo: trimmedTitulo,
      });
      return;
    }

    void onSubmit({
      assignedTo,
      dataLimite: dataLimite || null,
      titulo: trimmedTitulo,
    });
  };

  const isValid =
    titulo.trim().length > 0 &&
    assignedTo !== "" &&
    (mode === "edit" || (eventoId !== "" && Number(eventoId) > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nova tarefa" : "Editar tarefa"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Vincule a tarefa a um evento, responsavel e prazo opcional."
              : "Atualize titulo, responsavel ou prazo da tarefa."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="tarefa-evento">Evento</Label>
              <Select value={eventoId} onValueChange={setEventoId}>
                <SelectTrigger id="tarefa-evento">
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {eventos.map((evento) => (
                    <SelectItem key={evento.id} value={String(evento.id)}>
                      {getEventoOptionLabel(evento)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tarefa-responsavel">Responsavel</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="tarefa-responsavel">
                <SelectValue placeholder="Selecione um usuario" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {getMemberOptionLabel(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tarefa-titulo">Titulo</Label>
            <Input
              id="tarefa-titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Descreva a tarefa..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && isValid) {
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tarefa-prazo">Prazo (opcional)</Label>
            <Input
              id="tarefa-prazo"
              type="date"
              value={dataLimite}
              onChange={(event) => setDataLimite(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Salvando..." : mode === "create" ? "Criar tarefa" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
