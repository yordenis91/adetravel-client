## Módulos Principales (Core Features)

1. Gestión de Clientes (CRM)
   - Descripción: CRUD avanzado para la gestión de clientes. Permite crear, editar, ver y desactivar clientes, con un perfil 360° que centraliza datos de contacto, documentos (RUT), notas y relaciones comerciales.
   - Validaciones: Validaciones únicas para RUT y email; el sistema trata cadenas vacías de forma explícita para evitar colisiones en índices únicos.
   - Borrado: Distinción entre borrado lógico (`isActive: false`) y borrado físico (protegido si existen relaciones con transacciones, cotizaciones, pagos o vouchers).
   - Frontend relevante: `ClientsPage`, `ClientsTable`, `ClientFormDialog`, `ClientPreviewDialog`.

2. Línea de Tiempo del Cliente 360° (Chatter)
   - Descripción: Vista consolidada del historial de un cliente que muestra cronológicamente Solicitudes, Cotizaciones, Pagos, Vouchers y entradas de la bitácora (audit log). Incluye KPIs, eventos destacados y acciones rápidas.
   - Objetivo: Facilitar contexto rápido para seguimiento comercial y soporte, mostrando interacciones y estado actual en un solo lugar.
   - Frontend relevante: `ClientTimelinePage` y componentes asociados.

3. Bitácora de Actividad (Audit Trail)
   - Descripción: Registro inmutable de acciones del sistema (quién realizó la acción, sobre qué entidad y cuándo). Pensado para auditoría y trazabilidad.
   - Características: Paginación, filtros por entidad/usuario/fecha, y protección contra purgado de registros recientes (p. ej. no permitir borrar logs con menos de 30 días según política).
   - Frontend relevante: `BitacoraPage`, `TimelineItem`.

4. Plantillas de Email Dinámicas
   - Descripción: Sistema para crear y gestionar plantillas HTML con variables inyectables (placeholders) para personalizar comunicaciones (por ejemplo, `{{client_name}}`).
   - Funcionalidades: Validación de variables disponibles, previsualización en vivo (Live Preview), edición WYSIWYG/HTML y envío asíncrono vía SMTP.
   - Motor de envío: Integración con `nodemailer` en el backend para envíos en background y colas ligeras.
   - Frontend relevante: `EmailTemplatesPage`, `TemplateFormDialog`.



5. Solicitudes (Requests)
   - Descripción: Gestión de solicitudes de servicio/reservas realizadas por o para clientes. Incluye estados de flujo (p. ej. nuevo, en_proceso, completado, cancelado).
   - Funcionalidades: Creación desde formulario, detalle con historial, seguimiento de estado, y badges de estado para ligar con cotizaciones y pagos.
   - Frontend relevante: `RequestsPage`, `RequestsTable`, `RequestFormDialog`, `RequestDetailSheet`, `RequestStatusFlow`.

6. Cotizaciones (Quotations)
   - Descripción: Generación, edición y envío de propuestas comerciales (cotizaciones). Soporta estados (borrador, enviada, aceptada, rechazada) y generación de PDF.
   - Funcionalidades: Plantillas de cotización, preview PDF, cambios de estado y asociación a solicitudes y clientes.
   - Frontend relevante: `QuotationsPage`, `QuotationsTable`, `QuotationFormDialog`, `QuotationPDFPreview`, `QuotationDetailSheet`.

7. Pagos (Payments)
   - Descripción: Registro y conciliación de pagos asociados a cotizaciones o solicitudes. Manejo de estados y comprobantes.
   - Funcionalidades: Registrar pagos manuales, ver historial, badges de estado, integración con pasarelas externas (si aplica) y conciliación con vouchers.
   - Frontend relevante: `PaymentsPage`, `PaymentsTable`, `PaymentFormDialog`, `PaymentStatusBadge`.

8. Vouchers
   - Descripción: Emisión y gestión de vouchers/recibos que validan servicios pagados. Soporta generación de PDF y códigos de validación.
   - Funcionalidades: Generar voucher desde pagos o cotizaciones, descargar PDF, marcar como canjeado, asociar a cliente y solicitud.
   - Frontend relevante: `VouchersPage`, `VouchersTable`, `VoucherFormDialog`, `VoucherPDFPreview`, `VoucherStatusBadge`.

9. Proveedores (Providers)
   - Descripción: Gestión de proveedores de servicios (aerolíneas, hoteles, tours). Datos de contacto, categorías y condiciones comerciales.
   - Funcionalidades: CRUD de proveedores, formularios con validaciones y relación con cotizaciones y servicios.
   - Frontend relevante: `ProvidersPage`, `ProvidersTable`, `ProviderFormDialog`.

10. Confirmaciones (Confirmaciones)
   - Descripción: Gestión de confirmaciones de servicios (check-ins, confirmaciones de reserva) y detalle de cada confirmación.
   - Funcionalidades: Ver listado de confirmaciones, detalle en sheet, exportar o enviar confirmación por email.
   - Frontend relevante: `ConfirmacionesPage`, `ConfirmacionesTable`, `ConfirmacionDetailSheet`.

11. Reportes (Reportes)
   - Descripción: Visualizaciones y métricas clave del negocio: ingresos, solicitudes, cotizaciones, pagos y actividad por periodo.
   - Funcionalidades: Gráficos, filtros por fecha/entidad, exportación CSV/Excel y widgets en el dashboard.
   - Frontend relevante: `ReportesPage`, `CotizacionesChart`, `SolicitudesChart`, `PagosChart`.

12. Usuarios y Roles (Usuarios)
   - Descripción: Administración de usuarios del sistema, roles y permisos. Control para crear, editar y asignar permisos.
   - Funcionalidades: Gestión de roles, asignación de permisos, badges de rol y control de acceso en UI.
   - Frontend relevante: `UsuariosPage`, `UserRoleBadge`.

13. Configuración (Settings)
   - Descripción: Panel de configuración de la aplicación: datos de la agencia, sistema, correo, integraciones y documentos.
   - Funcionalidades: Pestañas separadas por dominio (`Agency`, `System`, `Email`, `Exchange`, `Documents`) y guardado seguro de configuraciones.
   - Frontend relevante: `SettingsPage`, `AgencyTab`, `SystemTab`, `EmailTab`, `ExchangeTab`, `DocumentsTab`.

14. Dashboard
   - Descripción: Vista principal con KPIs, recordatorios, últimas solicitudes y widgets para una visión rápida del estado del negocio.
   - Funcionalidades: Cards de métricas, listado de últimas solicitudes, recordatorios de cumpleaños y widget de tasas de cambio.
   - Frontend relevante: `DashboardPage`, `StatsCard`, `RecentRequests`, `BirthdayReminder`, `ExchangeRatesWidget`.

---

Notas de implementación y convenciones importantes
- Validaciones duales: las reglas críticas se aplican tanto en frontend (mejor UX) como en backend (Zod) para seguridad.
- Consultas optimizadas: cuando se requieren conteos y listados simultáneos, usar `Promise.all` para paralelizar y reducir latencia.
- RBAC: el backend controla permisos vía middlewares; el frontend debe ocultar/condicionar acciones según permisos del usuario.
