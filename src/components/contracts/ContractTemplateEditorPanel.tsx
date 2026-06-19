import { Eye, Loader2, Pencil, RotateCcw, Save } from "lucide-react";

import { ContractDocumentView } from "@/components/contracts/ContractDocumentView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTRACT_TEMPLATE_PLACEHOLDER_GROUPS,
  formatContractPlaceholder,
} from "@/features/eventos/contracts/contract-template-placeholders";

interface ContractTemplateEditorPanelProps {
  isEditing: boolean;
  isRestoring: boolean;
  isSaving: boolean;
  onCancelEdit: () => void;
  onDraftChange: (html: string) => void;
  onRestoreDefault: () => void;
  onSave: () => void;
  onStartEdit: () => void;
  previewHtml: string;
  templateDraft: string;
  templateDirty: boolean;
  templateSaved: boolean;
}

export const ContractTemplateEditorPanel = ({
  isEditing,
  isRestoring,
  isSaving,
  onCancelEdit,
  onDraftChange,
  onRestoreDefault,
  onSave,
  onStartEdit,
  previewHtml,
  templateDraft,
  templateDirty,
  templateSaved,
}: ContractTemplateEditorPanelProps) => (
  <div className="flex min-h-[480px] flex-col rounded-xl border border-border/60 bg-background/60 p-4 sm:p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)]">
    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {isEditing ? "Editor de cláusulas" : "Prévia do contrato"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isEditing
            ? "Edite o HTML do modelo. Use placeholders como {{nome_espaco}} para campos dinâmicos."
            : "Role para ver o documento completo"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
              <Eye className="mr-1 h-4 w-4" />
              Prévia
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRestoring || isSaving}
              onClick={() => void onRestoreDefault()}
            >
              {isRestoring ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-1 h-4 w-4" />
              )}
              Restaurar padrão
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSaving || isRestoring || !templateDirty}
              onClick={() => void onSave()}
            >
              {isSaving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Salvar cláusulas
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={onStartEdit}>
            <Pencil className="mr-1 h-4 w-4" />
            Editar cláusulas
          </Button>
        )}
      </div>
    </div>

    {!isEditing && templateSaved && !templateDirty ? (
      <p className="mb-2 shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        Versão personalizada salva para este tenant.
      </p>
    ) : !isEditing && !templateSaved && !templateDirty ? (
      <p className="mb-2 shrink-0 text-xs text-muted-foreground">
        Contrato base do sistema. Clique em Editar cláusulas para personalizar.
      </p>
    ) : null}

    {!isEditing && templateDirty ? (
      <p className="mb-2 shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400">
        Há alterações nas cláusulas não salvas.
      </p>
    ) : null}

    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={templateDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="min-h-[360px] font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
          <details className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs">
            <summary className="cursor-pointer font-medium text-foreground">
              Placeholders disponíveis
            </summary>
            <div className="mt-3 space-y-3">
              {CONTRACT_TEMPLATE_PLACEHOLDER_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="font-medium text-foreground">{group.label}</p>
                  <p className="mt-1 flex flex-wrap gap-1 text-muted-foreground">
                    {group.placeholders.map((key) => (
                      <code
                        key={key}
                        className="rounded bg-background px-1 py-0.5 text-[10px]"
                      >
                        {formatContractPlaceholder(key)}
                      </code>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : (
        <ContractDocumentView html={previewHtml} />
      )}
    </div>
  </div>
);
