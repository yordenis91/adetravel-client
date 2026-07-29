import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Notification {
  id: string;
  userId: string;
  title?: string;
  message?: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "PAYMENT_COMPLETED" | string;
  isRead?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string | number;
  updatedAt?: string | number;
  [key: string]: any;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
}

export interface NotificationResponse {
  items?: Notification[];
  data?: Notification[];
  total?: number;
  page?: number;
  limit?: number;
  unreadCount?: number;
}

/**
 * Hook para gestionar notificaciones del usuario
 * Incluye polling cada 5 segundos, mutations para marcar como leída, eliminar, etc.
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  // Query: Obtener todas las notificaciones con polling cada 5 segundos
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data;
    },
    refetchInterval: 5000, // Polling cada 5 segundos
    staleTime: 4000, // Datos válidos por 4 segundos
  });

  // Query: Obtener estadísticas de notificaciones
  const statsQuery = useQuery({
    queryKey: ["notifications-stats"],
    queryFn: async () => {
      const response = await api.get("/notifications/stats");
      return response.data?.data;
    },
    refetchInterval: 5000,
    staleTime: 4000,
  });

  // Mutation: Marcar una notificación como leída
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/notifications/${id}/read`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-stats"] });
    },
    onError: (error: any) => {
      console.error("Error marcando como leída:", error);
      toast.error("Error al marcar notificación como leída");
    },
  });

  // Mutation: Marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      api.patch("/notifications/read-all").then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-stats"] });
      toast.success("Todas las notificaciones marcadas como leídas");
    },
    onError: (error: any) => {
      console.error("Error marcando todas como leídas:", error);
      toast.error("Error al marcar notificaciones como leídas");
    },
  });

  // Mutation: Eliminar una notificación
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/notifications/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-stats"] });
      toast.success("Notificación eliminada");
    },
    onError: (error: any) => {
      console.error("Error eliminando notificación:", error);
      toast.error("Error al eliminar notificación");
    },
  });

  // Procesar respuesta de la API para soportar múltiples formatos
  const payload = notificationsQuery.data?.data ||
    notificationsQuery.data?.items ||
    notificationsQuery.data;

  const notifications: Notification[] = Array.isArray(payload)
    ? payload
    : [];

  const unreadCount = 
    notificationsQuery.data?.unreadCount ||
    (statsQuery.data as NotificationStats)?.unreadCount ||
    notifications.filter((n) => !n.isRead).length;

  const totalCount = 
    notificationsQuery.data?.total ||
    (statsQuery.data as NotificationStats)?.totalCount ||
    notifications.length;

  return {
    // Data
    notifications,
    unreadCount,
    totalCount,
    
    // State
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,
    
    // Mutations
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
    
    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    
    // Refetch
    refetch: notificationsQuery.refetch,
  };
}
