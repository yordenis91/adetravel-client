import React, { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

interface SolicitudesChartProps {
  requests: any[];
}

const NAVY = "#0F1E3C";
const GOLD = "#C9A84C";

export default function SolicitudesChart({ requests }: SolicitudesChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      "Recepcionada": 0,
      "Cotizada": 0,
      "Confirmada": 0,
      "Vendida": 0,
      "Cancelada": 0
    };

    requests.forEach(req => {
      if (counts[req.status] !== undefined) {
        counts[req.status]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: "transparent" }}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.name === "Vendida" ? GOLD : NAVY} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
