import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "../StatsCard";
import { Atom } from "lucide-react";

describe("StatsCard", () => {
  it("renders title, value and trend value correctly", () => {
    render(
      <StatsCard
        title="Total Clientes"
        value="100"
        icon={<Atom />}
        trend="up"
        trendValue="+5%"
      />
    );

    expect(screen.getByText("Total Clientes")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("+5%")) .toBeInTheDocument();
  });
});
