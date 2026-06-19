import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Atom, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
  delay?: number;
}

const colorVariants: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-emerald-50 text-emerald-600 border-emerald-100",
  gold: "bg-amber-50 text-amber-600 border-amber-100",
  red: "bg-rose-50 text-rose-600 border-rose-100",
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = "blue",
  delay = 0 
}: StatsCardProps) {
  const colorClass = colorVariants[color as keyof typeof colorVariants] ?? `${color} text-white border-transparent`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group">
        <CardContent className="p-6">
          {/* 1. Fila superior: Título y Badge alineados */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors group-hover:scale-110 duration-300 shrink-0",
                colorClass
              )}>
                {icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  {title}
                </p>
              </div>
            </div>
            
            {/* Badge de tendencia alineado a la derecha */}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full tracking-wider",
                trend === "up" ? "text-emerald-700 bg-emerald-100" : 
                trend === "down" ? "text-rose-700 bg-rose-100" : 
                "text-slate-600 bg-slate-100"
              )}>
                {trend === "up" && <TrendingUp className="w-3 h-3" />}
                {trend === "down" && <TrendingDown className="w-3 h-3" />}
                {trend === "neutral" && <Minus className="w-3 h-3" />}
                {trendValue}
              </div>
            )}
          </div>

          {/* 2. El número grande (Sin fuente Playfair, con tracking-tight) */}
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-navy mb-1">{value}</h3>
            {subtitle && <p className="text-xs font-medium text-slate-500">{subtitle}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}