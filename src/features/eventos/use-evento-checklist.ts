import { useCallback, useEffect, useMemo, useRef } from "react";

import { useTenantChecklist } from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

import {
  buildEventChecklistState,
  calculateChecklistProgress,
  isChecklistComplete,
  parseChecklistConcluidos,
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

  const checklist = useMemo(() => {
    const config = resolveEventChecklistConfig(tenantCategories);
    return buildEventChecklistState(config, concluidos);
  }, [concluidos, tenantCategories]);

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

  return {
    checklist,
    isLoading,
    isSaving: updateEvento.isPending || updateEventoStage.isPending,
    overallProgress,
    toggleItem,
  };
};
