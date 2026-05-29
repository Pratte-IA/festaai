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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  paymentMethodTypeLabels,
  type PaymentMethodType,
  type TenantPaymentMethodInput,
} from "@/features/configuracoes";

interface PaymentMethodEditorDialogProps {
  draft: TenantPaymentMethodInput;
  isEditing: boolean;
  isPending: boolean;
  onDraftChange: (draft: TenantPaymentMethodInput) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
}

export const PaymentMethodEditorDialog = ({
  draft,
  isEditing,
  isPending,
  onDraftChange,
  onOpenChange,
  onSave,
  open,
}: PaymentMethodEditorDialogProps) => {
  const update = (patch: Partial<TenantPaymentMethodInput>) =>
    onDraftChange({ ...draft, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar método de pagamento" : "Novo método de pagamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="payment-method-name">Nome</Label>
            <Input
              id="payment-method-name"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Ex: Pix à vista"
            />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select
              value={draft.paymentType}
              onValueChange={(value) => update({ paymentType: value as PaymentMethodType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(paymentMethodTypeLabels) as PaymentMethodType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {paymentMethodTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="payment-method-fee-percentage">Taxa percentual (%)</Label>
              <Input
                id="payment-method-fee-percentage"
                min="0"
                step="0.01"
                type="number"
                value={draft.feePercentage ?? ""}
                onChange={(e) =>
                  update({
                    feePercentage: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="payment-method-fee-fixed">Taxa fixa (R$)</Label>
              <Input
                id="payment-method-fee-fixed"
                min="0"
                step="0.01"
                type="number"
                value={draft.feeFixed ?? ""}
                onChange={(e) =>
                  update({
                    feeFixed: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={draft.allowsInstallments}
              onCheckedChange={(checked) =>
                update({
                  allowsInstallments: checked === true,
                  maxInstallments: checked === true ? draft.maxInstallments ?? 1 : null,
                })
              }
            />
            Permite parcelamento
          </label>

          {draft.allowsInstallments && (
            <div>
              <Label htmlFor="payment-method-max-installments">Máximo de parcelas</Label>
              <Input
                id="payment-method-max-installments"
                min="1"
                type="number"
                value={draft.maxInstallments ?? ""}
                onChange={(e) =>
                  update({
                    maxInstallments: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.allowedForDeposit}
                onCheckedChange={(checked) =>
                  update({ allowedForDeposit: checked === true })
                }
              />
              Permitido para entrada/sinal
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.allowedForRemainingBalance}
                onCheckedChange={(checked) =>
                  update({ allowedForRemainingBalance: checked === true })
                }
              />
              Permitido para saldo restante
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.active}
                onCheckedChange={(checked) => update({ active: checked === true })}
              />
              Método ativo
            </label>
          </div>

          <div>
            <Label htmlFor="payment-method-notes">Observações</Label>
            <Textarea
              id="payment-method-notes"
              value={draft.notes ?? ""}
              onChange={(e) => update({ notes: e.target.value || null })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isPending || !draft.name.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
