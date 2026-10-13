/**
 * Tendencia de una tarjeta del panel: últimos 30 días frente a los 30 anteriores.
 * Los conteos (clientes, solicitudes, viajes) muestran la diferencia absoluta y los importes
 * el porcentaje, porque con pocas unidades un porcentaje salta demasiado ("+200%" por pasar de 1 a 3).
 */
export interface TrendPair {
  current: number;
  previous: number;
}

export type TrendKind = "count" | "amount";

export interface TrendDisplay {
  trend: "up" | "down" | "neutral";
  label: string;
  /** Texto para el aviso al pasar el ratón; incluye los dos valores comparados. */
  hint: string;
}

const NO_CHANGE = "sin cambios";

export function describeTrend(pair: TrendPair | null | undefined, kind: TrendKind, windowDays = 30, format: (n: number) => string = String): TrendDisplay | null {
  if (!pair || !Number.isFinite(pair.current) || !Number.isFinite(pair.previous)) return null;
  const { current, previous } = pair;
  const hint = `Últimos ${windowDays} días: ${format(current)}. ${windowDays} días anteriores: ${format(previous)}.`;
  const diff = current - previous;

  if (diff === 0) return { trend: "neutral", label: NO_CHANGE, hint };

  if (kind === "count") {
    return { trend: diff > 0 ? "up" : "down", label: diff > 0 ? `+${diff}` : String(diff), hint };
  }

  if (previous === 0) return { trend: "up", label: "nuevo", hint };
  const pct = Math.round((diff / previous) * 100);
  if (pct === 0) return { trend: "neutral", label: NO_CHANGE, hint };
  return { trend: pct > 0 ? "up" : "down", label: pct > 0 ? `+${pct}%` : `${pct}%`, hint };
}
