import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Importación de clientes: archivo → vista previa (sin guardar) → confirmación → resultado.
import { ImportClientsDialog } from "../ImportClientsDialog";

const CSV = "Nombre,Apellido,Email,Fecha de nacimiento,Color\nAna,Soto,ana@x.cl,15/03/1985,azul\nBeto,Díaz,beto@x.cl,mañana,rojo\nSin,,,,";

const PREVIEW = {
  data: {
    dryRun: true, total: 3, valid: 1, duplicates: 1, invalid: 1,
    rows: [
      { row: 1, status: "valid", label: "Ana Soto", reasons: [] },
      { row: 2, status: "duplicate", label: "Beto Díaz", reasons: ["El correo beto@x.cl ya existe"] },
      { row: 3, status: "invalid", label: "Sin", reasons: ["lastName: El apellido es obligatorio"] },
    ],
  },
};

function setup(onImported = vi.fn(), onOpenChange = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ImportClientsDialog open onOpenChange={onOpenChange} onImported={onImported} />
    </QueryClientProvider>
  );
  return { onImported, onOpenChange };
}

const upload = (name: string, content: string) =>
  fireEvent.change(screen.getByLabelText("Archivo de clientes"), { target: { files: [new File([content], name, { type: "text/csv" })] } });

afterEach(() => vi.restoreAllMocks());

describe("ImportClientsDialog", () => {
  it("explica el formato y no deja importar sin archivo", () => {
    setup();
    expect(screen.getByText(/Obligatorias/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Descargar plantilla/ })).toBeInTheDocument();
  });

  it("al elegir un archivo pide la vista previa (dryRun) y NO guarda; muestra resumen, motivos y avisos", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue(PREVIEW);
    setup();
    upload("clientes.csv", CSV);

    expect(await screen.findByText("1 nuevos")).toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/clients/import", {
      dryRun: true,
      rows: [
        { firstName: "Ana", lastName: "Soto", email: "ana@x.cl", birthDate: "1985-03-15" },
        { firstName: "Beto", lastName: "Díaz", email: "beto@x.cl" },
        { firstName: "Sin" },
      ],
    });
    expect(screen.getByText("1 duplicados")).toBeInTheDocument();
    expect(screen.getByText("1 con errores")).toBeInTheDocument();
    expect(screen.getByText("El correo beto@x.cl ya existe")).toBeInTheDocument();
    expect(screen.getByText("Apellido: El apellido es obligatorio")).toBeInTheDocument();
    expect(screen.getByText(/Fecha no reconocida/)).toBeInTheDocument(); // aviso local de "mañana"
    expect(screen.getByText(/Columnas no reconocidas.*Color/)).toBeInTheDocument();
    const rows = within(screen.getByRole("list", { name: "Filas del archivo" })).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("#2"); // la primera fila de datos es la 2 de la hoja
  });

  it("al confirmar guarda (dryRun false), muestra el resultado y avisa para refrescar la lista", async () => {
    const post = vi.spyOn(api, "post")
      .mockResolvedValueOnce(PREVIEW)
      .mockResolvedValueOnce({ data: { ...PREVIEW.data, dryRun: false } });
    const { onImported } = setup();
    upload("clientes.csv", CSV);
    fireEvent.click(await screen.findByRole("button", { name: "Importar 1 cliente" }));

    expect(await screen.findByText("Se importó 1 cliente")).toBeInTheDocument();
    expect(post).toHaveBeenLastCalledWith("/clients/import", expect.objectContaining({ dryRun: false }));
    expect(screen.getByText(/1 duplicados y 1 filas con errores/)).toBeInTheDocument();
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it("si no hay filas nuevas, el botón de importar queda desactivado", async () => {
    vi.spyOn(api, "post").mockResolvedValue({ data: { ...PREVIEW.data, valid: 0, duplicates: 3, invalid: 0, rows: [] } });
    setup();
    upload("clientes.csv", CSV);
    expect(await screen.findByText("0 nuevos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar 0 clientes" })).toBeDisabled();
  });

  it("un archivo sin columna de nombre se rechaza sin llamar al API", async () => {
    const post = vi.spyOn(api, "post");
    setup();
    upload("malo.csv", "Correo\na@x.cl");
    expect(await screen.findByRole("alert")).toHaveTextContent(/columnas de nombre/);
    expect(post).not.toHaveBeenCalled();
  });

  it("un formato no admitido se explica", async () => {
    setup();
    upload("viejo.xls", "x");
    expect(await screen.findByRole("alert")).toHaveTextContent(/\.xlsx/);
  });

  it("si el API falla en la vista previa, muestra el error y no ofrece importar", async () => {
    vi.spyOn(api, "post").mockRejectedValue(new Error(JSON.stringify({ error: "Máximo 500 filas por importación" })));
    setup();
    upload("clientes.csv", CSV);
    expect(await screen.findByRole("alert")).toHaveTextContent("Máximo 500 filas por importación");
    expect(screen.getByRole("button", { name: "Importar" })).toBeDisabled();
  });

  it("si falla el guardado, muestra el error, explica que reintentar es seguro y deja reintentar", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce(PREVIEW).mockRejectedValueOnce(new Error("boom"));
    const { onImported } = setup();
    upload("clientes.csv", CSV);
    fireEvent.click(await screen.findByRole("button", { name: "Importar 1 cliente" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/boom.*reintentar con seguridad/);
    expect(onImported).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Importar 1 cliente" })).toBeEnabled());
  });

  it("cerrar el diálogo limpia el estado para la próxima vez", async () => {
    vi.spyOn(api, "post").mockResolvedValue(PREVIEW);
    const { onOpenChange } = setup();
    upload("clientes.csv", CSV);
    await screen.findByText("1 nuevos");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText("1 nuevos")).not.toBeInTheDocument();
  });
});
