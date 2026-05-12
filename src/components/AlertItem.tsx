import { AlertTriangle, Clock, FileText } from "lucide-react";

type AlertType = "pendencia" | "prazo" | "contrato";

interface AlertItemProps {
  type: AlertType;
  title: string;
  description: string;
  onClick?: () => void;
}

const iconMap = {
  pendencia: AlertTriangle,
  prazo: Clock,
  contrato: FileText,
};

const colorMap = {
  pendencia: "text-warning bg-warning/15",
  prazo: "text-coral bg-coral/15",
  contrato: "text-primary bg-primary/15",
};

const AlertItem = ({ type, title, description, onClick }: AlertItemProps) => {
  const Icon = iconMap[type];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
};

export default AlertItem;
