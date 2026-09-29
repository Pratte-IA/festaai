import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

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
import { slugifyUnitName, useCreateFilial, useCurrentTenant } from "@/features/tenants";
import { GUIDED_SETUP_ROUTE } from "@/features/guided-setup/guided-setup-steps";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-message";

interface CreateFilialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateFilialDialog = ({ open, onOpenChange }: CreateFilialDialogProps) => {
  const navigate = useNavigate();
  const { currentTenantId, setCurrentUnitId } = useCurrentTenant();
  const createFilial = useCreateFilial(currentTenantId);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const reset = () => {
    setName("");
    setSlug("");
    setSlugEdited(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextSlug = slugifyUnitName(slug || name);

    if (name.trim().length < 2 || nextSlug.length < 2) {
      toast({
        description: "Informe o nome da filial. O identificador precisa ter ao menos 2 caracteres.",
        title: "Filial incompleta",
        variant: "destructive",
      });
      return;
    }

    try {
      const unit = await createFilial.mutateAsync({ name: name.trim(), slug: nextSlug });
      setCurrentUnitId(unit.id);
      onOpenChange(false);
      reset();
      toast({ description: "Preencha o cadastro desta casa na configuração inicial.", title: "Filial criada" });
      navigate(GUIDED_SETUP_ROUTE);
    } catch (error) {
      toast({
        description: getErrorMessage(error, "Não foi possível criar a filial."),
        title: "Erro ao criar filial",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar filial</DialogTitle>
          <DialogDescription>
            A filial usa o mesmo login da matriz. O cadastro, a agenda, o financeiro, os pacotes e o WhatsApp
            ficam só desta casa.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="filial-name">Nome da filial</Label>
            <Input
              id="filial-name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugEdited) setSlug(slugifyUnitName(nextName));
              }}
              placeholder="Casa Zona Sul"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filial-slug">Identificador</Label>
            <Input
              id="filial-slug"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugifyUnitName(event.target.value));
              }}
              placeholder="casa-zona-sul"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createFilial.isPending}>
              {createFilial.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Criar filial
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
