import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/lib/api";

const replaceToken = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ replaceToken, user: { id: "u1" }, hasPermission: () => true }),
}));

import PerfilPage from "../PerfilPage";

const ME = { id: "u1", email: "ana@example.com", fullName: "Ana Pérez", role: "USUARIO", agencyRole: "OPERACIONES", isActive: true, createdAt: "2026-01-01T00:00:00Z" };

function renderPage() {
  vi.spyOn(api, "get").mockResolvedValue({ data: ME } as any);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PerfilPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function changePassword() {
  fireEvent.change(await screen.findByLabelText("Contraseña Actual"), { target: { value: "Actual-2026!" } });
  fireEvent.change(screen.getByLabelText("Nueva Contraseña"), { target: { value: "Nueva-2026!" } });
  fireEvent.change(screen.getByLabelText("Confirmar Nueva Contraseña"), { target: { value: "Nueva-2026!" } });
  fireEvent.submit(screen.getByLabelText("Nueva Contraseña").closest("form")!);
}

describe("Perfil: cambio de contraseña y token nuevo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    replaceToken.mockClear();
  });

  it("guarda el token nuevo que devuelve la API para que la sesión siga abierta", async () => {
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: { ...ME, token: "token-nuevo" } } as any);
    renderPage();
    await changePassword();
    await waitFor(() => expect(patch).toHaveBeenCalledWith("/auth/me", { currentPassword: "Actual-2026!", newPassword: "Nueva-2026!" }));
    await waitFor(() => expect(replaceToken).toHaveBeenCalledWith("token-nuevo"));
  });

  it("si la API no devuelve token (versión anterior), no toca la sesión", async () => {
    vi.spyOn(api, "patch").mockResolvedValue({ data: ME } as any);
    renderPage();
    await changePassword();
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(replaceToken).not.toHaveBeenCalled();
  });
});
