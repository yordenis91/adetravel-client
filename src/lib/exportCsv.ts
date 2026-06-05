/**
 * Utility to export data to CSV format
 */
/**
 * Exporta datos a CSV.
 * @param filename - Nombre del archivo (sin extensión, se agregará .csv si falta)
 * @param data - Array de objetos a exportar. Se usarán las claves del primer objeto como columnas si no se pasan.
 * @param columns - Opcional: definición manual de columnas {key, label}
 */
export function exportToCsv(
  filename: string,
  data: Record<string, any>[],
  columns?: { key: string; label: string }[]
) {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Si no se proporcionan columnas, las inferimos del primer objeto
  let finalColumns: { key: string; label: string }[];
  if (columns && columns.length > 0) {
    finalColumns = columns;
  } else {
    const keys = Object.keys(data[0]);
    finalColumns = keys.map((key) => ({ key, label: key }));
  }

  // Escapar celdas para CSV
  const escapeCell = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/\"/g, '""')}"`;
    }
    return str;
  };

  // Cabecera
  const header = finalColumns.map((col) => escapeCell(col.label)).join(',');

  // Filas
  const rows = data.map((item) =>
    finalColumns
      .map((col) => escapeCell(item[col.key]))
      .join(',')
  );

  const csvContent = '\uFEFF' + [header, ...rows].join('\n'); // BOM para UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
