import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // 🔥 Usar el hook centralizado que ya maneja queries, mutations y polling cada 5s
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const getIcon = (type?: string) => {
    switch ((type || "").toUpperCase()) {
      case "SUCCESS":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "WARNING":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "ERROR":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "INFO":
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 text-[10px] h-5 w-5 rounded-full flex items-center justify-center bg-red-600 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      
      <DropdownMenuContent className="w-[400px] p-1 shadow-lg" align="end" forceMount>
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-sm font-semibold text-navy">Notificaciones</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-medium hover:text-primary/80 h-7 px-2"
              onClick={() => {
                setIsOpen(false); // Cierra el menú al navegar
                navigate("/notifications"); // Redirige a la vista completa
              }}
            >
              Ver Todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-navy font-medium h-7 px-2"
              onClick={() => markAllAsRead()}
            >
              Marcar todas como leídas
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {isLoading && (
            <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
              Cargando...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No tienes notificaciones nuevas
            </div>
          )}

          {!isLoading && notifications.map((n) => {
            const bg = n.isRead ? "bg-white" : "bg-blue-50/50";
            return (
              <DropdownMenuItem
                key={n.id}
                onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                className={`flex gap-3 items-start px-3 py-3 cursor-pointer ${bg} hover:bg-slate-100 transition-colors`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                    {getIcon(n.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-navy truncate pr-2">
                      {n.title ?? "Notificación"}
                    </p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="flex items-center ml-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
