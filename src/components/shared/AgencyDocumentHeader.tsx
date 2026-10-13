import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { AgencyInfo } from "@/hooks/useAgencyInfo";
import { agencyDisplayName } from "@/lib/agency-name";

/**
 * Bloque de la agencia en el encabezado de cotización y voucher. Solo muestra lo que está
 * configurado: un dato vacío no se imprime (antes salían una dirección y un teléfono de relleno).
 */
export function AgencyDocumentHeader({ agency }: { agency: AgencyInfo | null }) {
  const rows = [
    { key: "address", icon: MapPin, value: agency?.address },
    { key: "phone", icon: Phone, value: agency?.phone },
    { key: "email", icon: Mail, value: agency?.email },
    { key: "website", icon: Globe, value: agency?.website },
  ].filter((r) => r.value);

  return (
    <div className="agency-info">
      <h1 className="text-3xl font-extrabold text-[#0F1E3C] tracking-tighter">{agencyDisplayName(agency)}</h1>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Agencia de Viajes & Turismo</p>
      {agency?.rut && <p className="mt-1 text-[10px] text-slate-500">RUT: {agency.rut}</p>}
      {rows.length > 0 && (
        <div className="mt-4 space-y-1">
          {rows.map(({ key, icon: Icon, value }) => (
            <div key={key} className="flex items-center gap-2 text-[10px] text-slate-500">
              <Icon className="w-3 h-3 text-[#C9A84C]" /> {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
