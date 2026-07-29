import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  Globe,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  UserRound,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CRM_PRIORITIES,
  CRM_PRIORITY_LABELS,
  CRM_STATUSES,
  CRM_STATUS_LABELS,
  INTERACTION_TYPES,
  INTERACTION_TYPE_LABELS,
  buildWhatsappUrl,
  displayOrFallback,
  formatCnpjDisplay,
  formatPhoneDisplay,
  meiLabel,
  useAddRadarInteraction,
  useRadarCompanyDetail,
  useRadarFilterOptions,
  useUpsertRadarCrm,
  type CrmPriority,
  type CrmStatus,
  type InteractionType,
} from "@/features/radar-crm";
import { toast } from "@/hooks/use-toast";
import { formatDateBR, formatIsoDateBR, formatTimestampDateBR } from "@/lib/date";

interface RadarCompanyDetailSheetProps {
  companyId: number | null;
  onClose: () => void;
  open: boolean;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm">{value}</p>
  </div>
);

export const RadarCompanyDetailSheet = ({ companyId, onClose, open }: RadarCompanyDetailSheetProps) => {
  const { data, error, isLoading } = useRadarCompanyDetail(companyId);
  const { data: filterOptions } = useRadarFilterOptions();
  const upsertCrm = useUpsertRadarCrm();
  const addInteraction = useAddRadarInteraction();

  const [status, setStatus] = useState<CrmStatus>("new");
  const [priority, setPriority] = useState<CrmPriority>("medium");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [nextActionDescription, setNextActionDescription] = useState("");
  const [doNotContact, setDoNotContact] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const [interactionType, setInteractionType] = useState<InteractionType>("whatsapp");
  const [interactionNotes, setInteractionNotes] = useState("");
  const [interactionOutcome, setInteractionOutcome] = useState("");
  const [interactionAt, setInteractionAt] = useState("");

  const [confirmDoNotContact, setConfirmDoNotContact] = useState(false);
  const [confirmLost, setConfirmLost] = useState(false);

  useEffect(() => {
    if (!data?.crm) return;
    setStatus(data.crm.status);
    setPriority(data.crm.priority);
    setAssignedUserId(data.crm.assigned_user_id ?? "");
    setNextActionAt(data.crm.next_action_at?.slice(0, 10) ?? "");
    setNextActionDescription(data.crm.next_action_description ?? "");
    setDoNotContact(data.crm.do_not_contact);
    setLostReason(data.crm.lost_reason ?? "");
  }, [data]);

  const company = data?.company;
  const phone = company?.whatsapp ?? company?.phone ?? company?.phone_unformatted ?? null;
  const whatsappUrl = buildWhatsappUrl(phone);

  const handleSaveCrm = async () => {
    if (companyId == null) return;

    if (status === "lost" && !lostReason.trim()) {
      setConfirmLost(true);
      return;
    }

    if (doNotContact && !data?.crm?.do_not_contact) {
      setConfirmDoNotContact(true);
      return;
    }

    try {
      await upsertCrm.mutateAsync({
        companyId,
        status,
        priority,
        assignedUserId: assignedUserId || null,
        clearAssignedUser: !assignedUserId,
        nextActionAt: nextActionAt || null,
        clearNextAction: !nextActionAt && !nextActionDescription,
        nextActionDescription: nextActionDescription || null,
        lostReason: status === "lost" ? lostReason.trim() : null,
        doNotContact,
      });
      toast({ title: "CRM atualizado" });
    } catch {
      toast({ title: "Erro ao salvar CRM", variant: "destructive" });
    }
  };

  const handleConfirmSave = async () => {
    setConfirmDoNotContact(false);
    setConfirmLost(false);
    if (companyId == null) return;

    try {
      await upsertCrm.mutateAsync({
        companyId,
        status,
        priority,
        assignedUserId: assignedUserId || null,
        clearAssignedUser: !assignedUserId,
        nextActionAt: nextActionAt || null,
        clearNextAction: !nextActionAt && !nextActionDescription,
        nextActionDescription: nextActionDescription || null,
        lostReason: status === "lost" ? lostReason.trim() : null,
        doNotContact,
      });
      toast({ title: "CRM atualizado" });
    } catch {
      toast({ title: "Erro ao salvar CRM", variant: "destructive" });
    }
  };

  const handleAddInteraction = async () => {
    if (companyId == null) return;

    try {
      await addInteraction.mutateAsync({
        companyId,
        interactionType,
        notes: interactionNotes.trim() || null,
        outcome: interactionOutcome.trim() || null,
        interactionAt: interactionAt ? `${interactionAt}T12:00:00.000Z` : null,
        status,
        priority,
        nextActionAt: nextActionAt || null,
        nextActionDescription: nextActionDescription || null,
        clearNextAction: !nextActionAt && !nextActionDescription,
      });
      setInteractionNotes("");
      setInteractionOutcome("");
      setInteractionAt("");
      toast({ title: "Interação registrada" });
    } catch {
      toast({ title: "Erro ao registrar interação", variant: "destructive" });
    }
  };

  const handleQuickContact = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Sheet onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{company?.trade_name ?? company?.name ?? "Empresa"}</SheetTitle>
          <SheetDescription>
            {company?.category ? `${company.category} · ` : ""}
            {[company?.city, company?.state].filter(Boolean).join(" / ")}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        )}

        {error && (
          <p className="py-8 text-sm text-destructive">Não foi possível carregar os detalhes da empresa.</p>
        )}

        {company && !isLoading && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {data?.crm ? (
                <>
                  <RadarStatusBadge status={data.crm.status} />
                  <RadarPriorityBadge priority={data.crm.priority} />
                </>
              ) : null}
              {data?.crm?.do_not_contact ? (
                <Badge variant="destructive">Não contatar</Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {whatsappUrl ? (
                <Button onClick={handleQuickContact} size="sm" type="button" variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
                  WhatsApp
                </Button>
              ) : null}
              {company.instagram_url ? (
                <Button asChild size="sm" variant="outline">
                  <a href={company.instagram_url} rel="noreferrer" target="_blank">
                    <Instagram className="mr-2 h-4 w-4" />
                    Instagram
                  </a>
                </Button>
              ) : null}
              {company.google_maps_url ? (
                <Button asChild size="sm" variant="outline">
                  <a href={company.google_maps_url} rel="noreferrer" target="_blank">
                    <MapPin className="mr-2 h-4 w-4" />
                    Google Maps
                  </a>
                </Button>
              ) : null}
              {company.website ? (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Site
                  </a>
                </Button>
              ) : null}
            </div>

            <Tabs defaultValue="resumo">
              <TabsList className="flex h-auto flex-wrap">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="dados">Dados empresariais</TabsTrigger>
                <TabsTrigger value="socios">Sócios</TabsTrigger>
                <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-4 pt-4" value="resumo">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow
                    label="Nome fantasia"
                    value={displayOrFallback(
                      data?.validated_cnpj?.trade_name ?? company.trade_name ?? company.name,
                    )}
                  />
                  <InfoRow
                    label="Razão social"
                    value={displayOrFallback(
                      data?.validated_cnpj?.legal_name ?? company.legal_name,
                    )}
                  />
                  <InfoRow
                    label="CNPJ"
                    value={formatCnpjDisplay(
                      data?.validated_cnpj?.cnpj_formatted ??
                        company.cnpj_formatted ??
                        data?.validated_cnpj?.cnpj ??
                        company.cnpj,
                    )}
                  />
                  <InfoRow label="Telefone" value={formatPhoneDisplay(phone)} />
                  <InfoRow label="E-mail" value={displayOrFallback(company.email)} />
                  <InfoRow
                    label="Endereço"
                    value={displayOrFallback(
                      data?.validated_cnpj?.full_address ?? company.address,
                    )}
                  />
                  {company.rating != null ? (
                    <InfoRow
                      label="Avaliação Google"
                      value={`${company.rating}${company.reviews_count != null ? ` (${company.reviews_count} avaliações)` : ""}`}
                    />
                  ) : null}
                </div>

                {data?.assigned_user ? (
                  <InfoRow
                    label="Responsável"
                    value={data.assigned_user.full_name ?? data.assigned_user.email ?? "—"}
                  />
                ) : null}

                {data?.crm?.next_action_at || data?.crm?.next_action_description ? (
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="mb-1 flex items-center gap-1 text-sm font-medium">
                      <CalendarClock className="h-4 w-4" />
                      Próxima ação
                    </p>
                    {data.crm.next_action_at ? (
                      <p className="text-sm">{formatDateBR(data.crm.next_action_at)}</p>
                    ) : null}
                    {data.crm.next_action_description ? (
                      <p className="text-sm text-muted-foreground">{data.crm.next_action_description}</p>
                    ) : null}
                  </div>
                ) : null}

                {data?.partners?.some((p) => p.is_probable_decision_maker || p.is_administrator) ? (
                  <div className="rounded-xl border p-4">
                    <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                      <UserRound className="h-4 w-4" />
                      Decisor provável
                    </p>
                    {(() => {
                      const dm =
                        data.partners.find((p) => p.is_probable_decision_maker) ??
                        data.partners.find((p) => p.is_administrator);
                      return dm ? (
                        <p className="text-sm">
                          {dm.partner_name}
                          {dm.qualification ? ` · ${dm.qualification}` : ""}
                        </p>
                      ) : null;
                    })()}
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent className="space-y-4 pt-4" value="dados">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="CNPJ" value={formatCnpjDisplay(company.cnpj_formatted ?? company.cnpj)} />
                  <InfoRow
                    label="Status CNPJ"
                    value={displayOrFallback(company.cnpj_validation_status)}
                  />
                </div>

                {data?.validated_cnpj ? (
                  <div className="space-y-4 rounded-xl border p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Building2 className="h-4 w-4" />
                      Dados validados
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoRow
                        label="Situação cadastral"
                        value={displayOrFallback(data.validated_cnpj.registration_status)}
                      />
                      <InfoRow label="Porte" value={displayOrFallback(data.validated_cnpj.company_size)} />
                      <InfoRow label="Natureza jurídica" value={displayOrFallback(data.validated_cnpj.legal_nature)} />
                      <InfoRow label="MEI" value={meiLabel(data.validated_cnpj.mei_option)} />
                      <InfoRow
                        label="CNAE principal"
                        value={
                          data.validated_cnpj.main_cnae_code
                            ? `${data.validated_cnpj.main_cnae_code} — ${data.validated_cnpj.main_cnae_description ?? ""}`
                            : "Não informado"
                        }
                      />
                      <InfoRow
                        label="Abertura"
                        value={
                          data.validated_cnpj.opening_date
                            ? formatIsoDateBR(data.validated_cnpj.opening_date.slice(0, 10))
                            : "Não informado"
                        }
                      />
                      <InfoRow label="Endereço completo" value={displayOrFallback(data.validated_cnpj.full_address)} />
                    </div>

                    {data.validated_cnpj.secondary_cnaes && data.validated_cnpj.secondary_cnaes.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">CNAEs secundários</p>
                        <ul className="space-y-1 text-sm">
                          {data.validated_cnpj.secondary_cnaes.map((cnae, index) => (
                            <li key={`${cnae.code ?? index}`}>
                              {cnae.code ? `${cnae.code} — ` : ""}
                              {cnae.description ?? "—"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">CNPJ ainda não validado.</p>
                )}

                {data?.contacts && data.contacts.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Contatos</p>
                    <ul className="divide-y rounded-xl border">
                      {data.contacts.map((contact) => (
                        <li className="flex items-center justify-between px-4 py-2 text-sm" key={contact.id}>
                          <span>{contact.display_value ?? contact.normalized_value}</span>
                          <span className="text-xs text-muted-foreground">{contact.contact_type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent className="space-y-3 pt-4" value="socios">
                {data?.partners && data.partners.length > 0 ? (
                  <ul className="divide-y rounded-xl border">
                    {data.partners.map((partner) => (
                      <li className="space-y-1 px-4 py-3" key={partner.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{partner.partner_name}</p>
                          {partner.is_administrator ? <Badge variant="secondary">Administrador</Badge> : null}
                          {partner.is_probable_decision_maker ? (
                            <Badge variant="default">Decisor provável</Badge>
                          ) : null}
                        </div>
                        {partner.qualification ? (
                          <p className="text-xs text-muted-foreground">{partner.qualification}</p>
                        ) : null}
                        {partner.joined_at ? (
                          <p className="text-xs text-muted-foreground">
                            Desde {formatIsoDateBR(partner.joined_at.slice(0, 10))}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum sócio cadastrado.</p>
                )}
              </TabsContent>

              <TabsContent className="space-y-4 pt-4" value="acompanhamento">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <select
                      aria-label="Status CRM"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      onChange={(event) => setStatus(event.target.value as CrmStatus)}
                      value={status}
                    >
                      {CRM_STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {CRM_STATUS_LABELS[item]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Prioridade</Label>
                    <select
                      aria-label="Prioridade CRM"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      onChange={(event) => setPriority(event.target.value as CrmPriority)}
                      value={priority}
                    >
                      {CRM_PRIORITIES.map((item) => (
                        <option key={item} value={item}>
                          {CRM_PRIORITY_LABELS[item]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Responsável</Label>
                    <select
                      aria-label="Responsável"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      onChange={(event) => setAssignedUserId(event.target.value)}
                      value={assignedUserId}
                    >
                      <option value="">Sem responsável</option>
                      {(filterOptions?.assignees ?? []).map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.full_name ?? assignee.email ?? assignee.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Próxima ação (data)</Label>
                    <Input
                      onChange={(event) => setNextActionAt(event.target.value)}
                      type="date"
                      value={nextActionAt}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Descrição da próxima ação</Label>
                    <Input
                      onChange={(event) => setNextActionDescription(event.target.value)}
                      placeholder="Ex.: Retornar ligação"
                      value={nextActionDescription}
                    />
                  </div>

                  {status === "lost" ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Motivo da perda</Label>
                      <Textarea
                        onChange={(event) => setLostReason(event.target.value)}
                        placeholder="Descreva o motivo"
                        value={lostReason}
                      />
                    </div>
                  ) : null}

                  <label className="flex items-center gap-2 sm:col-span-2">
                    <Checkbox
                      checked={doNotContact}
                      onCheckedChange={(checked) => setDoNotContact(checked === true)}
                    />
                    Marcar como não contatar
                  </label>
                </div>

                <Button disabled={upsertCrm.isPending} onClick={() => void handleSaveCrm()} type="button">
                  {upsertCrm.isPending ? "Salvando..." : "Salvar CRM"}
                </Button>

                <div className="space-y-3 rounded-xl border p-4">
                  <p className="text-sm font-medium">Registrar interação</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <select
                        aria-label="Tipo de interação"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        onChange={(event) => setInteractionType(event.target.value as InteractionType)}
                        value={interactionType}
                      >
                        {INTERACTION_TYPES.map((item) => (
                          <option key={item} value={item}>
                            {INTERACTION_TYPE_LABELS[item]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Data</Label>
                      <Input
                        onChange={(event) => setInteractionAt(event.target.value)}
                        type="date"
                        value={interactionAt}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Observações</Label>
                      <Textarea
                        onChange={(event) => setInteractionNotes(event.target.value)}
                        placeholder="Detalhes do contato"
                        value={interactionNotes}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Resultado</Label>
                      <Input
                        onChange={(event) => setInteractionOutcome(event.target.value)}
                        placeholder="Ex.: Aguardando retorno"
                        value={interactionOutcome}
                      />
                    </div>
                  </div>
                  <Button
                    disabled={addInteraction.isPending}
                    onClick={() => void handleAddInteraction()}
                    type="button"
                    variant="secondary"
                  >
                    {addInteraction.isPending ? "Registrando..." : "Registrar interação"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent className="space-y-3 pt-4" value="historico">
                {data?.interactions && data.interactions.length > 0 ? (
                  <ul className="divide-y rounded-xl border">
                    {data.interactions.map((interaction) => (
                      <li className="space-y-1 px-4 py-3" key={interaction.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant="outline">
                            {INTERACTION_TYPE_LABELS[interaction.interaction_type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestampDateBR(interaction.interaction_at)}
                          </span>
                        </div>
                        {interaction.notes ? (
                          <p className="text-sm text-muted-foreground">{interaction.notes}</p>
                        ) : null}
                        {interaction.outcome ? (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Resultado: </span>
                            {interaction.outcome}
                          </p>
                        ) : null}
                        {interaction.created_by_name || interaction.created_by_email ? (
                          <p className="text-xs text-muted-foreground">
                            por {interaction.created_by_name ?? interaction.created_by_email}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma interação registrada.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <AlertDialog onOpenChange={setConfirmDoNotContact} open={confirmDoNotContact}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar não contatar</AlertDialogTitle>
              <AlertDialogDescription>
                Esta empresa sairá do funil ativo. Tem certeza?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleConfirmSave()}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog onOpenChange={setConfirmLost} open={confirmLost}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Motivo da perda obrigatório</AlertDialogTitle>
              <AlertDialogDescription>
                Preencha o motivo da perda antes de salvar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              onChange={(event) => setLostReason(event.target.value)}
              placeholder="Motivo da perda"
              value={lostReason}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleConfirmSave()}>Salvar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};
