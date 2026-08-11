import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { History, Loader2, MapPin, Plus, RefreshCw, Search } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BrazilCityCombobox } from "@/components/location/BrazilCityCombobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_RADAR_SEGMENT,
  RADAR_COVERAGE_STATUS_LABELS,
  fetchRadarMarketSearchTerms,
  useRadarMarketCoverage,
  useRadarMarketSearchTerms,
  useStartRadar00Search,
  type RadarMarketCoverage,
  type StartRadar00SearchResult,
} from "@/features/radar-market-search";
import { useBrazilMunicipalities } from "@/hooks/use-brazil-municipalities";
import { toast } from "@/hooks/use-toast";
import { findBrazilCity } from "@/lib/brazil-cities";
import { getErrorMessage } from "@/lib/error-message";

interface RadarSearchDraft {
  name: string;
  city: string;
  state: string;
  segment: string;
  maxResultsPerTerm: number;
  searchTerms: string;
  notes: string;
}

const DEFAULT_MAX_RESULTS_PER_TERM = 20;
const MIN_MAX_RESULTS_PER_TERM = 1;
const MAX_MAX_RESULTS_PER_TERM = 100;

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const SEGMENT_OPTIONS = [
  { value: "festa_infantil", label: "Festa infantil" },
  { value: "buffet_casamento", label: "Buffet de casamento" },
  { value: "espaco_eventos", label: "Espaço de eventos" },
  { value: "outro", label: "Outro / personalizado" },
] as const;

const createEmptyDraft = (): RadarSearchDraft => ({
  name: "",
  city: "",
  state: "PR",
  segment: DEFAULT_RADAR_SEGMENT,
  maxResultsPerTerm: DEFAULT_MAX_RESULTS_PER_TERM,
  searchTerms: "",
  notes: "",
});

const parseSearchTerms = (value: string): string[] =>
  value
    .split("\n")
    .map((term) => term.trim())
    .filter(Boolean);

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatWebhookError = (raw: string | null | undefined) => {
  if (!raw?.trim()) {
    return "Runs criados, mas o webhook do RADAR 00 não respondeu. Verifique a URL e o secret.";
  }

  const lower = raw.toLowerCase();

  if (lower.includes("respond to webhook")) {
    return "No n8n, no nó Webhook do RADAR 00 mude Respond para “Immediately”, ou adicione um nó Respond to Webhook.";
  }

  if (lower.includes("not registered")) {
    return "O workflow RADAR 00 precisa estar ativo no n8n para a URL de produção funcionar.";
  }

  try {
    const parsed = JSON.parse(raw) as {
      message?: string;
      hint?: string;
      code?: number;
      errorMessage?: string;
    };
    const message = parsed.errorMessage || parsed.message;
    if (message?.toLowerCase().includes("respond to webhook")) {
      return "No n8n, no nó Webhook do RADAR 00 mude Respond para “Immediately”, ou adicione um nó Respond to Webhook.";
    }
    if (message?.includes("not registered") || parsed.code === 404) {
      return "O workflow RADAR 00 precisa estar ativo no n8n para a URL de produção funcionar.";
    }
    if (message) {
      return parsed.hint ? `${message} ${parsed.hint}` : message;
    }
  } catch {
    // Mantém texto bruto quando não for JSON.
  }

  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
};

const notifyStartResult = (result: StartRadar00SearchResult) => {
  if (result.webhook_dispatched) {
    toast({
      title: "Pesquisa iniciada",
      description: `${result.run_ids.length} rodada(s) criada(s) e enviadas ao RADAR 00.`,
    });
    return;
  }

  if (result.webhook_configured) {
    toast({
      title: "Pesquisa registrada, webhook falhou",
      description: formatWebhookError(result.webhook_error),
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "Pesquisa registrada",
    description:
      `${result.run_ids.length} rodada(s) pendente(s) criadas. Configure N8N_RADAR_00_WEBHOOK_URL para disparar o workflow.`,
  });
};

const segmentDisplayLabel = (segment: string) =>
  SEGMENT_OPTIONS.find((option) => option.value === segment)?.label ?? segment;

const AdminRadarGerarLeads = () => {
  const [draft, setDraft] = useState<RadarSearchDraft>(createEmptyDraft);
  const [customSegment, setCustomSegment] = useState("");
  const [rerunningCoverageId, setRerunningCoverageId] = useState<number | null>(null);
  const termsSegmentRef = useRef<string | null>(null);

  const { data: municipalities = [] } = useBrazilMunicipalities(draft.state);
  const { data: coverage = [], isLoading: isLoadingCoverage } = useRadarMarketCoverage();
  const termsSegment = draft.segment === "outro" ? "" : draft.segment;
  const { data: dbTerms = [], isLoading: isLoadingTerms } = useRadarMarketSearchTerms(termsSegment);
  const startSearch = useStartRadar00Search();

  useEffect(() => {
    if (!termsSegment || dbTerms.length === 0) return;
    if (termsSegmentRef.current === termsSegment) return;
    termsSegmentRef.current = termsSegment;
    setDraft((current) => ({
      ...current,
      searchTerms: dbTerms.map((term) => term.search_term).join("\n"),
    }));
  }, [termsSegment, dbTerms]);

  const resolvedSegment =
    draft.segment === "outro" ? customSegment.trim() : draft.segment;
  const terms = parseSearchTerms(draft.searchTerms);
  const selectedCity = findBrazilCity(draft.city, municipalities);
  const searchName = draft.name.trim();
  const maxResultsPerTerm = draft.maxResultsPerTerm;
  const isMaxResultsValid =
    Number.isInteger(maxResultsPerTerm) &&
    maxResultsPerTerm >= MIN_MAX_RESULTS_PER_TERM &&
    maxResultsPerTerm <= MAX_MAX_RESULTS_PER_TERM;
  const canSubmit =
    searchName.length > 0 &&
    Boolean(selectedCity) &&
    draft.state.trim().length === 2 &&
    resolvedSegment.length > 0 &&
    isMaxResultsValid &&
    terms.length > 0 &&
    !startSearch.isPending;

  const segmentLabel = segmentDisplayLabel(draft.segment === "outro" ? resolvedSegment : draft.segment);

  const updateDraft = (patch: Partial<RadarSearchDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSegmentChange = (segment: string) => {
    termsSegmentRef.current = null;
    updateDraft({
      segment,
      searchTerms: segment === "outro" ? "" : draft.searchTerms,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCity) {
      toast({
        title: "Selecione uma cidade válida",
        description: "Escolha uma cidade da lista oficial do IBGE para a UF informada.",
        variant: "destructive",
      });
      return;
    }
    if (!canSubmit) return;

    try {
      const result = await startSearch.mutateAsync({
        search_name: searchName,
        city: selectedCity.nome,
        state: draft.state.trim().toUpperCase(),
        segment: resolvedSegment,
        search_terms: terms,
        max_results_per_term: maxResultsPerTerm,
        notes: draft.notes.trim() || null,
      });

      notifyStartResult(result);

      setDraft((current) => ({
        ...createEmptyDraft(),
        state: current.state,
        segment: current.segment,
        maxResultsPerTerm: current.maxResultsPerTerm,
        searchTerms: current.searchTerms,
      }));
      termsSegmentRef.current = currentSegmentOrNull(draft.segment);
    } catch (error) {
      toast({
        title: "Falha ao iniciar pesquisa",
        description: getErrorMessage(error, "Não foi possível iniciar a pesquisa."),
        variant: "destructive",
      });
    }
  };

  const handleRerunCoverage = async (item: RadarMarketCoverage) => {
    if (startSearch.isPending || rerunningCoverageId !== null) return;

    setRerunningCoverageId(item.id);
    try {
      const segmentTerms = await fetchRadarMarketSearchTerms(item.segment);
      const searchTerms = segmentTerms.map((term) => term.search_term);
      if (searchTerms.length === 0) {
        toast({
          title: "Sem termos ativos",
          description: `Não há termos ativos cadastrados para o segmento ${item.segment}.`,
          variant: "destructive",
        });
        return;
      }

      const result = await startSearch.mutateAsync({
        search_name: `${item.city} — ${segmentDisplayLabel(item.segment)} (nova rodada)`,
        city: item.city,
        state: item.state,
        segment: item.segment,
        search_terms: searchTerms,
        max_results_per_term: DEFAULT_MAX_RESULTS_PER_TERM,
        notes: null,
      });

      notifyStartResult(result);
    } catch (error) {
      toast({
        title: "Falha ao rodar novamente",
        description: getErrorMessage(error, "Não foi possível iniciar a pesquisa."),
        variant: "destructive",
      });
    } finally {
      setRerunningCoverageId(null);
    }
  };

  return (
    <AdminPageShell
      backHref="/admin/radar"
      backLabel="Voltar ao Radar"
      description="Histórico de cobertura e início de novas pesquisas do Radar 00."
      title="Gerar Novos Leads"
    >
      <div className="space-y-6">
        <Card className="rounded-2xl border-white/80 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Cidades já pesquisadas
            </CardTitle>
            <CardDescription>
              Resumo de cobertura por cidade, estado e segmento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCoverage ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando histórico...
              </p>
            ) : coverage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma cidade pesquisada ainda. Inicie a primeira pesquisa abaixo.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Cidade</th>
                      <th className="px-3 py-2 font-medium">UF</th>
                      <th className="px-3 py-2 font-medium">Segmento</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Empresas</th>
                      <th className="px-3 py-2 font-medium">Buscas</th>
                      <th className="px-3 py-2 font-medium">Última busca</th>
                      <th className="px-3 py-2 font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverage.map((item) => {
                      const isRerunning = rerunningCoverageId === item.id;
                      return (
                        <tr key={item.id} className="border-t border-border/50">
                          <td className="px-3 py-2 font-medium">{item.city}</td>
                          <td className="px-3 py-2">{item.state}</td>
                          <td className="px-3 py-2">{item.segment}</td>
                          <td className="px-3 py-2">
                            {RADAR_COVERAGE_STATUS_LABELS[item.coverage_status] ??
                              item.coverage_status}
                          </td>
                          <td className="px-3 py-2">{item.companies_found}</td>
                          <td className="px-3 py-2">{item.searches_executed}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatDateTime(item.last_search_at)}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              disabled={startSearch.isPending || rerunningCoverageId !== null}
                              onClick={() => void handleRerunCoverage(item)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {isRerunning ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Rodar novamente
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Card className="rounded-2xl border-white/80 bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-primary" />
                  Nova pesquisa
                </CardTitle>
                <CardDescription>
                  Cada termo gera uma rodada pendente e dispara o RADAR 00 quando o webhook estiver
                  configurado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="radar-search-name">Nome da pesquisa</Label>
                  <Input
                    id="radar-search-name"
                    onChange={(event) => updateDraft({ name: event.target.value })}
                    placeholder="Ex.: Cascavel — festa infantil"
                    required
                    value={draft.name}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="radar-search-state">Estado (UF)</Label>
                    <select
                      aria-label="Estado"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      id="radar-search-state"
                      onChange={(event) =>
                        updateDraft({ state: event.target.value, city: "" })
                      }
                      value={draft.state}
                    >
                      {BRAZIL_STATES.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="radar-search-city">Cidade</Label>
                    <BrazilCityCombobox
                      id="radar-search-city"
                      onChange={(city) => updateDraft({ city })}
                      placeholder="Buscar cidade..."
                      stateUf={draft.state}
                      value={draft.city}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="radar-search-segment">Segmento</Label>
                    <select
                      aria-label="Segmento"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      id="radar-search-segment"
                      onChange={(event) => handleSegmentChange(event.target.value)}
                      value={draft.segment}
                    >
                      {SEGMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {draft.segment === "outro" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="radar-search-custom-segment">Segmento personalizado</Label>
                      <Input
                        id="radar-search-custom-segment"
                        onChange={(event) => setCustomSegment(event.target.value)}
                        placeholder="Ex.: decoracao_festas"
                        required
                        value={customSegment}
                      />
                    </div>
                  ) : (
                    <div className="flex items-end">
                      <p className="pb-2 text-xs text-muted-foreground">
                        {isLoadingTerms
                          ? "Carregando termos oficiais..."
                          : dbTerms.length > 0
                            ? `${dbTerms.length} termo(s) ativos do segmento`
                            : "Nenhum termo ativo cadastrado para este segmento"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="radar-search-max-results">Máximo de resultados por termo</Label>
                  <Input
                    id="radar-search-max-results"
                    inputMode="numeric"
                    max={MAX_MAX_RESULTS_PER_TERM}
                    min={MIN_MAX_RESULTS_PER_TERM}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      updateDraft({
                        maxResultsPerTerm: Number.isNaN(parsed) ? 0 : parsed,
                      });
                    }}
                    required
                    type="number"
                    value={draft.maxResultsPerTerm || ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="radar-search-terms">Termos de busca</Label>
                    <span className="text-xs text-muted-foreground">
                      {terms.length} termo{terms.length === 1 ? "" : "s"} · um por linha
                    </span>
                  </div>
                  <Textarea
                    className="min-h-[200px] font-mono text-sm"
                    id="radar-search-terms"
                    onChange={(event) => updateDraft({ searchTerms: event.target.value })}
                    placeholder={"buffet infantil\ncasa de festas infantil"}
                    required
                    value={draft.searchTerms}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="radar-search-notes">Observações (opcional)</Label>
                  <Textarea
                    id="radar-search-notes"
                    onChange={(event) => updateDraft({ notes: event.target.value })}
                    placeholder="Contexto interno para esta rodada de prospecção..."
                    value={draft.notes}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-2xl border-white/80 bg-white/90">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-primary" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{searchName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="font-medium">
                      {selectedCity?.nome || draft.city.trim() || "—"}, {draft.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Segmento</p>
                    <p className="font-medium">{segmentLabel || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Máx. por termo</p>
                    <p className="font-medium">
                      {isMaxResultsValid ? maxResultsPerTerm : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rodadas</p>
                    <p className="font-medium">
                      {terms.length} termo{terms.length === 1 ? "" : "s"} de busca
                    </p>
                  </div>
                  {terms.length > 0 ? (
                    <ul className="space-y-1 border-t border-border/60 pt-3 text-muted-foreground">
                      {terms.slice(0, 6).map((term) => (
                        <li key={term} className="truncate">
                          · {term}
                        </li>
                      ))}
                      {terms.length > 6 ? (
                        <li className="text-xs">+{terms.length - 6} mais</li>
                      ) : null}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-dashed border-amber-300/80 bg-amber-50/60">
                <CardContent className="space-y-2 pt-6 text-sm text-amber-950/80">
                  <p className="font-medium text-amber-950">RADAR 00</p>
                  <p>
                    Ao iniciar, a pesquisa é gravada no schema radar. O disparo do workflow usa o
                    secret N8N_RADAR_00_WEBHOOK_URL na Edge Function.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline">
              <Link to="/admin/radar">Cancelar</Link>
            </Button>
            <Button disabled={!canSubmit} type="submit">
              {startSearch.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Iniciar pesquisa
            </Button>
          </div>
        </form>
      </div>
    </AdminPageShell>
  );
};

const currentSegmentOrNull = (segment: string) => (segment === "outro" ? null : segment);

export default AdminRadarGerarLeads;
