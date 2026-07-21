import { useCallback, useEffect, useMemo, useRef } from "react";

import { useTenantChecklist } from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

import { parseAdicionaisSnapshot } from "./closing-form-runtime";
import {
  buildEventChecklistState,
  calculateChecklistProgress,
  createChecklistExtraItem,
  isChecklistComplete,
  parseChecklistConcluidos,
  parseChecklistExtras,
  resolveEventChecklistConfig,
} from "./evento-checklist";
import { Evento } from "./types";
import { useUpdateEvento } from "./use-update-evento";
import { useUpdateEventoStage } from "./use-update-evento-stage";

interface UseEventoChecklistOptions {
  evento: Evento;
  readOnly?: boolean;
}

export const useEventoChecklist = ({ evento, readOnly = false }: UseEventoChecklistOptions) => {
  const packageId = evento.pacote_id ? String(evento.pacote_id) : null;
  const { data: tenantCategories, isLoading } = useTenantChecklist(packageId);
  const updateEvento = useUpdateEvento();
  const updateEventoStage = useUpdateEventoStage();
  const migrationAttemptedRef = useRef(false);

  const concluidos = useMemo(
    () => parseChecklistConcluidos(evento.checklist_concluidos),
    [evento.checklist_concluidos],
  );

  const extras = useMemo(
    () => parseChecklistExtras(evento.checklist_extras),
    [evento.checklist_extras],
  );

  const adicionaisContratados = useMemo(
    () => parseAdicionaisSnapshot(evento.adicionais_snapshot),
    [evento.adicionais_snapshot],
  );

  const checklist = useMemo(() => {
    const config = resolveEventChecklistConfig(tenantCategories);
    return buildEventChecklistState(config, concluidos, adicionaisContratados, extras);
  }, [adicionaisContratados, concluidos, extras, tenantCategories]);

  const overallProgress = useMemo(() => calculateChecklistProgress(checklist), [checklist]);
  const isComplete = useMemo(() => isChecklistComplete(checklist), [checklist]);

  const migrateToFestaPronta = useCallback(() => {
    if (
      migrationAttemptedRef.current ||
      evento.funil !== "festa" ||
      evento.etapa !== "planejamento" ||
      !isComplete ||
      updateEventoStage.isPending
    ) {
      return;
    }

    migrationAttemptedRef.current = true;

    updateEventoStage.mutate(
      {
        eventoId: evento.id,
        funnel: "festa",
        stage: "festa_pronta",
      },
      {
        onSuccess: () => {
          toast({
            title: "Checklist concluido",
            description: "Evento movido automaticamente para Festa Pronta.",
          });
        },
        onError: () => {
          migrationAttemptedRef.current = false;
          toast({
            title: "Nao foi possivel mover o evento",
            description: "O checklist foi salvo, mas a etapa nao foi atualizada.",
            variant: "destructive",
          });
        },
      },
    );
  }, [evento.etapa, evento.funil, evento.id, isComplete, updateEventoStage]);

  useEffect(() => {
    migrateToFestaPronta();
  }, [migrateToFestaPronta]);

  const toggleItem = useCallback(
    (categoryId: string, itemId: string) => {
      if (readOnly || updateEvento.isPending) {
        return;
      }

      const nextConcluidos = new Set(concluidos);
      if (nextConcluidos.has(itemId)) {
        nextConcluidos.delete(itemId);
      } else {
        nextConcluidos.add(itemId);
      }

      updateEvento.mutate(
        {
          eventoId: evento.id,
          values: {
            checklist_concluidos: Array.from(nextConcluidos),
          },
        },
        {
          onError: () => {
            toast({
              title: "Nao foi possivel atualizar o checklist",
              variant: "destructive",
            });
          },
        },
      );
    },
    [concluidos, evento.id, readOnly, updateEvento],
  );

  const addExtraItem = useCallback(
    (label: string) => {
      if (readOnly || updateEvento.isPending) {
        return false;
      }

      const trimmed = label.trim();
      if (!trimmed) {
        return false;
      }

      const nextExtras = [...extras, createChecklistExtraItem(trimmed)];

      updateEvento.mutate(
        {
          eventoId: evento.id,
          values: {
            checklist_extras: nextExtras,
          },
        },
        {
          onError: () => {
            toast({
              title: "Nao foi possivel adicionar o item",
              variant: "destructive",
            });
          },
        },
      );

      return true;
    },
    [evento.id, extras, readOnly, updateEvento],
  );

  const removeExtraItem = useCallback(
    (itemId: string) => {
      if (readOnly || updateEvento.isPending) {
        return;
      }

      const nextExtras = extras.filter((item) => item.id !== itemId);
      const nextConcluidos = concluidos.filter((id) => id !== itemId);

      updateEvento.mutate(
        {
          eventoId: evento.id,
          values: {
            checklist_extras: nextExtras,
            checklist_concluidos: nextConcluidos,
          },
        },
        {
          onError: () => {
            toast({
              title: "Nao foi possivel remover o item",
              variant: "destructive",
            });
          },
        },
      );
    },
    [concluidos, evento.id, extras, readOnly, updateEvento],
  );

  return {
    addExtraItem,
    checklist,
    isLoading,
    isSaving: updateEvento.isPending || updateEventoStage.isPending,
    overallProgress,
    removeExtraItem,
    toggleItem,
  };
};
