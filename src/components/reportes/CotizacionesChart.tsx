import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const NAVY = "#0F1E3C";
const GOLD = "#C9A84C";

export default function CotizacionesChart({ data }: { data: any[] }) {
  const chartData = data.map(item => ({ name: item.status, value: item.count }));

  const colors: Record<string, string> = {
    "BORRADOR": "#CBD5E1",
    "ENVIADA": "#3B82F6",
    "ACEPTADA": "#10B981",
    "RECHAZADA": "#F87171"
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" tick={{ fill: NAVY, fontSize: 11, fontWeight: "700" }} />
          <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: `2px solid ${GOLD}`, borderRadius: "8px" }} cursor={{ fill: "rgba(192, 192, 192, 0.1)" }} />
          <Bar dataKey="value" fill={NAVY} radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[entry.name] || NAVY} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}