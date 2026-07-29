import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { RadarPriorityBadge } from "@/components/admin/radar/RadarPriorityBadge";
import { RadarStatusBadge } from "@/components/admin/radar/RadarStatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  CRM_PRIORITIES,
  CRM_PRIORITY_LABELS,
  CRM_STATUSES,
  CRM_STATUS_LABELS,
  buildWhatsappUrl,
  formatPhoneDisplay,
  type CrmPriority,
  type CrmStatus,
  type RadarCompanyListItem,
} from "@/features/radar-crm";
import { toast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/date";
import { cn } from "@/lib/utils";

interface RadarCompanyTableProps {
  companies: RadarCompanyListItem[];
  isUpdating?: boolean;
  onOpenDetail: (companyId: number) => void;
  allowCrmEdit?: boolean;
  onPriorityChange?: (companyId: number, priority: CrmPriority) => void;
  onStatusChange?: (companyId: number, status: CrmStatus, lostReason?: string) => void;
}

const DigitalPresenceIcons = ({ company }: { company: RadarCompanyListItem }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {company.has_instagram && company.instagram_url ? (
      <a
        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
        href={company.instagram_url}
        onClick={(event) => event.stopPropagation()}
        rel="noreferrer"
        target="_blank"
      >
        <Instagram className="h-3.5 w-3.5" />
      </a>
    ) : null}
    {company.has_website && company.website ? (
      <a
        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
        href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
        onClick={(event) => event.stopPropagation()}
        rel="noreferrer"
        target="_blank"
      >
        <Globe className="h-3.5 w-3.5" />
      </a>
    ) : null}
    {company.google_maps_url ? (
      <a
        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
        href={company.google_maps_url}
        onClick={(event) => event.stopPropagation()}
        rel="noreferrer"
        target="_blank"
      >
        <MapPin className="h-3.5 w-3.5" />
      </a>
    ) : null}
    {!company.has_instagram && !company.has_website && !company.google_maps_url ? (
      <span className="text-xs text-muted-foreground">—</span>
    ) : null}
  </div>
);

const ContactCell = ({ company }: { company: RadarCompanyListItem }) => {
  const [copied, setCopied] = useState(false);
  const phone = company.whatsapp ?? company.phone ?? company.phone_unformatted;
  const whatsappUrl = buildWhatsappUrl(phone);

  const handleCopy = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      toast({ title: "Telefone copiado" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  if (!phone) {
    return <span className="text-xs text-muted-foreground">Sem telefone</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs">{formatPhoneDisplay(phone)}</span>
      {whatsappUrl ? (
        <Button asChild className="h-7 w-7" size="icon" variant="ghost">
          <a href={whatsappUrl} onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
          </a>
        </Button>
      ) : (
        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <Button className="h-7 w-7" onClick={() => void handleCopy()} size="icon" type="button" variant="ghost">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
};

const DecisionMakerCell = ({ company }: { company: RadarCompanyListItem }) => {
  const dm = company.primary_decision_maker;
  const extraAdmins = Math.max(0, company.administrators_count - (dm?.is_administrator ? 1 : 0));

  if (!dm && company.administrators_count === 0) {
    return <span className="text-xs text-muted-foreground">Não identificado</span>;
  }

  return (
    <div className="text-xs">
      {dm ? <p className="font-medium">{dm.name}</p> : null}
      {extraAdmins > 0 || (company.administrators_count > 0 && !dm) ? (
        <p className="text-muted-foreground">
          {dm ? `+${extraAdmins} admin${extraAdmins !== 1 ? "s" : ""}` : `${company.administrators_count} admin${company.administrators_count !== 1 ? "s" : ""}`}
        </p>
      ) : null}
    </div>
  );
};

const NextActionCell = ({ company }: { company: RadarCompanyListItem }) => {
  if (!company.next_action_at && !company.next_action_description) {
    return <span className="text-xs text-muted-foreground">Sem agendamento</span>;
  }

  return (
    <div className="space-y-0.5">
      {company.next_action_at ? (
        <p
          className={cn(
            "text-xs font-medium",
            company.next_action_overdue ? "text-destructive" : "text-foreground",
          )}
        >
          {company.next_action_overdue ? (
            <span className="mr-1 inline-flex items-center gap-0.5">
              <AlertTriangle className="h-3 w-3" />
              Atrasada
            </span>
          ) : null}
          {formatDateBR(company.next_action_at)}
        </p>
      ) : null}
      {company.next_action_description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{company.next_action_description}</p>
      ) : null}
    </div>
  );
};

export const RadarCompanyTable = ({
  companies,
  isUpdating,
  onOpenDetail,
  allowCrmEdit = false,
  onPriorityChange,
  onStatusChange,
}: RadarCompanyTableProps) => {
  const [pendingStatus, setPendingStatus] = useState<{ companyId: number; status: CrmStatus } | null>(null);
  const [lostReason, setLostReason] = useState("");

  const handleStatusSelect = (companyId: number, currentStatus: CrmStatus, nextStatus: CrmStatus) => {
    if (!onStatusChange || nextStatus === currentStatus) return;

    if (nextStatus === "lost") {
      setPendingStatus({ companyId, status: nextStatus });
      setLostReason("");
      return;
    }

    onStatusChange(companyId, nextStatus);
  };

  const confirmLost = () => {
    if (!pendingStatus || !onStatusChange) return;
    const reason = lostReason.trim() || window.prompt("Informe o motivo da perda:")?.trim();
    if (!reason) {
      toast({ title: "Motivo obrigatório para status Perdido", variant: "destructive" });
      return;
    }
    onStatusChange(pendingStatus.companyId, pendingStatus.status, reason);
    setPendingStatus(null);
    setLostReason("");
  };

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Nenhuma empresa encontrada com os filtros atuais.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border lg:block">
        <div className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr_0.9fr_0.8fr_0.7fr_1fr_0.6fr] gap-3 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Empresa</span>
          <span>Localização</span>
          <span>Contato</span>
          <span>Presença digital</span>
          <span>Decisor</span>
          <span>Status</span>
          <span>Prioridade</span>
          <span>Próxima ação</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y">
          {companies.map((company) => (
            <article
              className={cn(
                "grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr_0.9fr_0.8fr_0.7fr_1fr_0.6fr] items-center gap-3 px-4 py-3 text-sm",
                company.do_not_contact && "opacity-60",
              )}
              key={company.id}
            >
              <div>
                <p className="font-semibold">{company.trade_name ?? company.name}</p>
                {company.category ? (
                  <p className="text-xs text-muted-foreground">{company.category}</p>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {[company.city, company.state].filter(Boolean).join(" / ") || "—"}
              </p>
              <ContactCell company={company} />
              <DigitalPresenceIcons company={company} />
              <DecisionMakerCell company={company} />
              {allowCrmEdit ? (
                <select
                  aria-label="Alterar status"
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  disabled={isUpdating}
                  onChange={(event) =>
                    handleStatusSelect(company.id, company.status, event.target.value as CrmStatus)
                  }
                  value={company.status}
                >
                  {CRM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {CRM_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              ) : (
                <RadarStatusBadge status={company.status} />
              )}
              {allowCrmEdit ? (
                <select
                  aria-label="Alterar prioridade"
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  disabled={isUpdating}
                  onChange={(event) => onPriorityChange?.(company.id, event.target.value as CrmPriority)}
                  value={company.priority}
                >
                  {CRM_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {CRM_PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              ) : (
                <RadarPriorityBadge priority={company.priority} />
              )}
              <NextActionCell company={company} />
              <div className="text-right">
                <Button onClick={() => onOpenDetail(company.id)} size="sm" type="button" variant="outline">
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Ver
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {companies.map((company) => (
          <article
            className={cn(
              "rounded-2xl border bg-white/90 p-4 space-y-3",
              company.do_not_contact && "opacity-60",
            )}
            key={company.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{company.trade_name ?? company.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[company.city, company.state].filter(Boolean).join(" / ") || "Localização não informada"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <RadarStatusBadge status={company.status} />
                <RadarPriorityBadge priority={company.priority} />
              </div>
            </div>

            <ContactCell company={company} />
            <DigitalPresenceIcons company={company} />
            <DecisionMakerCell company={company} />
            <NextActionCell company={company} />

            {allowCrmEdit ? (
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Alterar status"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  disabled={isUpdating}
                  onChange={(event) =>
                    handleStatusSelect(company.id, company.status, event.target.value as CrmStatus)
                  }
                  value={company.status}
                >
                  {CRM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {CRM_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Alterar prioridade"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  disabled={isUpdating}
                  onChange={(event) => onPriorityChange?.(company.id, event.target.value as CrmPriority)}
                  value={company.priority}
                >
                  {CRM_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {CRM_PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <Button className="w-full" onClick={() => onOpenDetail(company.id)} size="sm" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir detalhes
            </Button>
          </article>
        ))}
      </div>

      {allowCrmEdit ? (
        <AlertDialog onOpenChange={(open) => !open && setPendingStatus(null)} open={pendingStatus !== null}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
              <AlertDialogDescription>
                Informe o motivo da perda para registrar no histórico comercial.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(event) => setLostReason(event.target.value)}
              placeholder="Ex.: Não tem interesse no momento"
              value={lostReason}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLost}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
};
