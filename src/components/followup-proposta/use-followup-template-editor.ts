import { useMemo, useState } from "react";

import {
  useSaveTenantMessageTemplate,
  useTenantMessageTemplates,
  type MessageTemplate,
} from "@/features/configuracoes";
import { toast } from "@/hooks/use-toast";

export const useFollowupTemplateEditor = () => {
  const { data: templates = [], isLoading } = useTenantMessageTemplates();
  const saveTemplate = useSaveTenantMessageTemplate();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const templateByKey = useMemo(() => new Map(templates.map((t) => [t.key, t])), [templates]);

  const getTemplate = (
    key: string,
    fallbackTitle: string,
    defaultBody = "",
  ): MessageTemplate => {
    const stored = templateByKey.get(key);
    const storedBody = stored?.body?.trim() ? stored.body : undefined;
    return {
      body: drafts[key] ?? storedBody ?? defaultBody,
      id: stored?.id,
      key,
      title: stored?.title ?? fallbackTitle,
    };
  };

  const setDraftBody = (key: string, body: string) => {
    setDrafts((current) => ({ ...current, [key]: body }));
  };

  const handleSave = async (template: MessageTemplate) => {
    setSavingKey(template.key);
    try {
      await saveTemplate.mutateAsync(template);
      setDrafts((current) => {
        const next = { ...current };
        delete next[template.key];
        return next;
      });
      toast({ title: "Mensagem salva" });
    } catch {
      toast({
        title: "Não foi possível salvar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  return {
    getTemplate,
    handleSave,
    isLoading,
    savingKey,
    setDraftBody,
  };
};
