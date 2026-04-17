import { useState, useMemo } from "react";
import { mockEvents, Event } from "@/data/mockEvents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, AlertTriangle, Filter, ChevronDown, ChevronUp, DollarSign } from "lucide-react";

interface DebtClient {
  event: Event;
  totalPaid: number;
  balance: number;
  priority: "alta" | "media" | "baixa";
}

const FinanceiroReport = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  const clients = useMemo<DebtClient[]>(() => {
    return mockEvents
      .filter((e) => {
        const paid = e.payments.reduce((s, p) => s + p.amount, 0);
        return e.totalValue - paid > 0;
      })
      .map((event) => {
        const totalPaid = event.payments.reduce((s, p) => s + p.amount, 0);
        const balance = event.totalValue - totalPaid;
        const ratio = balance / event.totalValue;

        let priority: "alta" | "media" | "baixa" = "baixa";
        if (ratio >= 0.6) priority = "alta";
        else if (ratio >= 0.3) priority = "media";

        return { event, totalPaid, balance, priority };
      })
      .sort((a, b) => {
        const order = { alta: 0, media: 1, baixa: 2 };
        return order[a.priority] - order[b.priority] || b.balance - a.balance;
      });
  }, []);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (minBalance && c.balance < Number(minBalance)) return false;
      if (maxBalance && c.balance > Number(maxBalance)) return false;
      if (minTotal && c.event.totalValue < Number(minTotal)) return false;
      if (maxTotal && c.event.totalValue > Number(maxTotal)) return false;
      return true;
    });
  }, [clients, minBalance, maxBalance, minTotal, maxTotal]);

  const totalOpen = filtered.reduce((s, c) => s + c.balance, 0);

  const openWhatsApp = (phone: string, name: string, balance: number) => {
    const cleaned = phone.replace(/\D/g, "");
    const formatted = balance.toLocaleString("pt-BR");
    const msg = encodeURIComponent(`Olá ${name}! Passando para lembrar sobre o saldo de R$ ${formatted} referente à festinha. Podemos conversar? 😊`);
    window.open(`https://wa.me/55${cleaned}?text=${msg}`, "_blank");
  };

  const priorityBadge = (p: "alta" | "media" | "baixa") => {
    const styles = {
      alta: "bg-coral/15 text-coral border-coral/30",
      media: "bg-warning/15 text-warning border-warning/30",
      baixa: "bg-muted text-muted-foreground border-border",
    };
    const labels = { alta: "Alto", media: "Médio", baixa: "Baixo" };
    return <Badge variant="outline" className={styles[p]}>{labels[p]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Clientes com saldo</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-coral" />
            <p className="text-sm text-muted-foreground">Total em aberto</p>
          </div>
          <p className="text-2xl font-bold text-coral">
            R$ {totalOpen.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Ticket médio em aberto</p>
          <p className="text-2xl font-bold text-foreground">
            {filtered.length > 0
              ? `R$ ${Math.round(totalOpen / filtered.length).toLocaleString("pt-BR")}`
              : "—"}
          </p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
        <Filter className="w-4 h-4" />
        Filtros
        {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {showFilters && (
        <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Saldo mínimo</label>
            <Input type="number" placeholder="0" value={minBalance} onChange={(e) => setMinBalance(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Saldo máximo</label>
            <Input type="number" placeholder="10000" value={maxBalance} onChange={(e) => setMaxBalance(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor total (mín)</label>
            <Input type="number" placeholder="0" value={minTotal} onChange={(e) => setMinTotal(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor total (máx)</label>
            <Input type="number" placeholder="10000" value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Nenhum cliente com saldo devedor encontrado.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data da festa</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Saldo devedor</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.event.id} className={c.priority === "alta" ? "bg-coral/5" : ""}>
                  <TableCell className="font-medium">{c.event.clientName}</TableCell>
                  <TableCell>{new Date(c.event.partyDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">R$ {c.event.totalValue.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right text-success">R$ {c.totalPaid.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-semibold text-coral">R$ {c.balance.toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{priorityBadge(c.priority)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-success hover:text-success"
                      onClick={() => openWhatsApp(c.event.phone, c.event.clientName, c.balance)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden md:inline">Cobrar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default FinanceiroReport;
