/**
 * Recuperación tras un despliegue nuevo.
 *
 * Los módulos de cada pantalla se cargan por demanda con nombres con hash
 * (assets/Dashboard-<hash>.js). Si el usuario tiene abierta una versión vieja
 * del portal (o el navegador guardó un index.html antiguo) y el servidor ya no
 * tiene esos archivos, la carga falla ("error loading dynamically imported
 * module", o NS_ERROR_CORRUPTED_CONTENT en Firefox si el servidor devolvió HTML)
 * y la pantalla se queda rota. Recargar baja el index.html nuevo y lo arregla.
 */
const RELOAD_KEY = "ade_chunk_reload_at";
const COOLDOWN_MS = 30_000;

const CHUNK_ERROR_PATTERNS = [
  /error loading dynamically imported module/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /expected a javascript.*module script/i,
  /NS_ERROR_CORRUPTED_CONTENT/i,
  // React.lazy sobre un módulo que no llegó: React lee `.default` de un resultado vacío.
  // Firefox: "can't access property "default", e._result is undefined".
  // Chrome/Safari: "Cannot read properties of undefined (reading 'default')".
  // Se exige `default` a propósito: un "Cannot read properties of undefined" cualquiera es un bug real.
  /_result is undefined/i,
  /reading '?"?default'?"?\)?$/i,
];

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Registra una recarga y devuelve true si conviene hacerla. Devuelve false si ya
 * se recargó hace poco: así un fallo que la recarga no arregla (servidor roto de
 * verdad) llega a la pantalla de error en vez de recargar en bucle.
 */
export function shouldReloadForChunkError(now = Date.now()): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (now - last < COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    // sessionStorage bloqueado: sin forma de evitar el bucle, mejor no recargar.
    return false;
  }
  return true;
}

/**
 * Para el ErrorBoundary: si el error es de chunk (p. ej. se desplegó una versión nueva con la pestaña
 * abierta) recarga sola una vez, en vez de dejar al usuario en la pantalla de error. Si la recarga
 * no lo arregla, el enfriamiento deja pasar la pantalla de error en vez de recargar en bucle.
 */
export function reloadOnChunkError(error: unknown) {
  if (isChunkLoadError(error) && shouldReloadForChunkError()) window.location.reload();
}

/** Engancha la recuperación al evento que Vite emite cuando falla la carga de un módulo. */
export function installChunkReloadHandler() {
  window.addEventListener("vite:preloadError", (event) => {
    if (!shouldReloadForChunkError()) return; // el error sigue hasta el ErrorBoundary
    event.preventDefault();
    window.location.reload();
  });
}
