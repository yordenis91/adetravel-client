/**
 * Aviso tras cambiar el estado de una solicitud. Al reactivar una cancelada, la API reactiva
 * también sus servicios y devuelve cuántos (`reactivatedServices`): se dice al usuario que los
 * revise, porque puede modificarlos, eliminarlos o volver a cancelarlos uno a uno.
 */
export function statusChangedToast(response: any): { title: string; description: string } {
  const n = Number(response?.data?.reactivatedServices ?? 0);
  if (n > 0) {
    return {
      title: "Solicitud reactivada",
      description: `${n === 1 ? "1 servicio vuelve" : `${n} servicios vuelven`} a "Recepcionada". Revísalos: puedes modificarlos, eliminarlos o volver a cancelarlos.`,
    };
  }
  return { title: "Estado actualizado", description: "El estado de la solicitud ha sido cambiado." };
}
