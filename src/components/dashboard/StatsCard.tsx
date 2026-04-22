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
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors group-hover:scale-110 duration-300",
              colorClass
            )}>
              {icon}
            </div>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                trend === "up" ? "text-emerald-600 bg-emerald-50" : 
                trend === "down" ? "text-rose-600 bg-rose-50" : 
                "text-slate-500 bg-slate-50"
              )}>
                {trend === "up" && <TrendingUp className="w-3 h-3" />}
                {trend === "down" && <TrendingDown className="w-3 h-3" />}
                {trend === "neutral" && <Minus className="w-3 h-3" />}
                {trendValue}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-playfair font-bold text-navy mb-1">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
