import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Users, Briefcase, FileText, CreditCard, Ticket, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Efecto Debounce (espera 400ms antes de buscar)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["global-search", debouncedTerm],
    queryFn: () => api.get(`/search?q=${debouncedTerm}`),
    enabled: debouncedTerm.length >= 2,
  });

  const results = (response as any)?.data || { clients: [], requests: [], quotations: [], payments: [], vouchers: [] };
  const hasResults = Object.values(results).some((arr: any) => arr.length > 0);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setSearchTerm("");
    navigate(path);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* 🔥 AQUÍ RESTAURAMOS TU DISEÑO EXACTO */}
      <div className="flex items-center bg-muted rounded-full px-3 py-1.5 gap-2 w-full border border-transparent focus-within:border-primary/30 transition-all">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar clientes, pagos, vouchers..." 
          className="bg-transparent border-none outline-none text-xs w-full placeholder:text-muted-foreground"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
        />
        {searchTerm && (
          <button 
            onClick={() => { setSearchTerm(""); setIsOpen(false); }}
            className="text-muted-foreground hover:text-navy shrink-0 focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Resultados Flotantes */}
      {isOpen && searchTerm.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
          {isLoading ? (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Buscando en toda la plataforma...</span>
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados para "<span className="font-bold text-navy">{searchTerm}</span>"
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh] overflow-y-auto">
              <div className="p-2 space-y-4">
                
                {/* RESULTADOS DE CLIENTES */}
                {results.clients.length > 0 && (
                  <div>
                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                      <Users className="w-3 h-3" /> Clientes
                    </h4>
                    {results.clients.map((c: any) => (
                      <button key={c.id} onClick={() => handleSelect(`/clientes/${c.id}/timeline`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50/50 transition-colors group">
                        <p className="text-sm font-bold text-navy group-hover:text-blue-700">{c.firstName} {c.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.rut || c.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* RESULTADOS DE PAGOS */}
                {results.payments.length > 0 && (
                  <div>
                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Pagos
                    </h4>
                    {results.payments.map((p: any) => (
                      <button key={p.id} onClick={() => handleSelect(`/pagos?search=${p.paymentNumber}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-colors group flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-navy group-hover:text-emerald-700">{p.paymentNumber}</p>
                          <p className="text-[10px] text-muted-foreground">${p.amount} {p.currency}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">{p.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* RESULTADOS DE SOLICITUDES */}
                {results.requests.length > 0 && (
                  <div>
                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                      <Briefcase className="w-3 h-3" /> Solicitudes
                    </h4>
                    {results.requests.map((r: any) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(`/solicitudes?view=${r.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-50/50 transition-colors group"
                      >
                        <p className="text-sm font-bold text-navy group-hover:text-sky-700">{r.requestNumber || `#${r.id}`}</p>
                        <p className="text-[10px] text-muted-foreground">{r.originCity || r.originCountry} → {r.destinationCity || r.destinationCountry} · {r.status}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* RESULTADOS DE COTIZACIONES */}
                {results.quotations.length > 0 && (
                  <div>
                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Cotizaciones
                    </h4>
                    {results.quotations.map((q: any) => (
                      <button
                        key={q.id}
                        onClick={() => handleSelect(`/cotizaciones?view=${q.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50/50 transition-colors group flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-bold text-navy group-hover:text-amber-700">{q.quotationNumber}</p>
                          <p className="text-[10px] text-muted-foreground">{q.requestId ? `Solicitud: ${q.requestId}` : ''} {q.currency ? `${q.total ? `· ${q.total} ${q.currency}` : ''}` : ''}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">{q.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* RESULTADOS DE VOUCHERS */}
                {results.vouchers.length > 0 && (
                  <div>
                    <h4 className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                      <Ticket className="w-3 h-3" /> Vouchers
                    </h4>
                    {results.vouchers.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => handleSelect(`/vouchers?view=${v.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50/50 transition-colors group flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-bold text-navy group-hover:text-emerald-700">{v.voucherNumber || v.confirmationCode}</p>
                          <p className="text-[10px] text-muted-foreground">{v.serviceName || v.serviceType} {v.destination ? `· ${v.destination}` : ''}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase">{v.status}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}