import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { TEMPLATE_TYPES, TEMPLATE_VARIABLES, renderWithSampleData } from "@/lib/templateVariables";
import { Copy, Eye, Code, Info } from "lucide-react";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  onSuccess: () => void;
}

const DEFAULT_BODY = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
  <h2 style="color: #0F1E3C; margin-bottom: 20px;">Hola {{client_name}},</h2>
  <p style="color: #333; line-height: 1.6;">Gracias por elegir <strong>ADE Travel</strong>. Aquí tienes los detalles de tu solicitud.</p>
  
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>Referencia:</strong> {{request_number}}</p>
    <p style="margin: 5px 0;"><strong>Destino:</strong> {{destination}}</p>
  </div>

  <p style="color: #333; line-height: 1.6;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #C9A84C; font-size: 12px; color: #666;">
    <p style="margin: 2px 0;"><strong>{{agency_name}}</strong></p>
    <p style="margin: 2px 0;">{{agency_email}}</p>
    <p style="margin: 2px 0;">Teléfono: {{agency_phone}}</p>
  </div>
</div>`;

export default function TemplateFormDialog({ 
  open, 
  onOpenChange, 
  template, 
  onSuccess 
}: TemplateFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "CUSTOM",
    description: "",
    subject: "",
    bodyHtml: DEFAULT_BODY,
    isActive: true
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        type: template.type || "CUSTOM",
        description: template.description || "",
        subject: template.subject || "",
        bodyHtml: template.bodyHtml || DEFAULT_BODY,
        isActive: template.isActive !== false
      });
    } else {
      setFormData({
        name: "",
        type: "CUSTOM",
        description: "",
        subject: "",
        bodyHtml: DEFAULT_BODY,
        isActive: true
      });
    }
  }, [template, open]);

  const handleCopyVariable = (varName: string) => {
    const textToCopy = `{{${varName}}}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success(`Copiado: ${textToCopy}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.bodyHtml) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      if (template?.id) {
        await api.patch(`/email-templates/${template.id}`, formData);
        toast.success("Plantilla actualizada correctamente");
      } else {
        await api.post('/email-templates', formData);
        toast.success("Plantilla creada correctamente");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template", error);
      toast.error("Error al guardar la plantilla");
    } finally {
      setLoading(false);
    }
  };

  const variables = TEMPLATE_VARIABLES[formData.type] || TEMPLATE_VARIABLES.CUSTOM;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-2xl font-playfair font-bold text-navy">
              {template ? "Editar Plantilla" : "Nueva Plantilla"}
            </DialogTitle>
            <DialogDescription>
              Configura el contenido y diseño del correo electrónico automático.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex">
            {/* Editor Area */}
            <div className="flex-1 p-6 overflow-y-auto border-r space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-navy font-semibold">Nombre de la Plantilla *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Confirmación de Pago"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-navy font-semibold">Tipo de Evento</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={val => setFormData({...formData, type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-navy font-semibold">Descripción Corta</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Explica cuándo se envía este correo..."
                  className="h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-navy font-semibold">Asunto del Correo *</Label>
                <Input 
                  id="subject" 
                  value={formData.subject} 
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="Ej: Confirmación de tu viaje a {{destination}}"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Puedes usar variables como {"{{client_name}}"} en el asunto.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-navy font-semibold">Cuerpo del Email (HTML)</Label>
                <Tabs defaultValue="editor" className="w-full">
                  <TabsList className="bg-navy/5 mb-2">
                    <TabsTrigger value="editor" className="flex items-center gap-2">
                      <Code className="w-4 h-4" /> Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Vista Previa
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="editor" className="m-0">
                    <Textarea 
                      value={formData.bodyHtml} 
                      onChange={e => setFormData({...formData, bodyHtml: e.target.value})}
                      className="font-mono text-sm min-h-[400px] border-navy/20 focus-visible:ring-navy"
                      placeholder="Escribe el código HTML aquí..."
                    />
                  </TabsContent>
                  
                  <TabsContent value="preview" className="m-0">
                    <div className="border rounded-lg bg-white min-h-[400px] overflow-auto p-4 flex justify-center">
                      <div 
                        className="w-full max-w-[600px] bg-white border shadow-sm rounded p-4"
                        dangerouslySetInnerHTML={{ __html: renderWithSampleData(formData.bodyHtml, formData.type) }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Variables Panel */}
            <div className="w-80 bg-navy/5 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-navy" />
                <h3 className="font-bold text-navy">Variables Disponibles</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Haz clic en una variable para copiarla e insertarla en tu diseño.
              </p>
              
              <ScrollArea className="flex-1 -mr-2 pr-2">
                <div className="space-y-3">
                  {variables.map((v) => (
                    <div 
                      key={v.name}
                      onClick={() => handleCopyVariable(v.name)}
                      className="p-3 bg-white border border-navy/10 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-[11px] font-bold text-navy bg-navy/5 px-2 py-0.5 rounded">
                          {"{{"}{v.name}{"}}"}
                        </code>
                        <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {v.description}
                      </p>
                      <p className="text-[9px] italic text-primary mt-1 opacity-70">
                        Ej: {v.sample}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-navy/5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-navy hover:bg-navy-light text-white font-bold"
              disabled={loading}
            >
              {loading ? "Guardando..." : (template ? "Actualizar Plantilla" : "Crear Plantilla")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}