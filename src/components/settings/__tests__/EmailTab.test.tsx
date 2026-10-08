import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SystemConfig } from "@/lib/api";
import EmailTab from "../EmailTab";

const CONFIG = {
  id: "cfg-1",
  smtpHost: "smtp.example.com",
  smtpPort: 587,
  smtpUser: "agencia@example.com",
  smtpFromEmail: "no-reply@example.com",
  smtpEncryption: "TLS",
  smtpPasswordSet: true,
};

function renderTab(config: any = CONFIG) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EmailTab config={config} configId={config?.id} />
    </QueryClientProvider>
  );
}

const save = () => fireEvent.submit(screen.getByLabelText("Contraseña").closest("form")!);

describe("EmailTab: contraseña del SMTP", () => {
  afterEach(() => vi.restoreAllMocks());

  it("con una contraseña guardada el campo empieza vacío e indica que existe", () => {
    renderTab();
    const input = screen.getByLabelText("Contraseña") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toMatch(/Guardada/);
  });

  it("guardar sin escribir contraseña no la envía (la API conserva la actual)", async () => {
    const update = vi.spyOn(SystemConfig, "update").mockResolvedValue({} as any);
    renderTab();
    save();
    await waitFor(() => expect(update).toHaveBeenCalled());
    const body = update.mock.calls[0][1] as any;
    expect(body).not.toHaveProperty("smtpPassword");
    expect(body).not.toHaveProperty("smtpPasswordSet");
    expect(body.smtpHost).toBe("smtp.example.com");
  });

  it("si se escribe una contraseña nueva se envía", async () => {
    const update = vi.spyOn(SystemConfig, "update").mockResolvedValue({} as any);
    renderTab();
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Nueva-Clave-1" } });
    save();
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect((update.mock.calls[0][1] as any).smtpPassword).toBe("Nueva-Clave-1");
  });

  it("sin contraseña guardada no muestra el aviso", () => {
    renderTab({ ...CONFIG, smtpPasswordSet: false });
    expect((screen.getByLabelText("Contraseña") as HTMLInputElement).placeholder).toBe("");
  });
});
