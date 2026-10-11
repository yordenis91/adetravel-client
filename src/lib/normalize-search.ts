/** Minúsculas y sin tildes: "Peru" encuentra "Perú" (si no, el campo acaba con "Peru" como texto libre). */
export const normalizeSearch = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
