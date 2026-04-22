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

interface CotizacionesChartProps {
  quotations: any[];
}

export const QUOTATION_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  Borrador:  { label: "Borrador",  color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  Enviada:   { label: "Enviada",   color: "bg-blue-100 text-blue-700",  dot: "bg-blue-500" },
  Aceptada:  { label: "Aceptada",  color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Rechazada: { label: "Rechazada", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

const NAVY = "#0F1E3C";
const GOLD = "#C9A84C";

export default function CotizacionesChart({ quotations }: CotizacionesChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      "Borrador": 0,
      "Enviada": 0,
      "Aceptada": 0,
      "Rechazada": 0
    };

    quotations.forEach(q => {
      if (counts[q.status] !== undefined) {
        counts[q.status]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [quotations]);

  const colors = {
    "Borrador": "#CBD5E1",
    "Enviada": "#3B82F6",
    "Aceptada": "#10B981",
    "Rechazada": "#F87171"
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: NAVY, fontSize: 12, fontWeight: "600" }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#FFFFFF", 
              border: `2px solid ${GOLD}`, 
              borderRadius: "8px" 
            }}
            cursor={{ fill: "rgba(192, 192, 192, 0.1)" }}
          />
          <Bar dataKey="value" fill={NAVY} radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[entry.name as keyof typeof colors]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
