import { Input } from "@/components/ui/input";
import {
  COMPETENCIA_MONTH_INPUT_MAX,
  COMPETENCIA_MONTH_INPUT_MIN,
  isValidCompetenciaMonth,
} from "@/features/financeiro";

interface CompetenciaMonthInputProps {
  id: string;
  onChange: (value: string) => void;
  value: string;
}

/** Input month que ignora autofill/valores com ano impossível (ex.: 0002-08). */
export const CompetenciaMonthInput = ({ id, onChange, value }: CompetenciaMonthInputProps) => (
  <Input
    id={id}
    type="month"
    autoComplete="off"
    max={COMPETENCIA_MONTH_INPUT_MAX}
    min={COMPETENCIA_MONTH_INPUT_MIN}
    name={`${id}-competencia`}
    value={value}
    onChange={(event) => {
      const next = event.target.value;
      if (!next || isValidCompetenciaMonth(next)) {
        onChange(next);
      }
    }}
  />
);
