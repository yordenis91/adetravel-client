import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, ArrowRight, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  label: string;
  isActive: boolean;
  lastUpdated: string;
}

interface ExchangeRatesWidgetProps {
  exchangeRates: ExchangeRate[];
}

export function ExchangeRatesWidget({ exchangeRates = [] }: ExchangeRatesWidgetProps) {
  const activeRates = exchangeRates.filter((rate) => rate.isActive);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tasas de Cambio</h3>
            </div>
            <Link to="/configuracion">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                <Settings className="w-4 h-4 text-slate-400" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {activeRates.length > 0 ? (
              activeRates.map((rate, index) => {
                const isClpTarget = rate.fromCurrency === "CLP" || rate.toCurrency === "CLP";
                let displayString = "";
                
                if (rate.fromCurrency === "CLP") {
                  // If source is CLP, usually we want to see how much 1 of the other is in CLP
                  // e.g. rate = 0.001087 (1 CLP = 0.001087 USD) -> 1 USD = 920 CLP
                  const inverseRate = (1 / rate.rate).toLocaleString("es-CL", { maximumFractionDigits: 2 });
                  displayString = `1 ${rate.toCurrency} = $${inverseRate} CLP`;
                } else if (rate.toCurrency === "CLP") {
                  // If target is CLP, show 1 of source = X CLP
                  const formattedRate = rate.rate.toLocaleString("es-CL", { maximumFractionDigits: 2 });
                  displayString = `1 ${rate.fromCurrency} = $${formattedRate} CLP`;
                } else {
                  // Other combinations
                  displayString = `1 ${rate.fromCurrency} = ${rate.rate.toLocaleString("es-CL", { maximumFractionDigits: 4 })} ${rate.toCurrency}`;
                }

                return (
                  <motion.div 
                    key={rate.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex flex-col gap-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-navy">
                          <DollarSign className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{rate.label}</p>
                          <p className="text-sm font-bold text-navy font-manrope">{displayString}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Referencia</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                      Actualizado: {new Date(rate.lastUpdated).toLocaleDateString("es-CL", { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground italic">No hay tasas configuradas</p>
                <Link to="/configuracion">
                  <Button variant="link" className="text-xs text-amber-600 font-bold p-0 h-auto mt-1">Configurar ahora</Button>
                </Link>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Fuentes oficiales</span>
              <span className="flex items-center gap-1">
                Tasa manual <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}