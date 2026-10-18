import * as React from "react";
import { ChevronUp, Maximize2, Minimize2, Minus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Patrón común de los formularios laterales (cliente, proveedor, solicitud, cotización, pago…):
 * en móvil ocupa todo el ancho, el encabezado y el botón de guardar quedan fijos y solo se
 * desplaza el contenido; en pantallas grandes es un panel lateral del ancho indicado.
 *
 * Como el redactor de Gmail, se puede minimizar (queda una barra abajo y se conserva lo escrito, porque el
 * formulario vive en el componente padre) y, en pantallas grandes, maximizar. Si el padre reutiliza el
 * mismo panel para otro registro, pasa `restoreKey` (p. ej. el id) para que se vuelva a mostrar.
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
  /**
   * Cambia cuando el padre carga otro registro en el mismo formulario (p. ej. el id que se edita):
   * si el panel estaba minimizado, vuelve a abrirse para que se vea la nueva edición.
   */
  restoreKey?: unknown;
  children: React.ReactNode;
}

// --- Barras de formularios minimizados (estilo Gmail) ---
// Registro compartido para apilar las barras sin que se tapen entre sí.
let dockedIds: string[] = [];
const dockListeners = new Set<() => void>();
const emitDock = () => dockListeners.forEach((l) => l());
const subscribeDock = (l: () => void) => {
  dockListeners.add(l);
  return () => {
    dockListeners.delete(l);
  };
};
const getDock = () => dockedIds;

function useDockSlot(id: string, active: boolean): number {
  React.useEffect(() => {
    if (!active) return;
    dockedIds = [...dockedIds, id];
    emitDock();
    return () => {
      dockedIds = dockedIds.filter((x) => x !== id);
      emitDock();
    };
  }, [id, active]);
  return React.useSyncExternalStore(subscribeDock, getDock).indexOf(id);
}

const FormSheetContext = React.createContext<{ maximized: boolean; scrollTop: React.MutableRefObject<number> }>({
  maximized: false,
  scrollTop: { current: 0 },
});

const headerButtonClass =
  "absolute flex h-11 w-11 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:h-8 sm:w-8 top-2 sm:top-4";

export function FormSheet({ open, onOpenChange, title, description, widthClassName = "sm:max-w-[600px]", restoreKey, children }: FormSheetProps) {
  const id = React.useId();
  const [minimized, setMinimized] = React.useState(false);
  const [maximized, setMaximized] = React.useState(false);
  const scrollTop = React.useRef(0);
  const restoreButton = React.useRef<HTMLButtonElement>(null);
  const slot = useDockSlot(id, open && minimized);

  // Al cerrarse el formulario (guardar o cancelar) se olvida el estado de la ventana.
  React.useEffect(() => {
    if (!open) {
      setMinimized(false);
      setMaximized(false);
      scrollTop.current = 0;
    }
  }, [open]);

  // Otra edición cargada en el mismo formulario: se muestra aunque estuviera minimizado.
  const firstKey = React.useRef(true);
  React.useEffect(() => {
    if (firstKey.current) {
      firstKey.current = false;
      return;
    }
    setMinimized(false);
  }, [restoreKey]);

  React.useEffect(() => {
    if (minimized) restoreButton.current?.focus();
  }, [minimized]);

  return (
    <FormSheetContext.Provider value={{ maximized, scrollTop }}>
      <Sheet open={open && !minimized} onOpenChange={onOpenChange}>
        <SheetContent
          className={cn(
            "flex flex-col gap-0 p-0",
            widthClassName,
            maximized && "sm:w-full sm:max-w-[min(1100px,100vw)]",
          )}
        >
          <SheetHeader className="space-y-1 border-b border-slate-100 px-4 pb-4 pr-28 pt-5 text-left sm:px-6 sm:pr-32">
            <SheetTitle className="text-xl font-playfair font-bold text-navy sm:text-2xl">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <button
            type="button"
            aria-label="Minimizar formulario"
            title="Minimizar"
            onClick={() => setMinimized(true)}
            className={cn(headerButtonClass, "right-14 sm:right-[5.5rem]")}
          >
            <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            aria-label={maximized ? "Restaurar tamaño" : "Maximizar formulario"}
            title={maximized ? "Restaurar tamaño" : "Maximizar"}
            onClick={() => setMaximized((m) => !m)}
            className={cn(headerButtonClass, "hidden sm:flex sm:right-14")}
          >
            {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {children}
        </SheetContent>
      </Sheet>
      {open && minimized && (
        <div
          role="region"
          aria-label="Formulario minimizado"
          style={{ "--dock-slot": slot < 0 ? 0 : slot } as React.CSSProperties}
          className={cn(
            "fixed z-40 flex items-center gap-1 rounded-t-xl border border-slate-200 bg-navy px-3 py-2 text-white shadow-xl",
            // Móvil: barras a todo el ancho apiladas hacia arriba; escritorio: pestañas junto a la esquina.
            "inset-x-2 bottom-[calc(0.5rem+var(--dock-slot)*3rem+env(safe-area-inset-bottom))] rounded-xl",
            "sm:inset-x-auto sm:bottom-0 sm:right-[calc(1rem+var(--dock-slot)*19rem)] sm:w-72 sm:rounded-b-none sm:rounded-t-xl",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
          <button
            ref={restoreButton}
            type="button"
            aria-label="Restaurar formulario"
            title="Restaurar"
            onClick={() => setMinimized(false)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60 sm:h-7 sm:w-7"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Cerrar formulario"
            title="Cerrar"
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60 sm:h-7 sm:w-7"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </FormSheetContext.Provider>
  );
}

/** Zona desplazable del formulario (scroll nativo: respeta la inercia y el teclado en móvil). */
export function FormSheetBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { maximized, scrollTop } = React.useContext(FormSheetContext);
  const ref = React.useRef<HTMLDivElement>(null);
  // Si el panel estuvo minimizado, vuelve a la misma posición de desplazamiento.
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollTop.current;
  }, [scrollTop]);
  return (
    <div
      ref={ref}
      onScroll={(e) => {
        scrollTop.current = e.currentTarget.scrollTop;
      }}
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6", className)}
      {...props}
    >
      <div className={cn("space-y-5", maximized && "mx-auto w-full max-w-3xl")}>{children}</div>
    </div>
  );
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
