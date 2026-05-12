import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, History, Paperclip, Trash2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth";
import {
  SUPPORT_ERROR_MAX_FILES,
  submitSupportErrorReport,
  supportErrorReportsQueryKey,
  useTenantSupportErrorReports,
  validateSupportErrorFiles,
} from "@/features/support-error-reports";
import { useCurrentTenant } from "@/features/tenants";
import { toast } from "@/hooks/use-toast";

const erroReportSchema = z.object({
  description: z.string().trim().min(10, "Descreva com pelo menos 10 caracteres").max(8000),
  title: z.string().trim().min(3, "Informe um título (mínimo 3 caracteres)").max(200),
});

type ErroReportFormValues = z.infer<typeof erroReportSchema>;

interface AttachmentItem {
  file: File;
  id: string;
  previewUrl: string;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const SuporteErros = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { currentTenantId } = useCurrentTenant();
  const queryClient = useQueryClient();
  const { data: historico = [], error: historicoError, isLoading: historicoLoading } =
    useTenantSupportErrorReports();

  const form = useForm<ErroReportFormValues>({
    defaultValues: {
      description: "",
      title: "",
    },
    resolver: zodResolver(erroReportSchema),
  });

  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    };
  }, []);

  const addFilesFromList = (list: FileList | null) => {
    if (!list?.length) {
      return;
    }

    const incoming = Array.from(list);

    setAttachments((prev) => {
      const remaining = SUPPORT_ERROR_MAX_FILES - prev.length;

      if (remaining <= 0) {
        toast({
          title: "Limite de anexos",
          description: `Você pode enviar no máximo ${SUPPORT_ERROR_MAX_FILES} imagens por relatório.`,
        });
        return prev;
      }

      const next = [...prev];
      const slice = incoming.slice(0, remaining);

      for (const file of slice) {
        next.push({
          file,
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
        });
      }

      if (incoming.length > remaining) {
        toast({
          title: "Limite de anexos",
          description: `Alguns arquivos não foram adicionados (máximo ${SUPPORT_ERROR_MAX_FILES} por relatório).`,
        });
      }

      return next;
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const row = prev.find((x) => x.id === id);
      if (row) {
        URL.revokeObjectURL(row.previewUrl);
      }
      return prev.filter((x) => x.id !== id);
    });
  };

  const onSubmit = async (values: ErroReportFormValues) => {
    const files = attachments.map((a) => a.file);
    const fileError = validateSupportErrorFiles(files);
    if (fileError) {
      toast({
        title: "Anexos",
        description: fileError,
        variant: "destructive",
      });
      return;
    }

    if (!currentTenantId || !user?.id) {
      toast({
        title: "Sessão inválida",
        description: "Faça login novamente ou selecione uma empresa.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitSupportErrorReport({
        description: values.description,
        files,
        tenantId: currentTenantId,
        title: values.title,
        userId: user.id,
      });

      toast({
        title: "Relatório enviado",
        description: "Recebemos seu reporte e os prints. Nossa equipe vai analisar com prioridade.",
      });

      form.reset();
      setAttachments((prev) => {
        prev.forEach((a) => URL.revokeObjectURL(a.previewUrl));
        return [];
      });

      await queryClient.invalidateQueries({ queryKey: supportErrorReportsQueryKey(currentTenantId) });
    } catch (error) {
      toast({
        title: "Não foi possível enviar",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <Button asChild className="mb-4 gap-2" variant="ghost" size="sm">
          <Link to="/suporte">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao suporte
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Erros e incidentes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra um novo relatório com prints ou consulte o histórico enviado pela sua empresa. Tudo fica registrado no
          sistema FestaAI.
        </p>
      </div>

      <Tabs className="w-full" defaultValue="novo">
        <TabsList className="mb-4">
          <TabsTrigger value="novo">Novo erro</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0" value="novo">
          <Card className="glass-card max-w-3xl border-white/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Registrar problema
              </CardTitle>
              <CardDescription>
                Inclua contexto (o que você fazia, horário aproximado) e pelo menos uma imagem — até{" "}
                {SUPPORT_ERROR_MAX_FILES} arquivos, 5 MB cada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Erro ao salvar evento no CRM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-36"
                            placeholder="Passos para reproduzir, mensagem de erro exibida, navegador/dispositivo se souber..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormLabel className="text-foreground">Prints e capturas *</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Somente imagens (PNG, JPG, WebP, GIF). Você pode selecionar vários arquivos de uma vez.
                    </p>
                    <input
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      multiple
                      onChange={(event) => {
                        addFilesFromList(event.target.files);
                        event.target.value = "";
                      }}
                      ref={fileInputRef}
                      type="file"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="gap-2"
                        disabled={isSubmitting || attachments.length >= SUPPORT_ERROR_MAX_FILES}
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4" />
                        Adicionar imagens
                      </Button>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        {attachments.length}/{SUPPORT_ERROR_MAX_FILES} anexos
                      </span>
                    </div>

                    {attachments.length > 0 && (
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {attachments.map((item) => (
                          <li
                            className="flex gap-3 rounded-lg border border-white/30 bg-background/40 p-3"
                            key={item.id}
                          >
                            <img
                              alt={`Pré-visualização de ${item.file.name}`}
                              className="h-16 w-16 shrink-0 rounded-md object-cover"
                              src={item.previewUrl}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-foreground">{item.file.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {(item.file.size / 1024).toFixed(0)} KB
                              </p>
                              <Button
                                className="mt-2 h-8 gap-1 px-2 text-xs"
                                disabled={isSubmitting}
                                onClick={() => removeAttachment(item.id)}
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remover
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Button disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Enviando..." : "Enviar relatório"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-0" value="historico">
          {historicoError && (
            <div className="glass-card mb-6 border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível carregar o histórico de relatórios.
            </div>
          )}

          <Card className="glass-card border-white/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Relatórios enviados
              </CardTitle>
              <CardDescription>Últimos registros desta empresa, com quantidade de prints anexados.</CardDescription>
            </CardHeader>
            <CardContent>
              {historicoLoading && (
                <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
              )}

              {!historicoLoading && historico.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum relatório ainda. Use a aba “Novo erro” para enviar o primeiro.
                </p>
              )}

              {!historicoLoading && historico.length > 0 && (
                <div className="divide-y rounded-xl border">
                  {historico.map((row) => {
                    const anexos = row.support_error_report_files?.length ?? 0;
                    return (
                      <div className="px-4 py-4" key={row.id}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-foreground">{row.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {dateFormatter.format(new Date(row.created_at))}
                            </p>
                            <p className="line-clamp-3 text-sm text-muted-foreground">{row.description}</p>
                          </div>
                          <Badge className="shrink-0 border-warning/30 bg-warning/10 text-warning-foreground" variant="outline">
                            {anexos} {anexos === 1 ? "anexo" : "anexos"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default SuporteErros;
