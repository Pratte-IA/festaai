import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

import { FollowupCollapsiblePanel } from "@/components/followup-proposta/FollowupCollapsiblePanel";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MessageTemplate } from "@/features/configuracoes";
import { cn } from "@/lib/utils";

export const FollowupTemplateEditor = ({
  description,
  isSaving,
  onChange,
  onSave,
  previewMessage,
  template,
  title,
  variables,
}: {
  description: string;
  isSaving: boolean;
  onChange: (body: string) => void;
  onSave: () => void;
  previewMessage: string;
  template: MessageTemplate;
  title: string;
  variables: string[];
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <FollowupCollapsiblePanel description={description} title={title}>
      <div className="space-y-2">
        <Label htmlFor={`template-${template.key}`}>Mensagem padrão</Label>
        <Textarea
          id={`template-${template.key}`}
          value={template.body}
          onChange={(event) => onChange(event.target.value)}
          rows={10}
          className="font-mono text-sm leading-relaxed"
        />
        <p className="text-xs text-muted-foreground">Variáveis: {variables.join(" · ")}</p>
      </div>

      <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
        <CollapsibleTrigger asChild>
          <Button
            className="h-auto w-full justify-between gap-2 px-3 py-2.5 text-left font-normal"
            type="button"
            variant="outline"
          >
            <span className="text-sm text-foreground">Prévia com dados de exemplo</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                previewOpen && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="rounded-xl border border-border/60 bg-background/80 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {previewMessage}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button disabled={isSaving} onClick={onSave} size="sm" type="button">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar mensagem"
        )}
      </Button>
    </FollowupCollapsiblePanel>
  );
};
