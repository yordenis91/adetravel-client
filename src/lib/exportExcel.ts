/**
 * Exporta datos a un archivo .xlsx real (no CSV disfrazado), usando `exceljs`.
 * Misma firma que `exportToCsv` para que las páginas puedan ofrecer ambos formatos con el
 * mismo shaping de datos/columnas. `exceljs` se importa dinámicamente para no engordar el
 * bundle principal (solo se descarga cuando el usuario efectivamente exporta).
 */
export async function exportToExcel(
  filename: string,
  data: Record<string, any>[],
  columns?: { key: string; label: string }[]
): Promise<void> {
  if (!data || data.length === 0) {
    console.warn("No hay datos para exportar");
    return;
  }

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ADE Travel";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Datos");

  const finalColumns = columns && columns.length > 0
    ? columns
    : Object.keys(data[0]).map((key) => ({ key, label: key }));

  worksheet.columns = finalColumns.map((col) => ({ header: col.label, key: col.key, width: 22 }));
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1E3C" } };

  data.forEach((item) => {
    const row: Record<string, unknown> = {};
    finalColumns.forEach((col) => { row[col.key] = item[col.key] ?? ""; });
    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
