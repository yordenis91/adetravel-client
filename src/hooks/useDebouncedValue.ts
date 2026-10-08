import { useEffect, useState } from "react";

/** Devuelve `value` cuando deja de cambiar durante `delay` ms (para no pedir a la API por cada tecla). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
