import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface LegalDocumentLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Layout compartido para los documentos legales (Términos de Servicio,
 * Política de Privacidad). Es una ruta pública (fuera de ProtectedRoute):
 * cualquiera con el link puede leerlos, logueado o no.
 */
export function LegalDocumentLayout({ title, lastUpdated, children }: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-navy hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">AdeTravel</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Borrador — pendiente de revisión legal</p>
            <p className="mt-1">
              Este documento es un punto de partida redactado para acelerar el trabajo de un abogado, no un
              texto legal validado. No debe publicarse ni usarse frente a clientes o agencias hasta que un
              abogado (idealmente con experiencia en protección de datos en la(s) jurisdicción(es) donde
              opera AdeTravel) lo revise, ajuste y apruebe.
            </p>
          </div>
        </div>

        <h1 className="font-playfair text-3xl font-bold text-navy mb-2">{title}</h1>
        <p className="text-xs text-muted-foreground mb-8">Última actualización: {lastUpdated}</p>

        <div className="prose prose-slate prose-headings:font-playfair prose-headings:text-navy prose-h2:text-xl prose-h2:mt-8 prose-h3:text-base prose-a:text-primary max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}
