import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? (allowCustomValue && value ? value : undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
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
        <Command shouldFilter={!allowCustomValue}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={allowCustomValue ? search : undefined}
            onValueChange={allowCustomValue ? setSearch : undefined}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustomValue && search.trim() ? (
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent rounded-sm"
                  onClick={() => { onChange(search.trim()); setSearch(""); setOpen(false); }}
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
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setSearch("");
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
