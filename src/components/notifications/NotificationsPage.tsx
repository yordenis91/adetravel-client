import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Check, 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  Search, 
  Bell,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  createdAt: string | number;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | string;
  isRead?: boolean;
  [k: string]: any;
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recientesFirst");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then(res => res.data),
    refetchInterval: 60000,
  });

  const payload = data?.data || data;
  const allNotifications: NotificationItem[] = Array.isArray(payload)
    ? payload
    : payload?.items ?? [];

  // Filtrar por búsqueda
  const searchFiltered = allNotifications.filter((n) =>
    (n.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (n.message?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Filtrar por tab
  const tabFiltered = searchFiltered.filter((n) => {
    if (activeTab === "todas") return true;
    if (activeTab === "no-leidas") return !n.isRead;
    if (activeTab === "leidas") return n.isRead;
    return true;
  });

  // Ordenar
  const sortedNotifications = [...tabFiltered].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    
    if (sortBy === "recientesFirst") return timeB - timeA;
    if (sortBy === "masAntiguas") return timeA - timeB;
    return timeB - timeA;
  });

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;
  const readCount = allNotifications.filter((n) => n.isRead).length;
  const totalCount = allNotifications.length;

  const markAsRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notificación marcada como leída");
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.patch(`/notifications/read-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Todas las notificaciones marcadas como leídas");
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notificación eliminada");
    },
  });

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

  const getBgColor = (type?: string) => {
    switch ((type || "").toUpperCase()) {
      case "SUCCESS":
        return "bg-green-50";
      case "WARNING":
        return "bg-yellow-50";
      case "ERROR":
        return "bg-red-50";
      case "INFO":
      default:
        return "bg-blue-50";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-navy flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Centro de Notificaciones
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tus notificaciones y mantente actualizado
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar notificaciones..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {unreadCount > 0 && (
            <Button 
              onClick={() => markAllAsRead.mutate()}
              variant="outline"
              className="whitespace-nowrap"
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-slate-100">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger
              value="todas"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
            >
              Todas
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100">
                {totalCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="no-leidas"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
            >
              No leídas
              <span className={cn(
                "ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                unreadCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-100"
              )}>
                {unreadCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="leidas"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4"
            >
              Leídas
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100">
                {readCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="inline-block animate-spin">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-muted-foreground mt-4">Cargando notificaciones...</p>
          </div>
        )}

        {!isLoading && sortedNotifications.length === 0 && (
          <div className="bg-white border rounded-lg p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No se encontraron notificaciones" : "No tienes notificaciones"}
            </p>
          </div>
        )}

        <AnimatePresence>
          {sortedNotifications.map((notification, idx) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "border rounded-lg overflow-hidden transition-all hover:shadow-md",
                notification.isRead ? "bg-white" : "bg-slate-50 border-blue-200"
              )}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 mt-1 h-10 w-10 flex items-center justify-center rounded-lg",
                  getBgColor(notification.type)
                )}>
                  {getIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold text-base",
                        notification.isRead ? "text-slate-700" : "text-navy"
                      )}>
                        {notification.title ?? "Notificación"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => markAsRead.mutate(notification.id)}
                        disabled={markAsRead.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Marcar como leída
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteNotification.mutate(notification.id)}
                      disabled={deleteNotification.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
