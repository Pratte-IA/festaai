import { useState } from "react";
import { Loader2, PlugZap, Plus, QrCode, RefreshCw, Smartphone, Trash2 } from "lucide-react";

import {
  SettingsPageHeader,
  SettingsStatChip,
} from "@/components/configuracoes/SettingsPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  qrImageSrc,
  useCreateWhatsappConnection,
  useDeleteWhatsappConnection,
  useRegenerateWhatsappConnectionQr,
  useWhatsappConnections,
  type WhatsappConnection,
  type WhatsappConnectionStatus,
} from "@/features/whatsapp-connections";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SETTINGS_PAGE_META } from "@/pages/configuracoes/settings-page-meta";

const statusLabels: Record<WhatsappConnectionStatus, string> = {
  connected: "Conectado",
  connecting: "Aguardando leitura do QR Code",
  disconnected: "Desconectado",
  error: "Erro na conexão",
};

const statusVariant: Record<WhatsappConnectionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  connected: "default",
  connecting: "secondary",
  disconnected: "outline",
  error: "destructive",
};

interface ConnectionCardProps {
  connection: WhatsappConnection;
  isFetching: boolean;
  onDelete: (connectionId: number) => Promise<void>;
  onRegenerateQr: (connectionId: number) => Promise<void>;
}

const ConnectionCard = ({
  connection,
  isFetching,
  onDelete,
  onRegenerateQr,
}: ConnectionCardProps) => {
  const qrSource = qrImageSrc(connection.qr_code);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{connection.name}</CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">{connection.instance_name}</CardDescription>
          </div>
          <Badge variant={statusVariant[connection.status]}>{statusLabels[connection.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection.phone && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            Número conectado: <span className="font-medium text-foreground">{connection.phone}</span>
          </p>
        )}

        {connection.last_error && connection.status === "error" && (
          <p className="text-sm text-destructive">{connection.last_error}</p>
        )}

        {qrSource && connection.status === "connecting" && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="h-4 w-4" />
              Escaneie o QR Code no WhatsApp
            </p>
            <img
              src={qrSource}
              alt={`QR Code para conectar ${connection.name}`}
              className="mx-auto h-56 w-56 rounded-lg border border-border bg-white p-2"
            />
            <p className="text-center text-xs text-muted-foreground">
              WhatsApp → Aparelhos conectados → Conectar aparelho
            </p>
          </div>
        )}

        {isFetching && connection.status === "connecting" && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verificando status da conexão...
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {connection.status !== "connected" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void onRegenerateQr(connection.id)}
            >
              <RefreshCw className="h-4 w-4" />
              Regenerar QR Code
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => void onDelete(connection.id)}
          >
            <Trash2 className="h-4 w-4" />
            Excluir conexão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ConfiguracoesWhatsApp = () => {
  const [connectionName, setConnectionName] = useState("WhatsApp Principal");
  const { data: connections = [], error, isFetching, isLoading, refetch } = useWhatsappConnections();
  const createConnection = useCreateWhatsappConnection();
  const regenerateQr = useRegenerateWhatsappConnectionQr();
  const deleteConnection = useDeleteWhatsappConnection();

  const connectedCount = connections.filter((connection) => connection.status === "connected").length;
  const connectingCount = connections.filter((connection) => connection.status === "connecting").length;

  const novaConexaoButton = (className?: string) => (
    <Button
      type="button"
      onClick={() => void handleCreate()}
      disabled={createConnection.isPending}
      className={cn("shrink-0 gap-2", className)}
    >
      {createConnection.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Nova conexão
    </Button>
  );

  const handleCreate = async () => {
    const name = connectionName.trim();
    if (name.length < 2) {
      toast({
        title: "Nome inválido",
        description: "Informe um nome com pelo menos 2 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createConnection.mutateAsync(name);
      toast({
        title: "Conexão criada",
        description: "Escaneie o QR Code para conectar o WhatsApp.",
      });
    } catch (createError) {
      toast({
        title: "Não foi possível criar a conexão",
        description: createError instanceof Error ? createError.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateQr = async (connectionId: number) => {
    try {
      await regenerateQr.mutateAsync(connectionId);
      toast({
        title: "QR Code regenerado",
        description: "Escaneie o novo código no WhatsApp.",
      });
    } catch (regenerateError) {
      toast({
        title: "Não foi possível regenerar o QR Code",
        description: regenerateError instanceof Error ? regenerateError.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (connectionId: number) => {
    const connection = connections.find((item) => item.id === connectionId);
    const confirmed = window.confirm(
      `Excluir a conexão "${connection?.name ?? ""}"? A instância será removida da Evolution.`,
    );
    if (!confirmed) return;

    try {
      await deleteConnection.mutateAsync(connectionId);
      toast({
        title: "Conexão excluída",
        description: "A instância WhatsApp foi removida.",
      });
    } catch (deleteError) {
      toast({
        title: "Não foi possível excluir a conexão",
        description: deleteError instanceof Error ? deleteError.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <SettingsPageHeader
        title={SETTINGS_PAGE_META["integracoes/whatsapp"].title}
        description={SETTINGS_PAGE_META["integracoes/whatsapp"].description}
        renderAction={(className) => novaConexaoButton(className)}
        stats={
          !isLoading ? (
            <>
              <SettingsStatChip>
                {connectedCount}{" "}
                {connectedCount === 1 ? "conexão ativa" : "conexões ativas"}
              </SettingsStatChip>
              <SettingsStatChip>
                {connections.length}{" "}
                {connections.length === 1 ? "instância cadastrada" : "instâncias cadastradas"}
              </SettingsStatChip>
              {connectingCount > 0 && (
                <SettingsStatChip>
                  {connectingCount} aguardando QR Code
                </SettingsStatChip>
              )}
            </>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PlugZap className="h-5 w-5 text-primary" />
            Nova conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Crie uma instância Evolution para conectar um número WhatsApp da sua casa de festas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="connection-name" className="text-sm font-medium text-foreground">
              Nome da conexão
            </label>
            <Input
              id="connection-name"
              value={connectionName}
              onChange={(event) => setConnectionName(event.target.value)}
              placeholder="Ex.: WhatsApp Recepção"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            {novaConexaoButton("hidden sm:inline-flex")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conexões ativas</CardTitle>
          <CardDescription>
            {connectedCount} conectada(s) de {connections.length} no total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando conexões...
            </div>
          )}

          {!isLoading && error && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Não foi possível carregar as conexões."}
            </p>
          )}

          {!isLoading && !error && connections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma conexão cadastrada. Crie a primeira conexão acima.
            </p>
          )}

          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              isFetching={isFetching}
              onDelete={handleDelete}
              onRegenerateQr={handleRegenerateQr}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesWhatsApp;
