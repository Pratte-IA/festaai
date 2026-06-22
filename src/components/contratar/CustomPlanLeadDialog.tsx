import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitCommercialLead } from "@/features/comercial";
import { toast } from "@/hooks/use-toast";
import { contratarCtaGradientClass } from "@/pages/contratar-commercial-data";

interface Props {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const emptyForm = {
  companyName: "",
  email: "",
  message: "",
  name: "",
  phone: "",
};

export const CustomPlanLeadDialog = ({ onOpenChange, open }: Props) => {
  const submitLead = useSubmitCommercialLead();
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSubmitted(false);
      setForm(emptyForm);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await submitLead.mutateAsync(form);
      setSubmitted(true);
      toast({
        title: "Solicitação enviada",
        description: "Nossa equipe comercial entrará em contato em breve.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível enviar",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#12121a] text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Plano sob medida</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Conte um pouco sobre sua operação. Nossa equipe entrará em contato para entender suas necessidades.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-zinc-300">
              Recebemos sua solicitação. Em breve nosso time comercial falará com você.
            </p>
            <Button
              className={`border-0 ${contratarCtaGradientClass}`}
              onClick={() => handleClose(false)}
              type="button"
            >
              Fechar
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="lead-nome">
                Nome completo
              </Label>
              <Input
                className="border-white/15 bg-[#07070c] text-white"
                id="lead-nome"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                value={form.name}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-200" htmlFor="lead-email">
                  E-mail
                </Label>
                <Input
                  className="border-white/15 bg-[#07070c] text-white"
                  id="lead-email"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  type="email"
                  value={form.email}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-200" htmlFor="lead-telefone">
                  Telefone
                </Label>
                <Input
                  className="border-white/15 bg-[#07070c] text-white"
                  id="lead-telefone"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  value={form.phone}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="lead-empresa">
                Nome da casa de festas
              </Label>
              <Input
                className="border-white/15 bg-[#07070c] text-white"
                id="lead-empresa"
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                value={form.companyName}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="lead-mensagem">
                Como podemos ajudar?
              </Label>
              <Textarea
                className="min-h-[100px] border-white/15 bg-[#07070c] text-white"
                id="lead-mensagem"
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Conte sobre sua operação ou o que você precisa..."
                value={form.message}
              />
            </div>
            <Button
              className={`w-full border-0 ${contratarCtaGradientClass}`}
              disabled={submitLead.isPending}
              type="submit"
            >
              {submitLead.isPending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
