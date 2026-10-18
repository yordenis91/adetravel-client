import React, { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, getErrorMessage } from "@/lib/api";
import { downloadClientTemplate, ImportFileError, MAX_IMPORT_ROWS, readClientFile, type ParsedImport } from "@/lib/clientImport";

type RowStatus = "valid" | "invalid" | "duplicate";
interface ImportSummary {
  dryRun: boolean;
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  rows: { row: number; status: RowStatus; label: string; reasons: string[] }[];
}

interface ImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama tras guardar clientes, para refrescar la lista. */
  onImported: () => void;
}

/** El API responde "campo: mensaje" con el nombre interno del campo; aquí se muestra en español. */
const FIELD_LABELS: Record<string, string> = {
  firstName: "Nombre", lastName: "Apellido", email: "Email", additionalEmails: "Correos adicionales", phone: "Teléfono",
  rut: "RUT", passportNumber: "Pasaporte", birthDate: "Fecha de nacimiento", nationality: "Nacionalidad", address: "Dirección",
  referralSource: "Fuente", bankEmail: "Email bancario",
};
const friendlyReason = (reason: string) => reason.replace(/^(\w+): /, (_, field: string) => `${FIELD_LABELS[field] ?? field}: `);

const STATUS_STYLE: Record<RowStatus, { label: string; className: string }> = {
  valid: { label: "Nuevo", className: "bg-emerald-50 text-emerald-700" },
  duplicate: { label: "Duplicado", className: "bg-amber-50 text-amber-700" },
  invalid: { label: "Con errores", className: "bg-red-50 text-red-700" },
};

/**
 * Importación de clientes desde Excel/CSV en dos pasos: el archivo se lee en el navegador, el API valida y
 * marca duplicados SIN guardar (vista previa) y solo al confirmar se guardan las filas nuevas. Nunca se
 * modifica un cliente existente (ADR 019 del API).
 */
export function ImportClientsDialog({ open, onOpenChange, onImported }: ImportClientsDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const resetState = () => {
    setParsed(null); setFileName(""); setPreview(null); setResult(null); setError(null); setReading(false);
  };
  /** Vacía el selector para poder elegir de nuevo el mismo archivo. Solo DESPUÉS de leerlo: al vaciarlo, el navegador invalida el File. */
  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const send = useMutation({
    mutationFn: async ({ rows, dryRun }: { rows: Record<string, unknown>[]; dryRun: boolean }) => {
      const res = (await api.post("/clients/import", { rows, dryRun })) as { data: ImportSummary };
      return res.data;
    },
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    resetState();
    setFileName(file.name);
    setReading(true);
    try {
      const table = await readClientFile(file);
      setParsed(table);
      setPreview(await send.mutateAsync({ rows: table.rows.map((r) => r.data), dryRun: true }));
    } catch (e) {
      setParsed(null);
      setError(e instanceof ImportFileError ? e.message : getErrorMessage(e, "No se pudo procesar el archivo."));
    } finally {
      setReading(false);
      clearInput();
    }
  };

  const confirm = async () => {
    if (!parsed) return;
    setError(null);
    try {
      const summary = await send.mutateAsync({ rows: parsed.rows.map((r) => r.data), dryRun: false });
      setResult(summary);
      if (summary.valid > 0) onImported();
    } catch (e) {
      setError(`${getErrorMessage(e, "No se pudo completar la importación.")} Puedes reintentar con seguridad: los clientes que ya se hayan guardado se omitirán como duplicados.`);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (send.isPending) return; // no cerrar a mitad de un guardado
    if (!next) { resetState(); clearInput(); }
    onOpenChange(next);
  };

  const busy = reading || send.isPending;
  const warningsByRow = new Map((parsed?.rows ?? []).map((r, i) => [i + 1, r.warnings]));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-navy">Importar clientes</DialogTitle>
          <DialogDescription>
            Sube tu cartera desde Excel (.xlsx) o CSV. Primero verás una vista previa; no se guarda nada hasta que confirmes. Los clientes que ya existen (mismo RUT o correo) se omiten y nunca se modifican.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2" role="status">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">{result.valid === 1 ? "Se importó 1 cliente" : `Se importaron ${result.valid} clientes`}</p>
            </div>
            {(result.duplicates > 0 || result.invalid > 0) && (
              <p className="text-sm text-muted-foreground">
                Omitidos: {result.duplicates} duplicados y {result.invalid} filas con errores.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                aria-label="Archivo de clientes"
                onChange={(e) => void handleFile(e.target.files?.[0])}
                disabled={busy}
              />
              <Button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="gap-2 text-xs font-bold uppercase tracking-wider">
                <Upload className="h-4 w-4" /> {parsed ? "Elegir otro archivo" : "Elegir archivo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => void downloadClientTemplate()} className="gap-2 text-xs font-bold uppercase tracking-wider">
                <FileSpreadsheet className="h-4 w-4" /> Descargar plantilla
              </Button>
              {fileName && <span className="truncate text-sm text-muted-foreground">{fileName}</span>}
            </div>

            {!parsed && !reading && !error && (
              <p className="text-xs text-muted-foreground">
                La primera fila debe tener los encabezados. Obligatorias: <strong>Nombre</strong> y <strong>Apellido</strong> (o "Nombre completo"). Opcionales: Email, Correos adicionales, Teléfono, RUT, Pasaporte, Fecha de nacimiento, Nacionalidad, Dirección y Fuente. Máximo {MAX_IMPORT_ROWS} filas por archivo.
              </p>
            )}

            {reading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" /> Leyendo y validando el archivo…
              </p>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
              </div>
            )}

            {preview && parsed && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs font-bold" aria-label="Resumen de la vista previa">
                  <span className={`rounded-full px-3 py-1 ${STATUS_STYLE.valid.className}`}>{preview.valid} nuevos</span>
                  <span className={`rounded-full px-3 py-1 ${STATUS_STYLE.duplicate.className}`}>{preview.duplicates} duplicados</span>
                  <span className={`rounded-full px-3 py-1 ${STATUS_STYLE.invalid.className}`}>{preview.invalid} con errores</span>
                </div>
                {parsed.ignoredHeaders.length > 0 && (
                  <p className="flex items-start gap-2 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Columnas no reconocidas (se ignoraron): {parsed.ignoredHeaders.join(", ")}.
                  </p>
                )}
                <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100" aria-label="Filas del archivo">
                  {preview.rows.map((r) => {
                    const warnings = warningsByRow.get(r.row) ?? [];
                    return (
                      <li key={r.row} className="flex items-start gap-3 px-3 py-2 text-sm">
                        <span className="w-10 shrink-0 text-xs text-muted-foreground">#{r.row + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-navy">{r.label}</p>
                          {[...r.reasons.map(friendlyReason), ...warnings].map((reason) => (
                            <p key={reason} className="text-xs text-muted-foreground">{reason}</p>
                          ))}
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status].className}`}>
                          {STATUS_STYLE[r.status].label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {result ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={send.isPending}>Cancelar</Button>
              <Button type="button" onClick={() => void confirm()} disabled={busy || !preview || preview.valid === 0}>
                {send.isPending && !reading ? "Importando…" : preview ? `Importar ${preview.valid} ${preview.valid === 1 ? "cliente" : "clientes"}` : "Importar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
