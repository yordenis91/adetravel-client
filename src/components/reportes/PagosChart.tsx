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

interface PagosChartProps {
  payments: any[];
}

const COLORS = ["#0F1E3C", "#C9A84C", "#1E2F4F", "#A68B3E", "#2563eb"];

export default function PagosChart({ payments }: PagosChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      "EFECTIVO": 0,
      "TARJETA": 0,
      "TRANSFERENCIA": 0,
      "CHEQUE": 0,
      "WEBPAY": 0
    };

    payments.forEach(p => {
      if (counts[p.method] !== undefined) {
        counts[p.method]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [payments]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <Tooltip 
            cursor={{ fill: "#F8FAFC" }}
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
