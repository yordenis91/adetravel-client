import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Patrón común de los formularios laterales (cliente, proveedor, solicitud, cotización, pago…):
 * en móvil ocupa todo el ancho, el encabezado y el botón de guardar quedan fijos y solo se
 * desplaza el contenido; en pantallas grandes es un panel lateral del ancho indicado.
 *
 *   <FormSheet open onOpenChange title="…" description="…" widthClassName="sm:max-w-[600px]">
 *     <Form {...form}>
 *       <form className="flex min-h-0 flex-1 flex-col">
 *         <FormSheetBody> <FormSection tone="blue" icon={…} title="…"> <FormGrid>…</FormGrid> </FormSection> </FormSheetBody>
 *         <FormSheetFooter> <Button>Cancelar</Button> <Button type="submit">Guardar</Button> </FormSheetFooter>
 *       </form>
 *     </Form>
 *   </FormSheet>
 */
interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  widthClassName?: string;
  children: React.ReactNode;
}

export function FormSheet({ open, onOpenChange, title, description, widthClassName = "sm:max-w-[600px]", children }: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("flex flex-col gap-0 p-0", widthClassName)}>
        <SheetHeader className="space-y-1 border-b border-slate-100 px-4 pb-4 pr-14 pt-5 text-left sm:px-6">
          <SheetTitle className="text-xl font-playfair font-bold text-navy sm:text-2xl">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/** Zona desplazable del formulario (scroll nativo: respeta la inercia y el teclado en móvil). */
export function FormSheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6", className)} {...props} />;
}

/** Pie fijo con las acciones: botones de 44 px en móvil (el principal ocupa el espacio restante) y
 * respeta la barra inferior del iPhone (safe-area). */
export function FormSheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 border-t border-slate-100 bg-background px-4 pt-3 sm:justify-end sm:px-6",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "[&>button]:h-11 sm:[&>button]:h-10 [&>button:last-child]:flex-1 sm:[&>button:last-child]:flex-none sm:[&>button:last-child]:min-w-[140px]",
        className,
      )}
      {...props}
    />
  );
}

const TONES = {
  blue: { box: "bg-blue-50/50 border-blue-100", title: "text-blue-700" },
  emerald: { box: "bg-emerald-50/50 border-emerald-100", title: "text-emerald-700" },
  amber: { box: "bg-amber-50/50 border-amber-100", title: "text-amber-700" },
  violet: { box: "bg-violet-50/50 border-violet-100", title: "text-violet-700" },
  rose: { box: "bg-rose-50/50 border-rose-100", title: "text-rose-700" },
  slate: { box: "bg-slate-50 border-slate-200", title: "text-navy" },
} as const;

export type FormSectionTone = keyof typeof TONES;

interface FormSectionProps {
  title: React.ReactNode;
  icon?: LucideIcon;
  tone?: FormSectionTone;
  /** Contenido a la derecha del título (p. ej. un botón "Agregar"). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Tarjeta de sección con color, ícono y título (estilo del formulario "Registrar pago"). */
export function FormSection({ title, icon: Icon, tone = "slate", action, className, children }: FormSectionProps) {
  const t = TONES[tone];
  return (
    <section className={cn("space-y-4 rounded-xl border p-4 sm:p-5", t.box, className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-wider", t.title)}>
          {Icon && <Icon className="h-4 w-4 shrink-0" />} {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Una columna en móvil; dos (o tres) desde 640 px. */
export function FormGrid({ cols = 2, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { cols?: 2 | 3 }) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2", className)}
      {...props}
    />
  );
}

/** Estilos de etiqueta y campo compartidos por todos los formularios. */
export const formLabelClass = "text-xs font-bold text-navy";
export const formFieldClass = "bg-white";
