import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";

function Lista({ rows, stack = true }: { rows: string[]; stack?: boolean }) {
  return (
    <Table stackOnMobile={stack}>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>
        ) : (
          rows.map((r) => (
            <TableRow key={r}><TableCell>{r}</TableCell><TableCell>Pendiente</TableCell></TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

describe("Table con stackOnMobile", () => {
  it("etiqueta cada celda con su columna, también en filas que llegan después", async () => {
    const { rerender } = render(<Lista rows={[]} />);
    expect(screen.getByRole("table")).toHaveClass("table-stack");
    expect(screen.getByText("Sin datos")).toHaveAttribute("data-label", "");

    rerender(<Lista rows={["Ana"]} />);
    await waitFor(() => expect(screen.getByText("Ana")).toHaveAttribute("data-label", "Cliente"));
    expect(screen.getByText("Pendiente")).toHaveAttribute("data-label", "Estado");
  });

  it("sin la opción no cambia nada", () => {
    render(<Lista rows={["Ana"]} stack={false} />);
    expect(screen.getByRole("table")).not.toHaveClass("table-stack");
    expect(screen.getByText("Ana")).not.toHaveAttribute("data-label");
  });
});
