# Notificaciones y pruebas del hook useNotifications

## Resumen

Este documento describe la configuración de Vitest en el proyecto `adetravel-client`, la creación de pruebas unitarias para `StatsCard` y `useNotifications`, y los comandos ejecutados para validar el flujo.

## Archivos creados / modificados

### Configuración de Vitest
- `vite.config.ts`
  - Se añadió la referencia de tipos de Vitest:
    ```ts
    /// <reference types="vitest" />
    ```
  - Se añadió el bloque `test` dentro del objeto `defineConfig`:
    ```ts
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
    },
    ```
- `vitest.setup.ts`
  - Contiene la importación de las aserciones extendidas del DOM:
    ```ts
    import '@testing-library/jest-dom';
    ```
- `package.json`
  - Se añadió el script de prueba:
    ```json
    "test": "vitest"
    ```

### Pruebas creadas
- `src/components/dashboard/__tests__/StatsCard.test.tsx`
  - Prueba unitaria para el componente `StatsCard`
  - Comprueba que:
    - el título `Total Clientes` se renderiza
    - el valor `100` se muestra correctamente
    - el trend value `+5%` está presente

- `src/hooks/__tests__/useNotifications.test.tsx`
  - Prueba del hook `useNotifications`
  - Crea un componente de prueba que usa el hook dentro de `QueryClientProvider`
  - Verifica:
    - que la query carga notificaciones correctamente
    - que `unreadCount` y `totalCount` se exponen correctamente
    - que `api.patch("/notifications/1/read")` se llama cuando se marca una notificación como leída
    - que `api.patch("/notifications/read-all")` se llama cuando se marca todas como leídas

## Estructura del hook `useNotifications`

El hook realiza lo siguiente:
- consulta `GET /notifications` con React Query
- consulta `GET /notifications/stats` con React Query
- expone `notifications`, `unreadCount`, `totalCount`
- expone mutaciones `markAsRead`, `markAllAsRead` y `deleteNotification`
- hace polling cada 5 segundos

## Comandos ejecutados

1. Instalar dependencias de testing en el frontend:

```bash
cd /var/www/html/adetravel-client
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

2. Ejecutar la prueba de `StatsCard`:

```bash
npm test -- --run src/components/dashboard/__tests__/StatsCard.test.tsx
```

3. Ejecutar la prueba del hook `useNotifications`:

```bash
npm test -- --run src/hooks/__tests__/useNotifications.test.tsx
```

## Resultados obtenidos

- `src/components/dashboard/__tests__/StatsCard.test.tsx`
  - 1 test ejecutado
  - 1 passed

- `src/hooks/__tests__/useNotifications.test.tsx`
  - 3 tests ejecutados
  - 3 passed

## Observaciones

- Se observó una advertencia de Vite relacionada con `optimizeDeps.esbuildOptions` usada por el plugin `@vitejs/plugin-react-swc`:
  - `optimizeDeps.esbuildOptions option was specified by "vite:react-swc" plugin. This option is deprecated, please use optimizeDeps.rollupOptions instead.`
- Las pruebas fueron ejecutadas con éxito aunque esta advertencia no impide el funcionamiento.

## Estructura de los tests

### `StatsCard.test.tsx`
- utiliza `render` y `screen` de `@testing-library/react`
- verifica los textos renderizados del componente

### `useNotifications.test.tsx`
- utiliza `QueryClientProvider` para envolver el hook
- utiliza `vi.spyOn(api, "get")` y `vi.spyOn(api, "patch")` para interceptar llamadas a la API
- valida las rutas de API esperadas:
  - `/notifications`
  - `/notifications/stats`
  - `/notifications/1/read`
  - `/notifications/read-all`

## Recomendaciones finales

- Mantener el hook `useNotifications` con polling en 5s mientras no exista WebSocket o SSE.
- Si se implementa un backend real de notificaciones, extender este test con más casos (error de API, datos vacíos, `deleteNotification`).
