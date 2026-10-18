import { Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_ADDITIONAL_EMAILS } from "@/lib/mailto";

interface AdditionalEmailsFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  /** Error del campo en react-hook-form: un objeto por fila con su `message`. */
  error?: unknown;
  placeholder?: string;
  disabled?: boolean;
}

function rowMessage(error: unknown, index: number): string | undefined {
  const row = (error as Array<{ message?: string } | undefined> | undefined)?.[index];
  return row?.message;
}

/**
 * Lista editable de correos adicionales (además del principal): una fila por correo con su botón
 * para quitarla y un botón para agregar otra. Las filas vacías se ignoran al guardar.
 */
export function AdditionalEmailsField({ value, onChange, error, placeholder = "otro@ejemplo.com", disabled }: AdditionalEmailsFieldProps) {
  const list = Array.isArray(value) ? value : [];
  const lastInput = useRef<HTMLInputElement>(null);
  const atLimit = list.length >= MAX_ADDITIONAL_EMAILS;

  const update = (index: number, next: string) => onChange(list.map((email, i) => (i === index ? next : email)));
  const remove = (index: number) => onChange(list.filter((_, i) => i !== index));
  // Tras agregar una fila, el foco pasa a su campo en cuanto se pinta (sin depender de temporizadores:
  // quien teclea enseguida no pierde la primera letra).
  const focusLast = useRef(false);
  useEffect(() => {
    if (focusLast.current) {
      focusLast.current = false;
      lastInput.current?.focus();
    }
  }, [list.length]);
  const add = () => {
    focusLast.current = true;
    onChange([...list, ""]);
  };

  return (
    <div className="space-y-2">
      {list.map((email, index) => {
        const message = rowMessage(error, index);
        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                ref={index === list.length - 1 ? lastInput : undefined}
                type="text"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="off"
                value={email}
                disabled={disabled}
                placeholder={placeholder}
                aria-label={`Correo adicional ${index + 1}`}
                aria-invalid={message ? true : undefined}
                onChange={(e) => update(index, e.target.value)}
                className="bg-white"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Quitar correo adicional ${index + 1}`}
                onClick={() => remove(index)}
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {message && <p className="text-[10px] font-medium text-destructive">{message}</p>}
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled || atLimit} onClick={add} className="gap-1.5 text-xs font-bold">
          <Plus className="h-3.5 w-3.5" /> Agregar correo
        </Button>
        {atLimit && <span className="text-[10px] text-muted-foreground">Máximo {MAX_ADDITIONAL_EMAILS} correos adicionales</span>}
      </div>
    </div>
  );
}
