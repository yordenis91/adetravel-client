import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={className}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.23 8.24c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29Z" />
  </svg>
);

interface WhatsAppButtonProps {
  phone?: string | null;
  message?: string;
  /** "icon-sm": icono de 24 px para filas de tabla; "icon": 32 px; "full": botón con texto para fichas y diálogos. */
  variant?: "icon" | "icon-sm" | "full";
  label?: string;
  className?: string;
}

const BRAND = "bg-[#25D366] hover:bg-[#1EBE5A] text-white";

/**
 * Abre WhatsApp (wa.me) con el chat del cliente y un mensaje de partida. Si el teléfono no sirve
 * (vacío o sin código de país reconocible) se muestra desactivado y explica por qué, en vez de
 * esconderse, para que el usuario sepa qué corregir en la ficha del cliente.
 */
export function WhatsAppButton({ phone, message, variant = "full", label = "Escribir por WhatsApp", className }: WhatsAppButtonProps) {
  const url = buildWhatsAppUrl(phone, message);
  const isIcon = variant !== "full";
  const iconSize = variant === "icon-sm" ? "h-6 w-6" : "h-8 w-8";
  const disabledReason = !phone?.trim() ? "El cliente no tiene teléfono" : "Teléfono sin código de país (use +56…)";

  if (!url) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className={cn("inline-flex", className)}>
            <Button
              type="button"
              disabled
              variant="outline"
              size={isIcon ? "icon" : "sm"}
              aria-label={`${label} (no disponible)`}
              className={cn("gap-2 pointer-events-none", isIcon && iconSize)}
            >
              <WhatsAppIcon className="w-4 h-4" />
              {!isIcon && label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  const button = (
    <Button
      asChild
      size={isIcon ? "icon" : "sm"}
      className={cn(BRAND, "gap-2 shadow-sm", isIcon && iconSize, className)}
    >
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
        <WhatsAppIcon className="w-4 h-4" />
        {!isIcon && label}
      </a>
    </Button>
  );

  if (!isIcon) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
