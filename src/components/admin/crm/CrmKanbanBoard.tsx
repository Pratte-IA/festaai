import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  GripVertical,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { RadarPriorityBadge } from "@/components/admin/radar/RadarPriorityBadge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEnsurePlatformWhatsappConversation } from "@/features/platform-whatsapp";
import {
  CRM_KANBAN_STATUSES,
  CRM_STATUS_LABELS,
  INTERACTION_TYPE_LABELS,
  LOST_REASONS,
  buildWhatsappUrl,
  formatPhoneDisplay,
  type CrmStatus,
  type RadarCompanyListItem,
} from "@/features/radar-crm";
import { toast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface CrmStatusChangeExtras {
  lostReason?: string;
  nextActionAt?: string;
  nextActionDescription?: string;
}

interface CrmKanbanBoardProps {
  companies: RadarCompanyListItem[];
  counts?: Partial<Record<CrmStatus, number>>;
  isUpdating?: boolean;
  onOpenDetail: (companyId: number) => void;
  onStatusChange: (
    companyId: number,
    status: CrmStatus,
    extras?: CrmStatusChangeExtras,
  ) => Promise<void> | void;
}

interface PendingLost {
  companyId: number;
  previousStatus: CrmStatus;
}

interface PendingDemo {
  companyId: number;
  previousStatus: CrmStatus;
}

const buildLostReasonPayload = (reasonValue: string, note: string): string => {
  const reason = LOST_REASONS.find((item) => item.value === reasonValue);
  const label = reason?.label ?? reasonValue;
  const trimmedNote = note.trim();
  return trimmedNote ? `${label}: ${trimmedNote}` : label;
};

export const CrmKanbanBoard = ({
  companies,
  counts,
  isUpdating,
  onOpenDetail,
  onStatusChange,
}: CrmKanbanBoardProps) => {
  const navigate = useNavigate();
  const ensureConversation = useEnsurePlatformWhatsappConversation();
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [pendingLost, setPendingLost] = useState<PendingLost | null>(null);
  const [pendingDemo, setPendingDemo] = useState<PendingDemo | null>(null);
  const [lostReasonValue, setLostReasonValue] = useState("");
  const [lostReasonNote, setLostReasonNote] = useState("");
  const [demoNextActionAt, setDemoNextActionAt] = useState("");
  const [demoNextActionDescription, setDemoNextActionDescription] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [openingWhatsappId, setOpeningWhatsappId] = useState<number | null>(null);

  useEffect(() => {
    setLocalCompanies(companies);
  }, [companies]);

  const handleDragStart = (companyId: number) => {
    setDraggedId(companyId);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const applyOptimisticStatus = (companyId: number, status: CrmStatus, previousStatus: CrmStatus) => {
    setLocalCompanies((current) =>
      current.map((company) => (company.id === companyId ? { ...company, status } : company)),
    );

    void Promise.resolve(onStatusChange(companyId, status)).catch(() => {
      setLocalCompanies((current) =>
        current.map((company) =>
          company.id === companyId ? { ...company, status: previousStatus } : company,
        ),
      );
    });
  };

  const handleDrop = (stageStatus: CrmStatus) => {
    if (draggedId == null) return;

    const draggedCompany = localCompanies.find((company) => company.id === draggedId);
    setDraggedId(null);

    if (!draggedCompany || draggedCompany.status === stageStatus) return;

    if (stageStatus === "lost") {
      setPendingLost({ companyId: draggedCompany.id, previousStatus: draggedCompany.status });
      setLostReasonValue("");
      setLostReasonNote("");
      return;
    }

    if (stageStatus === "demo_scheduled") {
      setPendingDemo({ companyId: draggedCompany.id, previousStatus: draggedCompany.status });
      setDemoNextActionAt("");
      setDemoNextActionDescription("");
      return;
    }

    applyOptimisticStatus(draggedCompany.id, stageStatus, draggedCompany.status);
  };

  const confirmLost = () => {
    if (!pendingLost) return;
    if (!lostReasonValue) {
      toast({ title: "Selecione o motivo da perda", variant: "destructive" });
      return;
    }

    const { companyId, previousStatus } = pendingLost;
    const lostReason = buildLostReasonPayload(lostReasonValue, lostReasonNote);

    setLocalCompanies((current) =>
      current.map((company) =>
        company.id === companyId ? { ...company, status: "lost" as CrmStatus } : company,
      ),
    );
    setPendingLost(null);
    setLostReasonValue("");
    setLostReasonNote("");

    void Promise.resolve(onStatusChange(companyId, "lost", { lostReason })).catch(() => {
      setLocalCompanies((current) =>
        current.map((company) =>
          company.id === companyId ? { ...company, status: previousStatus } : company,
        ),
      );
    });
  };

  const confirmDemo = () => {
    if (!pendingDemo) return;
    if (!demoNextActionAt.trim()) {
      toast({ title: "Informe a data e hora da demonstração", variant: "destructive" });
      return;
    }

    const { companyId, previousStatus } = pendingDemo;
    const nextActionAt = new Date(demoNextActionAt).toISOString();
    const nextActionDescription = demoNextActionDescription.trim() || undefined;

    setLocalCompanies((current) =>
      current.map((company) =>
        company.id === companyId
          ? {
              ...company,
              status: "demo_scheduled" as CrmStatus,
              next_action_at: nextActionAt,
              next_action_description: nextActionDescription ?? company.next_action_description,
            }
          : company,
      ),
    );
    setPendingDemo(null);
    setDemoNextActionAt("");
    setDemoNextActionDescription("");

    void Promise.resolve(
      onStatusChange(companyId, "demo_scheduled", { nextActionAt, nextActionDescription }),
    ).catch(() => {
      setLocalCompanies((current) =>
        current.map((company) =>
          company.id === companyId ? { ...company, status: previousStatus } : company,
        ),
      );
    });
  };

  const cancelLost = () => {
    setPendingLost(null);
    setLostReasonValue("");
    setLostReasonNote("");
  };

  const cancelDemo = () => {
    setPendingDemo(null);
    setDemoNextActionAt("");
    setDemoNextActionDescription("");
  };

  const handleCopyPhone = async (event: React.MouseEvent, companyId: number, phone: string) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(companyId);
      toast({ title: "Telefone copiado" });
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const handleOpenPlatformWhatsapp = async (
    event: React.MouseEvent,
    company: RadarCompanyListItem,
    phone: string,
  ) => {
    event.stopPropagation();
    setOpeningWhatsappId(company.id);
    try {
      const result = await ensureConversation.mutateAsync({
        customerName: company.trade_name ?? company.name,
        phone,
      });
      navigate("/admin/whatsapp", {
        state: result.isDraft
          ? {
              openDraft: result.draft
                ? { ...result.draft, radar_company_id: company.id }
                : null,
            }
          : {
              openConversation: result.conversation,
              radarCompanyId: company.id,
            },
      });
    } catch (error) {
      toast({
        title: "Não foi possível abrir no WhatsApp FestaAI",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setOpeningWhatsappId(null);
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {CRM_KANBAN_STATUSES.map((stageStatus) => {
          const stageCompanies = localCompanies.filter((company) => company.status === stageStatus);
          const columnCount = counts?.[stageStatus] ?? stageCompanies.length;

          return (
            <div
              className="w-80 flex-shrink-0"
              id={`crm-kanban-${stageStatus}`}
              key={stageStatus}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stageStatus)}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold">{CRM_STATUS_LABELS[stageStatus]}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {columnCount}
                </span>
              </div>

              <div className="min-h-[240px] space-y-2 rounded-xl border border-border/30 bg-muted/20 p-2">
                {stageCompanies.map((company) => {
                  const phone = company.whatsapp ?? company.phone ?? company.phone_unformatted;
                  const whatsappUrl = buildWhatsappUrl(phone);
                  const dm = company.primary_decision_maker;
                  const extraAdmins = Math.max(
                    0,
                    company.administrators_count - (dm?.is_administrator ? 1 : 0),
                  );

                  return (
                    <div
                      className={cn(
                        "cursor-grab rounded-xl border bg-white/90 p-3 shadow-sm transition-all active:cursor-grabbing hover:border-primary/30",
                        draggedId === company.id && "scale-95 opacity-50",
                        isUpdating && "pointer-events-none opacity-70",
                        company.do_not_contact && "opacity-60",
                      )}
                      draggable={!isUpdating}
                      key={company.id}
                      onClick={() => onOpenDetail(company.id)}
                      onDragStart={() => handleDragStart(company.id)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-bold">
                              {company.trade_name ?? company.name}
                            </p>
                            <RadarPriorityBadge className="flex-shrink-0 text-[10px]" priority={company.priority} />
                          </div>

                          {(company.city || company.state) && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {[company.city, company.state].filter(Boolean).join(" / ")}
                            </p>
                          )}

                          {company.category ? (
                            <p className="truncate text-xs text-muted-foreground">{company.category}</p>
                          ) : null}

                          {phone ? (
                            <div className="flex items-center gap-1">
                              <p className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground">
                                {whatsappUrl ? (
                                  <MessageCircle className="h-3 w-3 flex-shrink-0 text-emerald-600" />
                                ) : (
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                )}
                                <span className="truncate">{formatPhoneDisplay(phone)}</span>
                              </p>
                              <div className="flex flex-shrink-0 items-center">
                                {whatsappUrl ? (
                                  <Button
                                    className="h-6 w-6"
                                    disabled={openingWhatsappId === company.id}
                                    onClick={(event) =>
                                      void handleOpenPlatformWhatsapp(event, company, phone)
                                    }
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                  >
                                    {openingWhatsappId === company.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                                    ) : (
                                      <MessageCircle className="h-3 w-3 text-emerald-600" />
                                    )}
                                  </Button>
                                ) : null}
                                <Button
                                  className="h-6 w-6"
                                  onClick={(event) => void handleCopyPhone(event, company.id, phone)}
                                  size="icon"
                                  type="button"
                                  variant="ghost"
                                >
                                  {copiedId === company.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          {company.instagram_url ? (
                            <div className="flex items-center gap-1">
                              <p className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground">
                                <Instagram className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">Instagram</span>
                              </p>
                              <Button
                                asChild
                                className="h-6 w-6"
                                onClick={(event) => event.stopPropagation()}
                                size="icon"
                                variant="ghost"
                              >
                                <a href={company.instagram_url} rel="noreferrer" target="_blank">
                                  <Instagram className="h-3 w-3 text-primary" />
                                </a>
                              </Button>
                            </div>
                          ) : null}

                          {dm || company.administrators_count > 0 ? (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <UserRound className="h-3 w-3 flex-shrink-0" />
                              {dm ? dm.name : "Administrador"}
                              {extraAdmins > 0 ? (
                                <span className="text-muted-foreground/80">
                                  +{extraAdmins} admin{extraAdmins !== 1 ? "s" : ""}
                                </span>
                              ) : null}
                            </p>
                          ) : null}

                          {company.last_interaction ? (
                            <p className="text-xs text-muted-foreground">
                              Última: {INTERACTION_TYPE_LABELS[company.last_interaction.interaction_type]}{" "}
                              · {formatDateBR(company.last_interaction.interaction_at)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/70">Sem interação registrada</p>
                          )}

                          {(company.next_action_at || company.next_action_description) && (
                            <p
                              className={cn(
                                "text-xs",
                                company.next_action_overdue
                                  ? "font-medium text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              {company.next_action_overdue ? (
                                <span className="mr-1 inline-flex items-center gap-0.5">
                                  <AlertTriangle className="h-3 w-3" />
                                  Atrasada
                                </span>
                              ) : null}
                              {company.next_action_at ? formatDateBR(company.next_action_at) : null}
                              {company.next_action_description
                                ? ` · ${company.next_action_description}`
                                : null}
                            </p>
                          )}

                          {company.assigned_user_name || company.assigned_user_email ? (
                            <p className="text-xs text-muted-foreground">
                              Resp.: {company.assigned_user_name ?? company.assigned_user_email}
                            </p>
                          ) : null}

                          {company.crm_created_at ? (
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                              <Calendar className="h-3 w-3" />
                              CRM desde {formatDateBR(company.crm_created_at)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {stageCompanies.length === 0 && (
                  <div className="flex h-24 items-center justify-center text-xs text-muted-foreground/50">
                    Arraste aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog onOpenChange={(open) => !open && cancelLost()} open={pendingLost !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como perdido</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o motivo da perda antes de mover o card para Perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="crm-lost-reason">Motivo</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                id="crm-lost-reason"
                onChange={(event) => setLostReasonValue(event.target.value)}
                value={lostReasonValue}
              >
                <option value="">Selecione...</option>
                {LOST_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crm-lost-note">Observação (opcional)</Label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="crm-lost-note"
                onChange={(event) => setLostReasonNote(event.target.value)}
                placeholder="Detalhes adicionais sobre a perda"
                value={lostReasonNote}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLost}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLost}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={(open) => !open && cancelDemo()} open={pendingDemo !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agendar demonstração</AlertDialogTitle>
            <AlertDialogDescription>
              Informe quando será a demonstração e, se possível, uma descrição da próxima ação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="crm-demo-datetime">Data e hora da demonstração</Label>
              <Input
                id="crm-demo-datetime"
                onChange={(event) => setDemoNextActionAt(event.target.value)}
                type="datetime-local"
                value={demoNextActionAt}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crm-demo-description">Descrição da próxima ação</Label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="crm-demo-description"
                onChange={(event) => setDemoNextActionDescription(event.target.value)}
                placeholder="Ex.: Demo do sistema com o decisor"
                value={demoNextActionDescription}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDemo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDemo}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
