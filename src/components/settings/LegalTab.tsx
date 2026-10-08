import React, { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SystemConfig } from "@/lib/api";
import { Save, Scale, ExternalLink, FileDown, RotateCcw } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { TermsOfServiceBody } from "@/pages/legal/TermsOfService";
import { PrivacyPolicyBody } from "@/pages/legal/PrivacyPolicy";

interface LegalTabProps {
  config: any;
  configId: string | undefined;
}

type DocDef = {
  field: "termsOfServiceHtml" | "privacyPolicyHtml";
  updatedField: "termsOfServiceUpdatedAt" | "privacyPolicyUpdatedAt";
  title: string;
  path: string;
  Body: React.ComponentType;
};

const DOCS: DocDef[] = [
  { field: "termsOfServiceHtml", updatedField: "termsOfServiceUpdatedAt", title: "Términos de Servicio", path: "/legal/terminos-de-servicio", Body: TermsOfServiceBody },
  { field: "privacyPolicyHtml", updatedField: "privacyPolicyUpdatedAt", title: "Política de Privacidad", path: "/legal/politica-de-privacidad", Body: PrivacyPolicyBody },
];

function LegalDocumentEditor({ doc, config }: { doc: DocDef; config: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const saved: string = config?.[doc.field] ?? "";
  const [html, setHtml] = useState(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => setHtml(saved), [saved]);

  const updatedAt: string | undefined = config?.[doc.updatedField];
  const dirty = html !== saved;

  const save = async (value: string, message: string) => {
    setSaving(true);
    try {
      await SystemConfig.update(config?.id ?? "", { [doc.field]: value });
      toast({ title: message });
      queryClient.invalidateQueries({ queryKey: ["systemConfig"] });
      queryClient.invalidateQueries({ queryKey: ["publicLegal"] });
    } catch (error) {
      console.error("Error saving legal document", error);
      toast({ variant: "destructive", title: "Error al guardar", description: "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  const loadDefault = () => {
    if (html.trim() && !window.confirm("Esto reemplaza el texto del editor por el texto base. ¿Continuar?")) return;
    setHtml(renderToStaticMarkup(<doc.Body />));
  };

  const restoreDefault = async () => {
    if (!window.confirm("Se eliminará el texto publicado y las páginas volverán a mostrar el texto base (borrador). ¿Continuar?")) return;
    await save("", "Texto restaurado al valor por defecto");
  };

  return (
    <Card className="border-navy/10 shadow-lg">
      <CardHeader className="bg-navy/[0.02] border-b border-navy/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-xl font-playfair">{doc.title}</CardTitle>
              <CardDescription>
                {saved
                  ? `Publicado${updatedAt ? ` · actualizado el ${new Date(updatedAt).toLocaleDateString("es-CL")}` : ""}`
                  : "Sin texto propio: se muestra el texto base marcado como borrador."}
              </CardDescription>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={doc.path} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver página pública
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <RichTextEditor value={html} onChange={setHtml} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={loadDefault}>
              <FileDown className="w-4 h-4 mr-2" />
              Cargar texto base
            </Button>
            {saved && (
              <Button type="button" variant="ghost" size="sm" onClick={restoreDefault} disabled={saving}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar por defecto
              </Button>
            )}
          </div>
          <Button type="button" onClick={() => save(html, "Documento publicado")} disabled={saving || !dirty}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando…" : "Guardar y publicar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LegalTab({ config }: LegalTabProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Estos textos se muestran en las páginas públicas enlazadas desde el inicio de sesión. Al guardar, quedan
        publicados de inmediato y se quita el aviso de borrador. Si el editor se deja vacío, vuelve el texto base.
      </p>
      {DOCS.map((doc) => (
        <LegalDocumentEditor key={doc.field} doc={doc} config={config} />
      ))}
    </div>
  );
}
