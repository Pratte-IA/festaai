import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBrazilMunicipalities } from "@/hooks/use-brazil-municipalities";
import { normalizeCitySearch } from "@/lib/brazil-cities";
import { cn } from "@/lib/utils";

interface BrazilCityComboboxProps {
  id?: string;
  stateUf: string;
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const BrazilCityCombobox = ({
  id,
  stateUf,
  value,
  onChange,
  placeholder = "Buscar cidade...",
  disabled = false,
}: BrazilCityComboboxProps) => {
  const [open, setOpen] = useState(false);
  const { data: cities = [], isLoading, isError, isFetching } = useBrazilMunicipalities(stateUf);

  const selectedLabel = useMemo(() => {
    const needle = normalizeCitySearch(value);
    if (!needle) return "";
    return cities.find((city) => normalizeCitySearch(city.nome) === needle)?.nome ?? value;
  }, [cities, value]);

  const filterCities = (itemValue: string, search: string) => {
    const normalizedItem = normalizeCitySearch(itemValue);
    const normalizedSearch = normalizeCitySearch(search);
    if (!normalizedSearch) return 1;
    return normalizedItem.includes(normalizedSearch) ? 1 : 0;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || stateUf.trim().length !== 2}
          id={id}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel || placeholder}
          </span>
          {isLoading || isFetching ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command filter={filterCities}>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            {isError ? (
              <div className="px-3 py-6 text-center text-sm text-destructive">
                Não foi possível carregar as cidades. Tente novamente.
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {isLoading ? "Carregando cidades..." : "Nenhuma cidade encontrada."}
                </CommandEmpty>
                <CommandGroup>
                  {cities.map((city) => {
                    const isSelected = normalizeCitySearch(city.nome) === normalizeCitySearch(value);
                    return (
                      <CommandItem
                        key={city.codigoIbge}
                        onSelect={() => {
                          onChange(city.nome);
                          setOpen(false);
                        }}
                        value={city.nome}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
                        />
                        {city.nome}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
