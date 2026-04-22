import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Mail, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  Copy,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Calculator,
  CheckCircle,
  Ticket,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TEMPLATE_TYPES } from "@/lib/templateVariables";
import TemplateFormDialog from "./TemplateFormDialog";

import { cn } from "@/lib/utils";

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: () => api.get('/email-templates?sortBy=-created_at'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      api.patch(`/email-templates/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al actualizar estado")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/email-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Plantilla eliminada");
      setTemplateToDelete(null);
    },
    onError: () => toast.error("Error al eliminar la plantilla")
  });

  const filteredTemplates = templates?.filter((t: any) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const getBadgeColor = (type: string) => {
    const found = TEMPLATE_TYPES.find(t => t.value === type);
    switch (found?.color) {
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'purple': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'QUOTATION_SENT': return Calculator;
      case 'PAYMENT_CONFIRMED': return CheckCircle;
      case 'VOUCHER_ISSUED': return Ticket;
      case 'REQUEST_CREATED': return FileText;
      default: return Mail;
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Cargando plantillas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-navy flex items-center gap-3">
            <Mail className="w-10 h-10 text-primary" />
            Plantillas de Email
          </h1>
          <p className="text-muted-foreground mt-1">
            Diseña y gestiona los correos automáticos que el sistema envía a tus clientes.
          </p>
        </div>
        <Button 
          onClick={handleNew}
          className="bg-navy hover:bg-navy-light text-white flex items-center gap-2 h-12 px-6 rounded-xl shadow-lg transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Nueva Plantilla
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o asunto..." 
            className="pl-10 h-11 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={filterType} onValueChange={setFilterType} className="w-auto">
          <TabsList className="bg-navy/5 p-1 h-11">
            <TabsTrigger value="all" className="px-4">Todas</TabsTrigger>
            {TEMPLATE_TYPES.map(type => (
              <TabsTrigger key={type.value} value={type.value} className="px-4">
                {type.label.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {!filteredTemplates || filteredTemplates.length === 0 ? (
        <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl text-navy">No hay plantillas</CardTitle>
          <CardDescription className="mt-2 max-w-xs mx-auto">
            Aún no has creado ninguna plantilla de correo. Comienza creando una para automatizar tus comunicaciones.
          </CardDescription>
          <Button onClick={handleNew} variant="outline" className="mt-8 border-navy text-navy hover:bg-navy/5">
            Crear mi primera plantilla
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template: any) => {
            const Icon = getIcon(template.type);
            return (
              <Card key={template.id} className="group hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden border-navy/10 flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      getBadgeColor(template.type)
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Activa</span>
                      <Switch 
                        checked={template.isActive} 
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: template.id, isActive: checked })}
                        disabled={toggleActiveMutation.isPending}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-playfair group-hover:text-navy transition-colors">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] mt-1">
                    {template.description || "Sin descripción adicional."}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Asunto</label>
                    <div className="text-sm font-medium border rounded-lg p-2 bg-navy/5 italic">
                      {template.subject}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn("text-[10px] border", getBadgeColor(template.type))}>
                      {TEMPLATE_TYPES.find(t => t.value === template.type)?.label}
                    </Badge>
                    {template.isActive ? (
                      <Badge className="bg-emerald-500 text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> En uso
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Pausada
                      </Badge>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-navy/5 p-4 border-t gap-2 mt-auto">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-9 rounded-lg hover:bg-white hover:text-navy"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 rounded-lg hover:bg-white hover:text-destructive"
                    onClick={() => setTemplateToDelete(template)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <TemplateFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        template={selectedTemplate}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["emailTemplates"] })}
      />

      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair font-bold text-navy">¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la plantilla <span className="font-bold text-navy">"{templateToDelete?.name}"</span>. 
              Los correos automáticos configurados con esta plantilla dejarán de enviarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(templateToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Plantilla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}