import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportToCsv } from "@/lib/exportCsv";
import { exportToExcel } from "@/lib/exportExcel";
import { useToast } from "@/hooks/use-toast";

interface ExportMenuProps {
  filename: string;
  data: Record<string, any>[];
  columns?: { key: string; label: string }[];
}

/** Botón "Exportar" con CSV real (síncrono) y Excel real (.xlsx, vía exceljs). */
export function ExportMenu({ filename, data, columns }: ExportMenuProps) {
  const { toast } = useToast();

  const handleExcel = async () => {
    try {
      await exportToExcel(filename, data, columns);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error al exportar Excel", description: err?.message });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white text-xs font-bold uppercase tracking-wider">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCsv(filename, data, columns)} className="gap-2 text-xs">
          <FileText className="w-4 h-4" /> Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExcel} className="gap-2 text-xs">
          <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
