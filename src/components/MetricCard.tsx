import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  accent?: "primary" | "coral" | "rosa" | "lilas" | "success" | "warning";
}

const accentClasses = {
  primary: "bg-primary/15 text-primary",
  coral: "bg-coral/15 text-coral",
  rosa: "bg-rosa/15 text-rosa",
  lilas: "bg-lilas/15 text-lilas",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const MetricCard = ({ title, value, change, icon: Icon, accent = "primary" }: MetricCardProps) => {
  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-success" : "text-coral"}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </div>
  );
};

export default MetricCard;
