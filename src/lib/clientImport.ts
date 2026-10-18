/**
 * Lectura de la cartera de clientes desde Excel (.xlsx) o CSV para importarla.
 *
 * El navegador lee el archivo y envía filas ya convertidas a POST /clients/import; el API valida y detecta
 * duplicados (ADR 019 del API). Aquí solo se interpreta la hoja: qué columna es cuál (los encabezados varían
 * entre agencias: "Teléfono", "Fono", "Celular"…), fechas de Excel y valores de "fuente".
 */

/** Mismo tope que el API (MAX_IMPORT_ROWS). */
export const MAX_IMPORT_ROWS = 500;
/** Tope de tamaño del archivo: una cartera de 500 clientes pesa unos pocos KB; esto evita bloquear el navegador. */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export type ClientField =
  | "firstName" | "lastName" | "fullName" | "email" | "additionalEmails" | "phone" | "rut" | "passportNumber"
  | "passportExpiry" | "passportIssueDate" | "passportCountry" | "birthDate" | "nationality" | "address"
  | "restrictions" | "referralSource";

/** Encabezados aceptados por campo, ya normalizados (minúsculas, sin tildes ni signos). */
const HEADER_ALIASES: Record<ClientField, string[]> = {
  firstName: ["nombre", "nombres", "first name", "firstname", "primer nombre"],
  lastName: ["apellido", "apellidos", "last name", "lastname"],
  fullName: ["nombre completo", "cliente", "nombre y apellido", "nombre y apellidos", "full name", "titular"],
  email: ["email", "e mail", "correo", "correo electronico", "mail", "email principal", "correo principal"],
  additionalEmails: ["correos adicionales", "otros correos", "emails adicionales", "correos extra", "additional emails"],
  phone: ["telefono", "tel", "fono", "celular", "movil", "whatsapp", "phone", "telefono celular"],
  rut: ["rut", "run", "rut cliente"],
  passportNumber: ["pasaporte", "numero de pasaporte", "n pasaporte", "passport", "nº pasaporte", "numero pasaporte"],
  passportExpiry: ["vencimiento pasaporte", "vence pasaporte", "fecha de vencimiento del pasaporte", "passport expiry", "expiracion pasaporte"],
  passportIssueDate: ["emision pasaporte", "fecha de emision del pasaporte", "passport issue date"],
  passportCountry: ["pais pasaporte", "pais del pasaporte", "pais emisor"],
  birthDate: ["fecha de nacimiento", "nacimiento", "cumpleanos", "fecha nacimiento", "birth date", "birthday", "fnac"],
  nationality: ["nacionalidad", "nationality"],
  address: ["direccion", "domicilio", "address"],
  restrictions: ["restricciones", "observaciones", "notas", "comentarios", "restricciones alimentarias"],
  referralSource: ["fuente", "origen", "como nos conocio", "canal", "referido por", "referral source", "fuente de referencia"],
};

/** Minúsculas, sin tildes ni puntuación y con espacios simples: "Teléfono (móvil)" → "telefono movil". */
export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9º ]+/g, " ").replace(/\s+/g, " ").trim();
}

const aliasToField = new Map<string, ClientField>();
for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [ClientField, string[]][]) {
  for (const alias of aliases) aliasToField.set(normalizeHeader(alias), field);
}

/** Campo del cliente al que corresponde un encabezado, o null si no se reconoce. */
export const fieldForHeader = (header: unknown): ClientField | null => aliasToField.get(normalizeHeader(header)) ?? null;

const REFERRAL_VALUES: [RegExp, string][] = [
  [/consulado/, "CONSULATE"],
  [/refer|recomend|amig|familia/, "REFERRAL"],
  [/web|sitio|pagina|internet|google|instagram|facebook|redes/, "WEBSITE"],
  [/otro|directo|other/, "OTHER"],
];

/** "Referido", "Sitio web"… → valor del API; null si no se reconoce. */
export function normalizeReferralSource(value: string): string | null {
  const v = normalizeHeader(value);
  if (!v) return null;
  if (["CONSULATE", "REFERRAL", "WEBSITE", "OTHER"].includes(value.trim().toUpperCase())) return value.trim().toUpperCase();
  return REFERRAL_VALUES.find(([re]) => re.test(v))?.[1] ?? null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const isValidDate = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/**
 * Fecha a "YYYY-MM-DD". Acepta ISO, "dd/mm/aaaa" y "dd-mm-aaaa" (formato de Chile: día primero).
 * Devuelve null si no se puede interpretar o no existe ("31/02/2020").
 */
export function normalizeDate(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(v);
  if (m) return isValidDate(+m[1], +m[2], +m[3]) ? `${m[1]}-${pad(+m[2])}-${pad(+m[3])}` : null;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(v);
  if (m) {
    const year = m[3].length === 2 ? (+m[3] > 30 ? 1900 + +m[3] : 2000 + +m[3]) : +m[3];
    return isValidDate(year, +m[2], +m[1]) ? `${year}-${pad(+m[2])}-${pad(+m[1])}` : null;
  }
  return null;
}

/** Correos separados por coma, punto y coma, salto de línea o espacio. */
export function splitEmails(value: string): string[] {
  return value.split(/[,;\n\s]+/).map((e) => e.trim()).filter(Boolean);
}

export interface ImportRow {
  /** Datos listos para enviar al API. */
  data: Record<string, unknown>;
  /** Avisos de la lectura (fecha ilegible, fuente desconocida…): la fila se envía sin ese dato. */
  warnings: string[];
  /** Número de fila en la hoja (la primera de datos es la 2, tras el encabezado), para mostrarlo al usuario. */
  sheetRow: number;
}

export interface ParsedImport {
  rows: ImportRow[];
  /** Encabezados que no se reconocieron y se ignoraron. */
  ignoredHeaders: string[];
  /** Campos reconocidos en el archivo. */
  recognizedFields: ClientField[];
}

export class ImportFileError extends Error {}

const DATE_FIELDS: ClientField[] = ["passportExpiry", "passportIssueDate", "birthDate"];

/**
 * Convierte una tabla (primera fila = encabezados) en filas para el API.
 * Falla (ImportFileError) si el archivo no sirve: sin datos, sin columnas de nombre o con demasiadas filas.
 */
export function mapTable(table: string[][]): ParsedImport {
  const nonEmpty = table.map((r) => r.map((c) => (c ?? "").trim())).filter((r, i) => i === 0 || r.some(Boolean));
  if (nonEmpty.length === 0 || nonEmpty[0].every((c) => !c)) throw new ImportFileError("El archivo está vacío.");
  const [header, ...body] = nonEmpty;

  const columns = header.map((h) => fieldForHeader(h));
  const recognized = [...new Set(columns.filter((c): c is ClientField => c !== null))];
  const ignoredHeaders = header.filter((h, i) => h && columns[i] === null);

  const hasName = recognized.includes("fullName") || (recognized.includes("firstName") && recognized.includes("lastName"));
  if (!hasName) {
    throw new ImportFileError(
      'No encontré las columnas de nombre. La primera fila debe tener "Nombre" y "Apellido" (o "Nombre completo"). Descarga la plantilla para ver el formato.'
    );
  }
  if (body.length === 0) throw new ImportFileError("El archivo tiene encabezados pero ninguna fila de datos.");
  if (body.length > MAX_IMPORT_ROWS) {
    throw new ImportFileError(`El archivo tiene ${body.length} filas y el máximo por importación es ${MAX_IMPORT_ROWS}. Divídelo en varios archivos.`);
  }

  const rows = body.map((cells, i): ImportRow => {
    const data: Record<string, unknown> = {};
    const warnings: string[] = [];
    columns.forEach((field, col) => {
      const value = (cells[col] ?? "").trim();
      if (!field || !value) return;
      if (DATE_FIELDS.includes(field)) {
        const iso = normalizeDate(value);
        if (iso) data[field] = iso;
        else warnings.push(`Fecha no reconocida en "${header[col]}" ("${value}"): se omitió`);
      } else if (field === "referralSource") {
        const source = normalizeReferralSource(value);
        if (source) data.referralSource = source;
        else warnings.push(`Fuente no reconocida ("${value}"): se omitió`);
      } else if (field === "additionalEmails") {
        data.additionalEmails = [...((data.additionalEmails as string[]) ?? []), ...splitEmails(value)];
      } else if (field === "fullName") {
        const [first, ...rest] = value.split(/\s+/);
        // Si hay columnas separadas de nombre y apellido, esas mandan.
        if (!data.firstName) data.firstName = first;
        if (!data.lastName && rest.length) data.lastName = rest.join(" ");
      } else {
        data[field] = value;
      }
    });
    return { data, warnings, sheetRow: i + 2 };
  });

  return { rows, ignoredHeaders, recognizedFields: recognized };
}

/** CSV con comillas ("a,b", "" como comilla) y separador coma, punto y coma o tabulador (el de Excel en español es ;). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length] as const);
  const delimiter = counts.reduce((best, c) => (c[1] > best[1] ? c : best))[0];

  const table: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      table.push(row); row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); table.push(row); }
  return table;
}

/** Texto de una celda de exceljs: fechas, texto con formato, fórmulas e hipervínculos. */
function cellToString(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  if (typeof value === "object") {
    const v = value as { richText?: { text: string }[]; text?: unknown; result?: unknown; hyperlink?: string };
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.result !== undefined) return cellToString(v.result);
    if (v.text !== undefined) return cellToString(v.text);
    return "";
  }
  return String(value);
}

/** Lee un .xlsx o .csv del navegador y devuelve las filas listas para la vista previa. */
export async function readClientFile(file: File): Promise<ParsedImport> {
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new ImportFileError("El archivo pesa más de 5 MB. Para importar clientes basta un archivo pequeño: revisa que no tenga imágenes.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) return mapTable(parseCsv(await file.text()));
  if (!name.endsWith(".xlsx")) throw new ImportFileError("Formato no admitido. Usa un archivo .xlsx (Excel) o .csv. Si es .xls, ábrelo en Excel y guárdalo como .xlsx.");

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch (e) {
    throw new ImportFileError("No pude leer el archivo: parece dañado o no es un .xlsx válido.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ImportFileError("El archivo no tiene hojas.");
  const table: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c++) cells.push(cellToString(row.getCell(c).value));
    table.push(cells);
  });
  return mapTable(table);
}

/** Descarga una plantilla .xlsx con los encabezados esperados y una fila de ejemplo. */
export async function downloadClientTemplate(): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ADE Travel";
  const sheet = workbook.addWorksheet("Clientes");
  const columns = ["Nombre", "Apellido", "Email", "Correos adicionales", "Teléfono", "RUT", "Pasaporte", "Vencimiento pasaporte", "Fecha de nacimiento", "Nacionalidad", "Dirección", "Fuente"];
  sheet.addRow(columns);
  sheet.addRow(["María", "González Pérez", "maria@ejemplo.cl", "contabilidad@ejemplo.cl; pareja@ejemplo.cl", "+56 9 1234 5678", "12.345.678-5", "P1234567", "31/12/2030", "15/03/1985", "Chilena", "Providencia, Santiago", "Referido"]);
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1E3C" } };
  sheet.columns.forEach((col) => { col.width = 24; });
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-clientes.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
