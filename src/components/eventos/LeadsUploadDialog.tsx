import { ChangeEvent, DragEvent, useId, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FunnelType,
  getDefaultStageForFunnel,
  MAX_LEAD_UPLOAD_ROWS,
  parseLeadImportCsv,
  useBulkCreateEventos,
  downloadLeadImportCsvTemplate,
  getLeadImportCsvFilename,
  getLeadImportFunnelLabel,
  getLeadImportStageLabel,
} from "@/features/eventos";
import { toast } from "@/hooks/use-toast";

interface LeadsUploadDialogProps {
  initialFunnel?: FunnelType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export const LeadsUploadDialog = ({
  initialFunnel = "vendas",
  onOpenChange,
  open,
}: LeadsUploadDialogProps) => {
  const bulkCreate = useBulkCreateEventos();
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerId = useId();
  const [csvRawText, setCsvRawText] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const defaultStage = getDefaultStageForFunnel(initialFunnel);
  const funnelLabel = getLeadImportFunnelLabel(initialFunnel);
  const stageLabel = getLeadImportStageLabel(initialFunnel, defaultStage);
  const templateFilename = getLeadImportCsvFilename(initialFunnel);

  const parseResult = useMemo(
    () => (csvRawText ? parseLeadImportCsv(csvRawText) : null),
    [csvRawText],
  );

  const resetFileInput = () => {
    const inputEl = inputRef.current;
    if (inputEl) inputEl.value = "";
    setCsvRawText(null);
    setFileLabel(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetFileInput();
    }
    onOpenChange(nextOpen);
  };

  const consumeFileIfCsv = (file: File | undefined) => {
    if (!file) return false;
    const lower = file.name.toLowerCase();
    const mime = file.type.toLowerCase();
    const looksCsv =
      lower.endsWith(".csv") ||
      mime === "text/csv" ||
      mime === "application/vnd.ms-excel" ||
      mime === "text/plain";
    if (!looksCsv) {
      toast({
        title: "Formato nao aceito",
        description: "Use um arquivo CSV (extensao .csv).",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const processFileSelection = (file: File | undefined) => {
    if (!consumeFileIfCsv(file) || !file) {
      resetFileInput();
      return;
    }

    void file.text().then((text) => {
      setFileLabel(file.name);
      setCsvRawText(text);
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetFileInput();
      return;
    }

    processFileSelection(file);
  };

  const handleDragOverZone = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDropZone = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    processFileSelection(event.dataTransfer.files?.[0]);
  };

  const handleImport = async () => {
    if (!parseResult?.rows.length) return;
    try {
      const { insertedCount } = await bulkCreate.mutateAsync(parseResult.rows);
      toast({
        title: "Importacao concluida",
        description:
          insertedCount === parseResult.rows.length
            ? `${insertedCount} registro(s) criado(s) com funil e etapa definidos no CSV.`
            : `${insertedCount} registro(s) salvos de ${parseResult.rows.length} previstos.`,
      });
      handleOpenChange(false);
    } catch {
      toast({
        title: "Falha na importacao",
        description:
          "Nao foi possivel salvar os dados. Confira permissões, limite da planilha e tente outra vez.",
        variant: "destructive",
      });
    }
  };

  const globalBlockingIssue = parseResult?.issues.find((i) => i.line === 0);
  const lineOnlyIssues = parseResult?.issues.filter((i) => i.line > 0) ?? [];
  const lineIssueCount = lineOnlyIssues.length;
  const previewLines = parseResult?.successes.slice(0, 8) ?? [];
  const hasFile = !!csvRawText && !!fileLabel;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] gap-4 overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-left">
          <DialogTitle>Importar eventos e leads (CSV)</DialogTitle>
          <DialogDescription>
            Modelo para o funil <span className="font-medium text-foreground">{funnelLabel}</span> (
            etapa padrao: <span className="font-medium text-foreground">{stageLabel}</span>). Baixe e preencha o que
            tiver disponivel:{" "}
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => downloadLeadImportCsvTemplate(initialFunnel, defaultStage)}
            >
              {templateFilename}
            </button>
            . O cabecalho precisa incluir as colunas <span className="font-medium text-foreground">funil</span>,{" "}
            <span className="font-medium text-foreground">etapa</span> e o nome do cliente (nome ou equivalente).
            Demais colunas sao opcionais — telefone, e-mail, tipo de evento, dados da festa, valores e observacoes.
            Celula etapa em branco usa a primeira etapa daquele funil. Datas: DD/MM/AAAA ou AAAA-MM-DD. Ate{" "}
            {MAX_LEAD_UPLOAD_ROWS} linhas validas por arquivo.
          </DialogDescription>
        </DialogHeader>

        <input
          id={pickerId}
          accept=".csv,text/csv,text/plain"
          aria-label="Escolher arquivo CSV de leads"
          className="sr-only"
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
        />

        <label
          htmlFor={pickerId}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition hover:bg-muted/50"
          onDragOver={handleDragOverZone}
          onDrop={handleDropZone}
        >
          <Upload className="h-5 w-5 shrink-0 text-primary" />
          <span>
            {!hasFile ? (
              <>Arraste o CSV ate aqui ou clique para selecionar (.csv).</>
            ) : (
              <span className="font-medium text-foreground">{fileLabel}</span>
            )}
          </span>
        </label>

        {parseResult && parseResult.rows.length === 0 && (
          <>
            {globalBlockingIssue && (
              <Alert variant="destructive">
                <AlertTitle>Revise o arquivo</AlertTitle>
                <AlertDescription>{globalBlockingIssue.message}</AlertDescription>
              </Alert>
            )}
            {lineIssueCount > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Linhas ignoradas ({lineIssueCount}) — exemplos:
                </p>
                <ScrollArea className="max-h-36 rounded-md border border-border/60">
                  <ul className="space-y-1 p-3 text-xs text-muted-foreground">
                    {lineOnlyIssues.slice(0, 12).map((issue) => (
                      <li key={`${issue.line}-${issue.message}`}>
                        Linha {issue.line}: {issue.message}
                      </li>
                    ))}
                    {lineIssueCount > 12 && (
                      <li className="text-muted-foreground/80">
                        Mais {lineIssueCount - 12} aviso(s) nao mostrados.
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </>
        )}

        {parseResult && parseResult.rows.length > 0 && (
          <>
            <Alert className="border-primary/40 bg-primary/5">
              <AlertTitle>{parseResult.rows.length} linha(s) prontas</AlertTitle>
              <AlertDescription>
                Funil e etapa vim do CSV (ou primeira etapa se etapa da linha estiver em branco). Linhas com erro sao
                ignoradas.{" "}
                {lineIssueCount > 0
                  ? `${lineIssueCount} problema(s) em linhas especificas.`
                  : "Sem avisos adicionais."}
              </AlertDescription>
            </Alert>

            {lineIssueCount > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Linhas ignoradas ou com erro:</p>
                <ScrollArea className="max-h-28 rounded-md border border-border/60">
                  <ul className="space-y-1 p-3 text-xs text-muted-foreground">
                    {lineOnlyIssues.map((issue) => (
                      <li key={`${issue.line}-${issue.message}`}>
                        Linha {issue.line}: {issue.message}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {previewLines.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Pre-visualizacao das primeiras linhas:</p>
                <ScrollArea className="max-h-44 rounded-md border border-border/60">
                  <ul className="divide-y divide-border/40 p-0 text-xs">
                    {previewLines.map((s) => (
                      <li key={s.line} className="truncate px-3 py-2 text-foreground">
                        <span className="text-muted-foreground">Linha {s.line} • </span>
                        {s.row.funil}/{s.row.etapa} • {s.row.cliente_nome}
                        {s.row.cliente_telefone ? ` • ${s.row.cliente_telefone}` : ""}
                        {s.row.data_evento ? ` • ${s.row.data_evento}` : ""}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => resetFileInput()} disabled={!hasFile}>
              Limpar arquivo
            </Button>
            <Button type="button" onClick={() => void handleImport()} disabled={bulkCreate.isPending || !parseResult?.rows.length}>
              {bulkCreate.isPending ? "Importando..." : `Importar ${parseResult?.rows.length ?? 0}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
