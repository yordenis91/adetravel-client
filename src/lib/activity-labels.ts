// Nombre en español de las acciones de la bitácora (el campo `action` que guarda la API).

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Modificación",
  DELETE: "Eliminación",
  SYNC_API: "Sincronización automática",
  ROLE_PERMISSIONS_UPDATED: "Permisos del rol actualizados",
  USER_PERMISSION_GRANTED: "Permiso concedido al usuario",
  USER_PERMISSION_DENIED: "Permiso denegado al usuario",
  USER_PERMISSION_REVOKED: "Permiso del usuario retirado",
  USER_PERMISSION_DENY_REMOVED: "Denegación del usuario retirada",
};

/** Etiqueta legible; una acción desconocida se muestra con espacios en lugar de guiones bajos. */
export function activityActionLabel(action?: string | null): string {
  if (!action) return "Acción";
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}
