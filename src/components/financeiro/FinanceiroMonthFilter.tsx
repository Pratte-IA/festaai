import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatFinanceiroMonthLabel } from "@/features/financeiro/month-range";

interface FinanceiroMonthFilterProps {
  month: string;
  onMonthChange: (month: string) => void;
}

export const FinanceiroMonthFilter = ({ month, onMonthChange }: FinanceiroMonthFilterProps) => (
  <div className="max-w-xs space-y-1">
    <Label htmlFor="financeiro-month" className="text-xs uppercase tracking-wide text-muted-foreground">
      Periodo
    </Label>
    <Input
      id="financeiro-month"
      type="month"
      value={month}
      onChange={(event) => onMonthChange(event.target.value)}
    />
    <p className="text-xs capitalize text-muted-foreground">{formatFinanceiroMonthLabel(month)}</p>
  </div>
);
