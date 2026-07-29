import { useState } from "react";
import { Loader2, PlugZap, Plus, QrCode, RefreshCw, Smartphone, Trash2 } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  qrImageSrc,
  useCreatePlatformWhatsappConnection,
  useDeletePlatformWhatsappConnection,
  usePlatformWhatsappConnections,
  useRegeneratePlatformWhatsappQr,
  useSwitchPlatformWhatsappNumber,
  type PlatformWhatsappConnection,
  type WhatsappConnectionStatus,
} from "@/features/platform-whatsapp";
import { toast } from "@/hooks/use-toast";

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
  connection: PlatformWhatsappConnection;
  isFetching: boolean;
  isSwitchingNumber: boolean;
  onDelete: (connectionId: number) => Promise<void>;
  onRegenerateQr: (connectionId: number) => Promise<void>;
  onSwitchNumber: (connectionId: number) => Promise<void>;
}

const ConnectionCard = ({
  connection,
  isFetching,
  isSwitchingNumber,
  onDelete,
  onRegenerateQr,
  onSwitchNumber,
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
        {connection.phone ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            Número conectado: <span className="font-medium text-foreground">{connection.phone}</span>
          </p>
        ) : null}

        {connection.last_error && connection.status === "error" ? (
          <p className="text-sm text-destructive">{connection.last_error}</p>
        ) : null}

        {qrSource && connection.status === "connecting" ? (
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="h-4 w-4" />
              Escaneie o QR Code no WhatsApp
            </p>
            <img
              alt={`QR Code para conectar ${connection.name}`}
              className="mx-auto h-56 w-56 rounded-lg border border-border bg-white p-2"
              src={qrSource}
            />
            <p className="text-center text-xs text-muted-foreground">
              WhatsApp → Aparelhos conectados → Conectar aparelho
            </p>
          </div>
        ) : null}

        {isFetching && connection.status === "connecting" ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verificando status da conexão...
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {connection.status === "connected" ? (
            <Button
              className="gap-2"
              disabled={isSwitchingNumber}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void onSwitchNumber(connection.id)}
            >
              {isSwitchingNumber ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              Trocar número
            </Button>
          ) : null}
          {connection.status !== "connected" ? (
            <Button
              className="gap-2"
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void onRegenerateQr(connection.id)}
            >
              <RefreshCw className="h-4 w-4" />
              Regenerar QR Code
            </Button>
          ) : null}
          <Button
            className="gap-2"
            size="sm"
            type="button"
            variant="destructive"
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

const AdminConexoes = () => {
  const [connectionName, setConnectionName] = useState("WhatsApp FestaAI");
  const [switchingConnectionId, setSwitchingConnectionId] = useState<number | null>(null);
  const { data: connections = [], error, isFetching, isLoading, refetch } = usePlatformWhatsappConnections();
  const createConnection = useCreatePlatformWhatsappConnection();
  const regenerateQr = useRegeneratePlatformWhatsappQr();
  const switchNumber = useSwitchPlatformWhatsappNumber();
  const deleteConnection = useDeletePlatformWhatsappConnection();

  const hasConnection = connections.length > 0;
  const connectedCount = connections.filter((connection) => connection.status === "connected").length;

  const handleCreate = async () => {
    const name = connectionName.trim();
    if (name.length < 2) {
      toast({
        description: "Informe um nome com pelo menos 2 caracteres.",
        title: "Nome inválido",
        variant: "destructive",
      });
      return;
    }

    try {
      await createConnection.mutateAsync(name);
      toast({
        description: "Escaneie o QR Code para conectar o WhatsApp da plataforma.",
        title: "Conexão criada",
      });
    } catch (createError) {
      toast({
        description: createError instanceof Error ? createError.message : "Tente novamente.",
        title: "Não foi possível criar a conexão",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateQr = async (connectionId: number) => {
    try {
      await regenerateQr.mutateAsync(connectionId);
      toast({
        description: "Escaneie o novo código no WhatsApp.",
        title: "QR Code regenerado",
      });
    } catch (regenerateError) {
      toast({
        description: regenerateError instanceof Error ? regenerateError.message : "Tente novamente.",
        title: "Não foi possível regenerar o QR Code",
        variant: "destructive",
      });
    }
  };

  const handleSwitchNumber = async (connectionId: number) => {
    const connection = connections.find((item) => item.id === connectionId);
    const confirmed = window.confirm(
      `Trocar o número da conexão "${connection?.name ?? ""}"?\n\n` +
        "O WhatsApp atual será desconectado. Em seguida, escaneie o QR Code com o novo celular.",
    );
    if (!confirmed) return;

    setSwitchingConnectionId(connectionId);
    try {
      await switchNumber.mutateAsync(connectionId);
      toast({
        description: "Escaneie o QR Code com o novo celular.",
        title: "Pronto para trocar o número",
      });
    } catch (switchError) {
      toast({
        description: switchError instanceof Error ? switchError.message : "Tente novamente.",
        title: "Não foi possível trocar o número",
        variant: "destructive",
      });
    } finally {
      setSwitchingConnectionId(null);
    }
  };

  const handleDelete = async (connectionId: number) => {
    const connection = connections.find((item) => item.id === connectionId);
    const confirmed = window.confirm(
      `Excluir a conexão "${connection?.name ?? ""}"? A instância será removida da Evolution e as conversas do funil serão apagadas.`,
    );
    if (!confirmed) return;

    try {
      await deleteConnection.mutateAsync(connectionId);
      toast({
        description: "A instância WhatsApp da plataforma foi removida.",
        title: "Conexão excluída",
      });
    } catch (deleteError) {
      toast({
        description: deleteError instanceof Error ? deleteError.message : "Tente novamente.",
        title: "Não foi possível excluir a conexão",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminPageShell
      description="Conecte o número WhatsApp oficial do FestaAI para receber e gerenciar conversas no funil."
      title="Conexões"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {!hasConnection ? (
          <Card className="rounded-2xl border-white/80 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PlugZap className="h-5 w-5 text-primary" />
                Conectar WhatsApp FestaAI
              </CardTitle>
              <CardDescription>
                Crie a conexão da plataforma (uma por vez) e escaneie o QR Code com o celular do FestaAI.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="platform-connection-name">
                  Nome da conexão
                </label>
                <Input
                  id="platform-connection-name"
                  placeholder="Ex.: WhatsApp FestaAI"
                  value={connectionName}
                  onChange={(event) => setConnectionName(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button disabled={isFetching} type="button" variant="outline" onClick={() => void refetch()}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
                <Button
                  className="gap-2"
                  disabled={createConnection.isPending}
                  type="button"
                  onClick={() => void handleCreate()}
                >
                  {createConnection.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Criar conexão
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button disabled={isFetching} type="button" variant="outline" onClick={() => void refetch()}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar status
            </Button>
          </div>
        )}

        <Card className="rounded-2xl border-white/80 bg-white/90">
          <CardHeader>
            <CardTitle className="text-lg">Conexão da plataforma</CardTitle>
            <CardDescription>
              {isLoading
                ? "Carregando..."
                : `${connectedCount} conectada(s) de ${connections.length} no total`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando conexões...
              </div>
            ) : null}

            {!isLoading && error ? (
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : "Não foi possível carregar as conexões."}
              </p>
            ) : null}

            {!isLoading && !error && connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma conexão cadastrada. Crie a conexão do FestaAI acima.
              </p>
            ) : null}

            {connections.map((connection) => (
              <ConnectionCard
                connection={connection}
                isFetching={isFetching}
                isSwitchingNumber={switchingConnectionId === connection.id}
                key={connection.id}
                onDelete={handleDelete}
                onRegenerateQr={handleRegenerateQr}
                onSwitchNumber={handleSwitchNumber}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
};

export default AdminConexoes;
