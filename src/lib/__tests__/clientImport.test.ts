import { describe, it, expect, vi } from "vitest";
import {
  fieldForHeader, mapTable, normalizeDate, normalizeHeader, normalizeReferralSource, parseCsv, splitEmails,
  readClientFile, downloadClientTemplate, ImportFileError, MAX_IMPORT_ROWS,
} from "../clientImport";

describe("encabezados", () => {
  it("normaliza tildes, mayúsculas y signos", () => {
    expect(normalizeHeader("  Teléfono (móvil) ")).toBe("telefono movil");
  });
  it.each([
    ["Nombre", "firstName"], ["Apellidos", "lastName"], ["Nombre completo", "fullName"], ["E-mail", "email"],
    ["Correo electrónico", "email"], ["Fono", "phone"], ["Celular", "phone"], ["RUT", "rut"],
    ["Fecha de nacimiento", "birthDate"], ["Correos adicionales", "additionalEmails"], ["Fuente", "referralSource"],
  ])("reconoce %s", (header, field) => expect(fieldForHeader(header)).toBe(field));
  it("no reconoce columnas ajenas", () => expect(fieldForHeader("Color favorito")).toBeNull());
});

describe("fechas", () => {
  it.each([
    ["2030-12-31", "2030-12-31"], ["31/12/2030", "2030-12-31"], ["5-3-1985", "1985-03-05"], ["15.03.85", "1985-03-15"],
    ["2030-12-31T00:00:00.000Z", "2030-12-31"], ["01/02/05", "2005-02-01"],
  ])("%s → %s", (input, expected) => expect(normalizeDate(input)).toBe(expected));
  it("usa día primero (Chile): 03/04/2020 es 3 de abril", () => expect(normalizeDate("03/04/2020")).toBe("2020-04-03"));
  it.each(["31/02/2020", "ayer", "13/13/2020", ""])("rechaza %j", (input) => expect(normalizeDate(input)).toBeNull());
});

describe("fuente y correos", () => {
  it.each([["Referido", "REFERRAL"], ["Sitio web", "WEBSITE"], ["Consulado", "CONSULATE"], ["Directo", "OTHER"], ["website", "WEBSITE"], ["REFERRAL", "REFERRAL"]])(
    "%s → %s", (input, expected) => expect(normalizeReferralSource(input)).toBe(expected)
  );
  it("devuelve null si no la reconoce", () => expect(normalizeReferralSource("Marte")).toBeNull());
  it("separa correos por coma, punto y coma, espacios y saltos", () => {
    expect(splitEmails("a@x.cl; b@x.cl, c@x.cl\nd@x.cl")).toEqual(["a@x.cl", "b@x.cl", "c@x.cl", "d@x.cl"]);
  });
});

describe("parseCsv", () => {
  it("lee comillas, comas dentro de comillas y comillas dobles", () => {
    expect(parseCsv('Nombre,Apellido\n"Ana, la jefa","Pérez ""Pepa"""\n')).toEqual([["Nombre", "Apellido"], ["Ana, la jefa", 'Pérez "Pepa"']]);
  });
  it("detecta punto y coma (Excel en español), BOM y saltos CRLF", () => {
    expect(parseCsv("﻿Nombre;Apellido\r\nAna;Soto\r\n")).toEqual([["Nombre", "Apellido"], ["Ana", "Soto"]]);
  });
  it("detecta tabulador", () => expect(parseCsv("Nombre\tApellido\nAna\tSoto")).toEqual([["Nombre", "Apellido"], ["Ana", "Soto"]]));
  it("conserva saltos de línea dentro de comillas", () => expect(parseCsv('a,b\n"x\ny",z')).toEqual([["a", "b"], ["x\ny", "z"]]));
});

describe("mapTable", () => {
  const header = ["Nombre", "Apellido", "Email", "Teléfono", "Fecha de nacimiento", "Fuente", "Color"];

  it("convierte filas a datos del API, ignora columnas ajenas y celdas vacías", () => {
    const r = mapTable([header, ["Ana", "Soto", "ana@x.cl", "", "15/03/1985", "Referido", "azul"]]);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].data).toEqual({ firstName: "Ana", lastName: "Soto", email: "ana@x.cl", birthDate: "1985-03-15", referralSource: "REFERRAL" });
    expect(r.rows[0].sheetRow).toBe(2);
    expect(r.ignoredHeaders).toEqual(["Color"]);
  });

  it("avisa y omite fechas y fuentes ilegibles sin descartar la fila", () => {
    const r = mapTable([header, ["Ana", "Soto", "", "", "mañana", "Marte", ""]]);
    expect(r.rows[0].data).toEqual({ firstName: "Ana", lastName: "Soto" });
    expect(r.rows[0].warnings).toHaveLength(2);
  });

  it("acepta 'Nombre completo' y lo separa en nombre y apellido", () => {
    const r = mapTable([["Cliente", "Correo"], ["María José González Pérez", "m@x.cl"]]);
    expect(r.rows[0].data).toMatchObject({ firstName: "María", lastName: "José González Pérez", email: "m@x.cl" });
  });

  it("si hay nombre y apellido separados, 'Nombre completo' no los pisa", () => {
    const r = mapTable([["Nombre", "Apellido", "Nombre completo"], ["Ana", "Soto", "Otra Cosa"]]);
    expect(r.rows[0].data).toMatchObject({ firstName: "Ana", lastName: "Soto" });
  });

  it("junta los correos adicionales en una lista", () => {
    const r = mapTable([["Nombre", "Apellido", "Correos adicionales"], ["Ana", "Soto", "a@x.cl; b@x.cl"]]);
    expect(r.rows[0].data.additionalEmails).toEqual(["a@x.cl", "b@x.cl"]);
  });

  it("salta filas totalmente vacías y numera según la hoja", () => {
    const r = mapTable([["Nombre", "Apellido"], ["Ana", "Soto"], ["", ""], ["Beto", "Díaz"]]);
    expect(r.rows.map((x) => x.data.firstName)).toEqual(["Ana", "Beto"]);
  });

  it("rechaza archivos sin columnas de nombre, vacíos, sin datos o demasiado grandes", () => {
    expect(() => mapTable([["Correo"], ["a@x.cl"]])).toThrow(/columnas de nombre/);
    expect(() => mapTable([])).toThrow(ImportFileError);
    expect(() => mapTable([["Nombre", "Apellido"]])).toThrow(/ninguna fila/);
    const many = [["Nombre", "Apellido"], ...Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => ["A", `B${i}`])];
    expect(() => mapTable(many)).toThrow(/máximo/);
  });

  it("lee el CSV que exporta la propia pantalla de clientes (viaje de ida y vuelta)", () => {
    const csv = "Nombre,Apellido,RUT,Pasaporte,Email,Telefono,Nacionalidad,Fuente,Estado\nAna,Soto,N/A,N/A,ana@x.cl,+56 9 1,Chilena,Directo,Activo";
    const r = mapTable(parseCsv(csv));
    expect(r.rows[0].data).toMatchObject({ firstName: "Ana", email: "ana@x.cl", nationality: "Chilena", referralSource: "OTHER" });
  });
});

describe("readClientFile", () => {
  const file = (name: string, content: string | ArrayBuffer, size?: number) => {
    const f = new File([content], name);
    if (size !== undefined) Object.defineProperty(f, "size", { value: size });
    return f;
  };

  it("lee un .csv", async () => {
    const r = await readClientFile(file("c.csv", "Nombre;Apellido\nAna;Soto"));
    expect(r.rows[0].data).toEqual({ firstName: "Ana", lastName: "Soto" });
  });
  it("rechaza formatos no admitidos y archivos grandes", async () => {
    await expect(readClientFile(file("c.xls", "x"))).rejects.toThrow(/\.xlsx/);
    await expect(readClientFile(file("c.csv", "x", 6 * 1024 * 1024))).rejects.toThrow(/5 MB/);
  });
  it("un .xlsx dañado da un mensaje claro", async () => {
    await expect(readClientFile(file("c.xlsx", "no soy un zip"))).rejects.toThrow(/dañado/);
  });
  it("lee un .xlsx real con fechas de Excel, texto con formato y fórmulas", async () => {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Clientes");
    ws.addRow(["Nombre", "Apellido", "Email", "Fecha de nacimiento"]);
    ws.addRow(["Ana", { richText: [{ text: "So" }, { text: "to" }] }, { formula: "A2&\"@x.cl\"", result: "Ana@x.cl" }, new Date(Date.UTC(1985, 2, 15))]);
    const buf = await wb.xlsx.writeBuffer();
    const r = await readClientFile(file("c.xlsx", buf as ArrayBuffer));
    expect(r.rows[0].data).toEqual({ firstName: "Ana", lastName: "Soto", email: "Ana@x.cl", birthDate: "1985-03-15" });
  });
});

describe("plantilla", () => {
  it("la plantilla que se descarga se puede importar tal cual (ida y vuelta)", async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => { blob = b; return "blob:x"; });
    URL.revokeObjectURL = vi.fn();
    await downloadClientTemplate();
    expect(blob).toBeDefined();
    const r = await readClientFile(new File([await blob!.arrayBuffer()], "plantilla-clientes.xlsx"));
    expect(r.rows).toHaveLength(1);
    expect(r.ignoredHeaders).toEqual([]);
    expect(r.rows[0].warnings).toEqual([]);
    expect(r.rows[0].data).toMatchObject({
      firstName: "María", lastName: "González Pérez", email: "maria@ejemplo.cl", rut: "12.345.678-5",
      birthDate: "1985-03-15", passportExpiry: "2030-12-31", referralSource: "REFERRAL", additionalEmails: ["contabilidad@ejemplo.cl", "pareja@ejemplo.cl"],
    });
  });
});
