import { AlertTriangle, Clock, FileText } from "lucide-react";

type AlertType = "pendencia" | "prazo" | "contrato";

interface AlertItemProps {
  type: AlertType;
  title: string;
  description: string;
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

const AlertItem = ({ type, title, description }: AlertItemProps) => {
  const Icon = iconMap[type];
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default AlertItem;
