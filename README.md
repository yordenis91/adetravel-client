# AdeTravel — Frontend (Cliente)

Este repositorio contiene el frontend de AdeTravel, un ERP/CRM para agencias de viajes. El frontend está implementado en React + TypeScript y se comunica con el backend localizado en `../adetravel-api`.

**Resumen rápido**
- Frontend: [adetravel-client](./) (esta carpeta)
- Backend: `../adetravel-api` (API REST en Node.js + TypeScript)
- Base de datos: PostgreSQL (contenedor `adetravel-db` en despliegues Docker)
- Proxy/SSL: Traefik en despliegues productivos

## Estructura del proyecto

- `/src` — Código fuente React (páginas, componentes, hooks, integraciones).
- `/public` — Recursos estáticos
- `package.json` — Scripts y dependencias del frontend
- `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts` — Configuración de TypeScript, Vite y Tailwind

Contenido clave de `src` (alto nivel):
- `components/` — Componentes UI organizados por dominio (clients, requests, payments, etc.)
- `pages/` — Páginas principales (Dashboard, Clients, Requests...)
- `lib/` — Conexión con la API, utilidades y helpers
- `context/` — `AuthContext` y entidades compartidas

## Tecnologías principales

- React 18 + TypeScript
- Vite (bundler / dev server)
- Tailwind CSS + Shadcn UI
- @tanstack/react-query para fetching/cache
- react-hook-form + zod para formularios y validación
- framer-motion, date-fns, lucide-react (iconos)

## Requisitos

- Node.js 18+ (recomendado)
- npm / pnpm / yarn
- Acceso al backend en `adetravel-api` o una URL a la API

## Variables de entorno

Frontend (archivo sugerido `.env` o `.env.local`):

VITE_API_URL=https://api.example.com
VITE_FEATURE_FLAG_EXAMPLE=true

Nota: Las variables deben usar el prefijo `VITE_` para ser accesibles desde el código cliente.

## Scripts útiles

Basado en `package.json`:
- `npm run dev` — Inicia Vite en modo desarrollo
- `npm run build` — Genera build de producción
- `npm run preview` — Sirve el build estático localmente
- `npm run lint` — Ejecuta ESLint

Ejemplo rápido para desarrollo local:

```bash
cd /var/www/html/adetravel-client
npm install
export VITE_API_URL=http://localhost:3000/api
npm run dev
```

## Backend (resumen y comandos)

El backend se encuentra en [../adetravel-api](../adetravel-api). Comandos comunes (ver `adetravel-api/package.json`):

- `npm run dev` — Ejecuta el servidor en modo desarrollo (ts-node)
- `npm run build` — Compila TypeScript
- `npm run start` — Ejecuta el `dist` (aplica `prisma db push` antes de iniciar)
- `npm run prisma:migrate` — Ejecuta migraciones (desarrollo)
- `npm run seed:admin` — Crea un usuario admin de ejemplo

Variables de entorno importantes (backend):

- `DATABASE_URL` — URL de conexión PostgreSQL
- `PORT` — Puerto del servidor (ej. `3000`)
- `JWT_SECRET` — Secreto para firmar tokens
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Para envío de emails

## Arquitectura y despliegue

- En producción el sistema se despliega con Docker + Traefik. Los contenedores principales son:
	- `adetravel-api` (Node.js)
	- `adetravel-client` (sitio estático servido por un webserver)
	- `adetravel-db` (PostgreSQL)
- Traefik se encarga del proxy inverso y de la obtención/renovación de certificados TLS (Let's Encrypt).

## Convenciones y reglas de negocio importantes

- Soft delete: Use `isActive: false` para desactivar clientes con historial financiero o comercial. No borrar datos relacionados.
- Validaciones: Duplicar validaciones críticas tanto en frontend como en backend (Zod en backend, Zod+react-hook-form en frontend).
- Consultas optimizadas: Para listas que requieren `count` + `findMany`, usar `Promise.all` para paralelizar.
- RBAC: El backend expone middlewares por roles; el frontend debe respetar permisos y ocultar acciones no permitidas.

## Testing y calidad

- El frontend incluye ESLint y configuraciones de TypeScript; ejecutar `npm run lint` regularmente.
- El backend tiene pruebas con Jest (ver `adetravel-api/package.json`).

## Troubleshooting

- Si el frontend no encuentra la API, verificar `VITE_API_URL` y CORS en el backend.
- Para problemas con la base de datos, revisar `DATABASE_URL` y los logs del contenedor `adetravel-db`.

## Contribuir

1. Crea una rama: `git checkout -b feat/mi-cambio`
2. Ejecuta lint y pruebas locales
3. Envía un PR con descripción clara y cambios pequeños

## Recursos y archivos relevantes

- Backend: [../adetravel-api](../adetravel-api)
- Frontend entry: `src/main.tsx`
- Configuración de Vite: `vite.config.ts`



