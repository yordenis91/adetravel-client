import { describe, it, expect } from "vitest";
import { applyClientPrefill, getClientPrefill, type PrefillClient } from "../clientPrefill";

const CLIENT: PrefillClient = {
  firstName: "Ana", lastName: "Pérez", email: "ana@example.com", phone: "+56911112222",
  rut: "11.111.111-1", passportNumber: "P123", passportExpiry: "2030-05-20", passportIssueDate: "2020-05-20",
  passportCountry: "Chile", birthDate: "1990-05-10", nationality: "Chilena", address: "Calle 1",
  frequentFlyerNumbers: ["LA123", "AA999"],
};

describe("getClientPrefill", () => {
  it("seguro copia identificación, contacto y dirección", () => {
    expect(getClientPrefill("SEGURO", CLIENT)).toEqual({
      fullName: "Ana Pérez", passportNumber: "P123", rut: "11.111.111-1",
      address: "Calle 1", birthDate: "1990-05-10", phone: "+56911112222", email: "ana@example.com",
    });
  });

  it("visa, pasaje aéreo y servicios con nombre de cliente", () => {
    expect(getClientPrefill("VISA", CLIENT)).toEqual({
      fullName: "Ana Pérez", passportNumber: "P123", passportExpiry: "2030-05-20", birthDate: "1990-05-10", nationality: "Chilena",
    });
    expect(getClientPrefill("PASAJE_AEREO", CLIENT)).toMatchObject({ fullName: "Ana Pérez", frequentFlyerNumber: "LA123", passportIssueDate: "2020-05-20" });
    for (const t of ["ARRIENDO_AUTO", "EXCURSION", "TRASLADO", "CRUCERO", "CIRCUITO"] as const) {
      expect(getClientPrefill(t, CLIENT)).toEqual({ clientName: "Ana Pérez" });
    }
  });

  it("alojamiento propone al cliente como responsable de la primera habitación", () => {
    expect(getClientPrefill("ALOJAMIENTO", CLIENT)).toEqual({ rooms: [{ responsibleName: "Ana Pérez", roomType: "DOBLE" }] });
  });

  it("nunca incluye valores vacíos y tolera una ficha reducida (solo nombre)", () => {
    expect(getClientPrefill("SEGURO", { firstName: "Ana", lastName: "Pérez" })).toEqual({ fullName: "Ana Pérez" });
    expect(getClientPrefill("VISA", { firstName: "  ", lastName: null, passportNumber: "" })).toEqual({});
    expect(getClientPrefill("ALOJAMIENTO", {})).toEqual({});
  });
});

describe("applyClientPrefill", () => {
  it("rellena los campos vacíos y no pisa lo que el usuario ya escribió", () => {
    const next = applyClientPrefill({ fullName: "", phone: "999", birthDate: undefined }, { fullName: "Ana Pérez", phone: "+56911112222", birthDate: "1990-05-10" });
    expect(next).toEqual({ fullName: "Ana Pérez", phone: "999", birthDate: "1990-05-10" });
  });

  it("en alojamiento solo completa el responsable si está vacío", () => {
    const prefill = { rooms: [{ responsibleName: "Ana Pérez", roomType: "DOBLE" }] };
    expect(applyClientPrefill({ rooms: [{ responsibleName: "", roomType: "TRIPLE" }, { responsibleName: "", roomType: "DOBLE" }] }, prefill))
      .toEqual({ rooms: [{ responsibleName: "Ana Pérez", roomType: "TRIPLE" }, { responsibleName: "", roomType: "DOBLE" }] });
    const typed = { rooms: [{ responsibleName: "Luis", roomType: "DOBLE" }] };
    expect(applyClientPrefill(typed, prefill)).toEqual(typed);
  });

  it("no modifica el objeto original", () => {
    const current = { fullName: "" };
    applyClientPrefill(current, { fullName: "Ana" });
    expect(current).toEqual({ fullName: "" });
  });
});
