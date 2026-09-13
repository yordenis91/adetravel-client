import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Compass className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-playfair text-5xl font-bold mb-2">404</h1>
        <p className="text-lg font-semibold mb-2">Página no encontrada</p>
        <p className="text-sm text-slate-400 mb-8">
          La página que buscas no existe o fue movida. Verifica el enlace o vuelve al inicio.
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-navy font-bold">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
