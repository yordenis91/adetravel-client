// Contrato con el API: src/contracts/api-contract.json es una copia del contrato que genera el API
// (adetravel-api/contracts/api-contract.json). Aquí se comprueba que:
//   1. las constantes que el cliente duplica (estados del flujo, tipos de servicio, permisos) coinciden;
//   2. los campos que los componentes leen de cada entidad existen en las respuestas del API;
//   3. la copia no se ha quedado atrás respecto al contrato del API en main.
// Si algo falla por (3): npm run contract:sync, revisar el diff y ajustar lo que dependa de él.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import contract from "../api-contract.json";
import { WORKFLOW_STATUSES, VALID_TRANSITIONS, STATUS_LABELS, STATUS_COLORS, STATUS_PHASES } from "@/lib/workflow-status";
import { SERVICE_TYPES } from "@/types/service";

type Shape = string | { [key: string]: Shape } | { $array: Shape };
const enums = contract.enums as Record<string, unknown>;
const responses = contract.responses as Record<string, { status: number; body: { data?: Shape } }>;

// Todo el código del cliente como texto, para buscar usos. Se lee con fs y NO con import.meta.glob("?raw"):
// importar los archivos por el sistema de módulos de Vite hace que la cobertura los dé por cargados y deje
// de contar los que no tienen pruebas, lo que inflaba la cobertura del cliente del 27 % al 61 %.
const SRC_DIR = path.resolve(process.cwd(), "src");
const productionSources: [string, string][] = (readdirSync(SRC_DIR, { recursive: true }) as string[])
  .map((rel) => rel.split(path.sep).join("/"))
  .filter((rel) => /\.(ts|tsx)$/.test(rel) && !/__tests__|\.test\.|^contracts\//.test(rel))
  .map((rel): [string, string] => [`/src/${rel}`, readFileSync(path.join(SRC_DIR, rel), "utf8")]);

describe("constantes duplicadas del cliente frente al contrato del API", () => {
  it("los 17 estados del flujo coinciden, en el mismo orden", () => {
    expect([...WORKFLOW_STATUSES]).toEqual(enums.workflowStatuses);
  });

  it("las transiciones válidas entre estados coinciden", () => {
    expect(VALID_TRANSITIONS).toEqual(enums.validTransitions);
  });

  it("cada estado tiene etiqueta y color, y pertenece a una fase", () => {
    const statuses = enums.workflowStatuses as string[];
    expect(Object.keys(STATUS_LABELS).sort()).toEqual([...statuses].sort());
    expect(Object.keys(STATUS_COLORS).sort()).toEqual([...statuses].sort());
    const inPhases = new Set(STATUS_PHASES.flatMap((p) => p.statuses as string[]));
    for (const s of statuses) if (s !== "CANCELADA") expect(inPhases.has(s), `${s} no está en ninguna fase`).toBe(true);
  });

  it("los tipos de servicio coinciden", () => {
    expect([...SERVICE_TYPES].sort()).toEqual([...(enums.serviceTypes as string[])].sort());
  });

  it("todos los permisos que nombra el cliente existen en el API", () => {
    const known = new Set(enums.permissions as string[]);
    const verbs = new Set([...known].map((p) => p.split("_")[0]));
    const used = new Map<string, string>();
    for (const [file, text] of productionSources) {
      for (const m of text.matchAll(/["'`]([A-Z]+)_([A-Z_]+)["'`]/g)) {
        const name = `${m[1]}_${m[2]}`;
        if (verbs.has(m[1]) && !known.has(name) && !/^(VIEW|MANAGE|DELETE|CREATE)_$/.test(name)) used.set(name, file);
      }
    }
    // Los estados del flujo y otros literales con el mismo formato no son permisos.
    for (const status of enums.workflowStatuses as string[]) used.delete(status);
    expect([...used.entries()]).toEqual([]);
  });
});

// Entidad → (respuestas del API que la describen, carpetas de componentes que la usan, nombre de la variable).
const ENTITIES = [
  { variable: "client", labels: ["GET /clients", "GET /clients/:id"], dirs: ["clients"] },
  { variable: "request", labels: ["GET /requests", "GET /requests/:id"], dirs: ["requests"] },
  { variable: "quotation", labels: ["GET /quotations", "GET /quotations/:id"], dirs: ["quotations"] },
  { variable: "payment", labels: ["GET /payments"], dirs: ["payments"] },
  { variable: "voucher", labels: ["GET /vouchers"], dirs: ["vouchers"] },
  { variable: "provider", labels: ["GET /providers"], dirs: ["providers"] },
  { variable: "service", labels: ["GET /services"], dirs: ["services"] },
  { variable: "confirmation", labels: ["GET /confirmations"], dirs: ["confirmaciones"] },
  { variable: "task", labels: ["GET /tasks"], dirs: ["tasks"] },
  { variable: "log", labels: ["GET /activity-logs"], dirs: ["bitacora"] },
] as const;

/** Nombres que se leen de cualquier objeto o texto y no son campos de la entidad. */
const GENERIC = new Set(
  "map filter length find some every includes toLowerCase toUpperCase trim slice join split forEach reduce push sort toString replace startsWith endsWith localeCompare indexOf concat keys values entries flat at padStart toFixed toLocaleString toLocaleDateString".split(" ")
);

function fieldsOf(labels: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const label of labels) {
    let data = responses[label]?.body?.data as Shape | undefined;
    if (data && typeof data === "object" && "$array" in data) data = data.$array;
    if (data && typeof data === "object") Object.keys(data).forEach((k) => out.add(k));
  }
  return out;
}

describe("campos que la interfaz lee de cada entidad frente a las respuestas del API", () => {
  it.each(ENTITIES)("$variable: todo campo leído existe en la respuesta del API", ({ variable, labels, dirs }) => {
    const known = fieldsOf(labels);
    expect(known.size, `el contrato no tiene respuestas para ${labels.join(", ")}`).toBeGreaterThan(0);
    const unknown = new Map<string, Set<string>>();
    const reads = new RegExp(`\\b${variable}\\??\\.(\\w+)`, "g");
    for (const [file, text] of productionSources) {
      if (!dirs.some((d) => file.includes(`/components/${d}/`))) continue;
      for (const m of text.matchAll(reads)) {
        if (known.has(m[1]) || GENERIC.has(m[1])) continue;
        (unknown.get(m[1]) ?? unknown.set(m[1], new Set()).get(m[1])!).add(file.split("/").pop()!);
      }
    }
    expect([...unknown.entries()].map(([field, files]) => `${variable}.${field} (${[...files].join(", ")})`)).toEqual([]);
  });
});

describe("copia del contrato", () => {
  it("coincide con la del API en main", async () => {
    const url = "https://raw.githubusercontent.com/yordenis91/adetravel-api/main/contracts/api-contract.json";
    let remote: unknown;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      remote = await res.json();
    } catch (error) {
      // Sin red no se puede comparar: se avisa y se omite, para no romper el CI por un fallo ajeno.
      console.warn(`[contrato] no se pudo comprobar la sincronización con el API (${(error as Error).message}).`);
      return;
    }
    expect(
      contract,
      "La copia del contrato está desactualizada: ejecuta `npm run contract:sync`, revisa el diff y ajusta lo que dependa de él."
    ).toEqual(remote);
  });
});
