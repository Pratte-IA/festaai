import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Search, Sparkles } from "lucide-react";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface RadarSearchDraft {
  city: string;
  state: string;
  segment: string;
  searchTerms: string;
  notes: string;
}

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

const SUGGESTED_TERMS: Record<string, string[]> = {
  festa_infantil: [
    "casa de festas infantil",
    "buffet infantil",
    "espaço de festas infantil",
    "salão de festas infantil",
    "espaço kids para aniversário",
    "aniversário infantil",
    "buffet para aniversário infantil",
    "espaço para festa de criança",
  ],
};

const createEmptyDraft = (): RadarSearchDraft => ({
  city: "",
  state: "PR",
  segment: "festa_infantil",
  searchTerms: SUGGESTED_TERMS.festa_infantil.join("\n"),
  notes: "",
});

const parseSearchTerms = (value: string): string[] =>
  value
    .split("\n")
    .map((term) => term.trim())
    .filter(Boolean);

const AdminRadarGerarLeads = () => {
  const [draft, setDraft] = useState<RadarSearchDraft>(createEmptyDraft);
  const [customSegment, setCustomSegment] = useState("");

  const resolvedSegment =
    draft.segment === "outro" ? customSegment.trim() : draft.segment;
  const terms = parseSearchTerms(draft.searchTerms);
  const canSubmit =
    draft.city.trim().length > 0 &&
    draft.state.trim().length === 2 &&
    resolvedSegment.length > 0 &&
    terms.length > 0;

  const segmentLabel =
    SEGMENT_OPTIONS.find((option) => option.value === draft.segment)?.label ??
    resolvedSegment;

  const updateDraft = (patch: Partial<RadarSearchDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSegmentChange = (segment: string) => {
    const suggested = SUGGESTED_TERMS[segment];
    updateDraft({
      segment,
      searchTerms: suggested ? suggested.join("\n") : draft.searchTerms,
    });
  };

  const handleApplySuggestedTerms = () => {
    const suggested = SUGGESTED_TERMS[draft.segment];
    if (!suggested) return;
    updateDraft({ searchTerms: suggested.join("\n") });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    // Payload pronto para o workflow — conexão será feita manualmente depois.
    const payload = {
      city: draft.city.trim(),
      state: draft.state.trim().toUpperCase(),
      segment: resolvedSegment,
      search_terms: terms,
      notes: draft.notes.trim() || null,
    };

    console.info("[radar-gerar-leads] payload pronto para workflow", payload);

    toast({
      title: "Pesquisa preparada",
      description:
        "A conexão com o workflow ainda não está ligada. Quando você conectar, este payload será enviado.",
    });
  };

  return (
    <AdminPageShell
      backHref="/admin/radar"
      backLabel="Voltar ao Radar"
      description="Monte a pesquisa de prospecção. O workflow será conectado depois para executar a coleta."
      title="Gerar Novos Leads"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="rounded-2xl border-white/80 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-primary" />
                Parâmetros da prospecção
              </CardTitle>
              <CardDescription>
                Informe onde e o que o motor deve buscar. Cada termo vira uma rodada de pesquisa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="radar-search-city">Cidade</Label>
                  <Input
                    id="radar-search-city"
                    onChange={(event) => updateDraft({ city: event.target.value })}
                    placeholder="Ex.: Cascavel"
                    required
                    value={draft.city}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="radar-search-state">Estado (UF)</Label>
                  <select
                    aria-label="Estado"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    id="radar-search-state"
                    onChange={(event) => updateDraft({ state: event.target.value })}
                    value={draft.state}
                  >
                    {BRAZIL_STATES.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
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
                    <Button
                      className="w-full sm:w-auto"
                      disabled={!SUGGESTED_TERMS[draft.segment]}
                      onClick={handleApplySuggestedTerms}
                      type="button"
                      variant="outline"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Usar termos sugeridos
                    </Button>
                  </div>
                )}
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
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="font-medium">
                    {draft.city.trim() || "—"}, {draft.state}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Segmento</p>
                  <p className="font-medium">{segmentLabel || "—"}</p>
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
                <p className="font-medium text-amber-950">Workflow</p>
                <p>
                  Nenhum disparo automático. Quando a conexão for ligada, este formulário
                  envia o payload para o seu workflow.
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
            <Plus className="mr-2 h-4 w-4" />
            Preparar pesquisa
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
};

export default AdminRadarGerarLeads;
