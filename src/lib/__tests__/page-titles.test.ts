import { describe, it, expect } from "vitest";
import { getPageTitle } from "../page-titles";
import { activityActionLabel } from "../activity-labels";

describe("getPageTitle", () => {
  it("da nombre a todas las pantallas del menú y a las de detalle", () => {
    expect(getPageTitle("/usuarios")).toBe("Gestión de Usuarios");
    expect(getPageTitle("/permisos/")).toBe("Permisos");
    expect(getPageTitle("/solicitudes/abc-123")).toBe("Detalle de Solicitud");
    expect(getPageTitle("/proveedores/p1")).toBe("Detalle del Proveedor");
    expect(getPageTitle("/clientes/c1/timeline")).toBe("Historial del Cliente");
  });

  it("solo usa el nombre de la marca en rutas desconocidas", () => {
    expect(getPageTitle("/otra")).toBe("ADE Travel");
  });
});

describe("activityActionLabel", () => {
  it("traduce las acciones que guarda la API y deja legibles las desconocidas", () => {
    expect(activityActionLabel("UPDATE")).toBe("Modificación");
    expect(activityActionLabel("CREATE")).toBe("Creación");
    expect(activityActionLabel("USER_PERMISSION_DENIED")).toBe("Permiso denegado al usuario");
    expect(activityActionLabel("ALGO_NUEVO")).toBe("ALGO NUEVO");
    expect(activityActionLabel(undefined)).toBe("Acción");
  });
});
