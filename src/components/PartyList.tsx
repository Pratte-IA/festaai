import { Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardParty } from "@/features/dashboard";

interface PartyListProps {
  isLoading?: boolean;
  parties: DashboardParty[];
}

const PartyList = ({ isLoading = false, parties }: PartyListProps) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h3 className="text-sm font-semibold text-foreground mb-4">Próximas Festas</h3>
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando próximas festas...</p>}
        {!isLoading && parties.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma festa futura encontrada.</p>
        )}
        {parties.map((party) => (
          <div
            key={party.id}
            onClick={() => navigate(`/crm/evento/${party.id}`)}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-rosa/15 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-rosa" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{party.client}</p>
              <p className="text-xs text-muted-foreground">{party.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {party.value}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${party.statusColor}`}>
                {party.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartyList;
