// Título de la cabecera según la ruta. Las pantallas de detalle usan el nombre de su sección.

const PAGE_TITLES: Record<string, string> = {
  "/": "Panel Principal",
  "/dashboard": "Panel Principal",
  "/clientes": "Gestión de Clientes",
  "/proveedores": "Proveedores de Servicios",
  "/solicitudes": "Solicitudes de Viaje",
  "/servicios": "Servicios",
  "/cotizaciones": "Cotizaciones",
  "/confirmaciones": "Confirmaciones de Reserva",
  "/pagos": "Registro de Pagos",
  "/vouchers": "Generación de Vouchers",
  "/reportes": "Reportes y Estadísticas",
  "/bitacora": "Bitácora de Operaciones",
  "/tareas": "Gestión de Tareas",
  "/notifications": "Notificaciones",
  "/perfil": "Mi Perfil",
  "/usuarios": "Gestión de Usuarios",
  "/configuracion": "Configuración",
  "/plantillas-email": "Plantillas de Correo",
  "/permisos": "Permisos",
  "/nomencladores": "Nomencladores",
};

const DETAIL_TITLES: [prefix: string, title: string][] = [
  ["/solicitudes/", "Detalle de Solicitud"],
  ["/clientes/", "Historial del Cliente"],
  ["/proveedores/", "Detalle del Proveedor"],
];

export function getPageTitle(pathname: string): string {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const detail = DETAIL_TITLES.find(([prefix]) => path.startsWith(prefix));
  return detail ? detail[1] : "ADE Travel";
}
