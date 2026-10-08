import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormItemContext } from "@/components/ui/form";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /** Si es true, permite escribir un valor libre que no está en `options` (usado por los combobox
   * de nomencladores: el catálogo sugiere, pero el campo sigue guardando texto libre). */
  allowCustomValue?: boolean;
  /** Búsqueda en el servidor: si se indica, el texto escrito se entrega aquí y `options` ya
   * llegan filtradas (no se filtra en el navegador). Para listas que no caben en una página. */
  onSearchChange?: (search: string) => void;
  /** Etiqueta del valor seleccionado cuando no está entre las `options` cargadas (búsqueda remota). */
  selectedLabel?: string;
  loading?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción",
  searchPlaceholder = "Buscar...",
  emptyText = "Sin resultados.",
  disabled,
  className,
  allowCustomValue = false,
  onSearchChange,
  selectedLabel,
  loading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const remote = !!onSearchChange;
  // Dentro de un FormItem, el botón toma el id al que apunta su FormLabel (htmlFor): así el lector
  // de pantalla anuncia "Cliente, Selecciona un cliente" y no un botón sin nombre.
  const formItem = React.useContext(FormItemContext);
  const triggerId = formItem?.id ? `${formItem.id}-form-item` : undefined;
  // Con búsqueda remota, la opción elegida puede no estar en la página de resultados actual.
  const [picked, setPicked] = React.useState<ComboboxOption | null>(null);

  const selectedOption = options.find((o) => o.value === value) ?? (picked?.value === value ? picked : undefined);
  const displayLabel = selectedOption?.label ?? (value ? selectedLabel : undefined) ?? (allowCustomValue && value ? value : undefined);

  const updateSearch = (next: string) => {
    setSearch(next);
    onSearchChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={triggerId}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-slate-50 border-slate-100 font-normal",
            !displayLabel && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={!allowCustomValue && !remote}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={allowCustomValue || remote ? search : undefined}
            onValueChange={allowCustomValue || remote ? updateSearch : undefined}
          />
          <CommandList>
            {loading && <div className="px-2 py-1.5 text-xs text-muted-foreground" aria-live="polite">Buscando…</div>}
            <CommandEmpty>
              {allowCustomValue && search.trim() ? (
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent rounded-sm"
                  onClick={() => { onChange(search.trim()); updateSearch(""); setOpen(false); }}
                >
                  Usar "{search.trim()}"
                </button>
              ) : emptyText}
            </CommandEmpty>
            <CommandGroup>
              {(allowCustomValue
                ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
                : options
              ).map((option) => (
                <CommandItem
                  key={option.value}
                  value={remote ? option.value : option.label}
                  onSelect={() => {
                    setPicked(option);
                    onChange(option.value);
                    updateSearch("");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
