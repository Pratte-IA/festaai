import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isLockedSystemTerm,
  type TenantAcceptanceTerm,
  type TenantAcceptanceTermInput,
} from "@/features/configuracoes";

interface AcceptanceTermEditorDialogProps {
  draft: TenantAcceptanceTermInput;
  editingTerm: TenantAcceptanceTerm | null;
  isPending: boolean;
  onDraftChange: (draft: TenantAcceptanceTermInput) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
}

export const AcceptanceTermEditorDialog = ({
  draft,
  editingTerm,
  isPending,
  onDraftChange,
  onOpenChange,
  onSave,
  open,
}: AcceptanceTermEditorDialogProps) => {
  const isEditing = Boolean(editingTerm);
  const isSystem = editingTerm?.isSystem ?? false;
  const isLocked = editingTerm ? isLockedSystemTerm(editingTerm) : false;

  const update = (patch: Partial<TenantAcceptanceTermInput>) =>
    onDraftChange({ ...draft, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? isSystem
                ? "Editar termo do sistema"
                : "Editar aceite personalizado"
              : "Novo aceite ou regra"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isSystem && (
            <p className="text-sm text-muted-foreground rounded-lg border border-border/50 bg-muted/30 p-3">
              Este é um termo padrão do sistema. O título não pode ser alterado.
              {isLocked
                ? " Por ser essencial, ele não pode ser inativado."
                : " Você pode ajustar o conteúdo e as opções de exibição."}
            </p>
          )}

          <div>
            <Label htmlFor="acceptance-term-title">Título</Label>
            <Input
              id="acceptance-term-title"
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Ex: Autorizo o uso de imagem"
              disabled={isSystem}
              readOnly={isSystem}
            />
          </div>

          <div>
            <Label htmlFor="acceptance-term-content">Conteúdo completo</Label>
            <Textarea
              id="acceptance-term-content"
              value={draft.content}
              onChange={(e) => update({ content: e.target.value })}
              placeholder="Texto exibido ao cliente..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.isRequired}
                onCheckedChange={(checked) => update({ isRequired: checked === true })}
              />
              Obrigatório — o cliente precisa aceitar para continuar
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.showInForm}
                onCheckedChange={(checked) => update({ showInForm: checked === true })}
              />
              Exibir no formulário de contratação
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.showAtSigning}
                onCheckedChange={(checked) => update({ showAtSigning: checked === true })}
              />
              Exigir na assinatura do contrato (aceite legal)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.appearsInContract}
                onCheckedChange={(checked) =>
                  update({ appearsInContract: checked === true })
                }
              />
              Incluir no snapshot do contrato (bloco de consentimentos)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.active}
                disabled={isLocked}
                onCheckedChange={(checked) => update({ active: checked === true })}
              />
              Termo ativo
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={
              isPending || !draft.title.trim() || !draft.content.trim()
            }
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
