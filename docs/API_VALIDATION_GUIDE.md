# Guía de Validación de Respuestas de API - AdeTravel

## 📋 Resumen Ejecutivo

Esta guía documenta el sistema de validación implementado para manejar respuestas paginadas del backend de AdeTravel de forma segura.

---

## 🏗️ Arquitectura del Backend

El backend de AdeTravel devuelve **SIEMPRE** respuestas en formato paginado para endpoints de listado:

```typescript
// Estructura estándar (sendList utility)
{
  data: T[],
  total: number,
  page: number,
  limit: number
}
```

**NUNCA** devuelve un array directo like `[...]`

---

## ✅ Patrón de Desempaquetado Seguro

### 1. Para Listas (Respuesta con `data[]`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ❌ INCORRECTO - Genera TypeError
const { data: payments = [] } = useQuery({
  queryFn: () => api.get('/payments')
});
payments.map(...) // ❌ TypeError: map is not a function

// ✅ CORRECTO - Seguro
const { data: responseData = [] } = useQuery({
  queryFn: () => api.get('/payments')
});
const payments = Array.isArray(responseData) 
  ? responseData 
  : (responseData as any)?.data || [];
payments.map(...) // ✅ Funciona
```

### 2. Para Contadores (Extraer `.total`)

```typescript
// ❌ INCORRECTO
const { data: count } = useQuery({
  queryFn: async () => {
    const result = await api.get('/requests');
    return result.total; // Falla si es undefined
  }
});

// ✅ CORRECTO
const { data: count = 0 } = useQuery({
  queryFn: async () => {
    try {
      const result = await api.get('/requests');
      return result.total ?? (Array.isArray(result) ? result.length : result?.data?.length || 0);
    } catch (error) {
      return 0; // Fallback seguro
    }
  }
});
```

### 3. Usando Utilitarios de Tipo

```typescript
import { toArray, getTotal } from '@/types/api';
import type { ClientListResponse } from '@/types/api';

const { data: responseData = [] } = useQuery({
  queryFn: () => api.get('/clients')
});

// Extraer array de forma segura
const clients = toArray(responseData);

// Extraer total
const totalClients = getTotal(responseData);

// Usar con tipos TypeScript
clients.forEach((client: Client) => {
  console.log(client.firstName);
});
```

---

## 📦 Tipos Disponibles

### Entidades Principales

```typescript
import type {
  Client,
  Request,
  Quotation,
  Payment,
  Voucher,
  Provider,
  User,
  EmailTemplate,
  ActivityLog
} from '@/types/api';
```

### Tipos de Respuesta

```typescript
import type {
  ClientListResponse,
  RequestListResponse,
  QuotationListResponse,
  PaymentListResponse,
  VoucherListResponse,
  ProviderListResponse,
  UserListResponse,
  EmailTemplateListResponse,
  ActivityLogListResponse
} from '@/types/api';

// Uso
const { data: response } = useQuery<ClientListResponse>({
  queryFn: () => api.get('/clients')
});
```

---

## 🔧 Checklist para Refactorización

Cuando trabajas en un componente con `useQuery`, verifica:

- [ ] Renombraste `data` a `responseData` en la query
- [ ] Agregaste línea de desempaquetado: `const items = Array.isArray(responseData) ? responseData : (responseData as any)?.data || [];`
- [ ] Todos los `.map()`, `.filter()`, `.find()` usan la variable desempaquetada
- [ ] Los contadores usan `.length` sobre el array desempaquetado, NO sobre la respuesta
- [ ] Métodos de búsqueda (`.filter()`) usan propiedades opcionales con `?.`

---

## 📋 Archivos Refactorizados en Fase 2

✅ PaymentsPage.tsx
✅ QuotationsPage.tsx
✅ ConfirmacionesPage.tsx
✅ VouchersPage.tsx
✅ ReportesPage.tsx
✅ EmailTemplatesPage.tsx
✅ BitacoraPage.tsx
✅ DashboardPage.tsx
✅ RecentRequests.tsx
✅ UsuariosPage.tsx
✅ useRequests.ts

---

## 🚨 Errores Comunes a Evitar

### ❌ No validar la estructura

```typescript
// Falla cuando backend devuelve `{ data: [...], total: 100 }`
const { data: items } = useQuery({
  queryFn: () => api.get('/items')
});
items.map(i => i.name) // TypeError: map is not a function
```

### ❌ Confundir `total` con `data.length`

```typescript
// Si hay paginación, total ≠ data.length
const response = { data: [1,2,3], total: 100, page: 1, limit: 3 };
response.total // 100 (correcto)
response.data.length // 3 (puede ser diferente)
```

### ❌ No usar try/catch en contadores

```typescript
// Si falla la query, devuelve undefined
const count = await api.get('/requests').then(r => r.total);
// Debe ser:
const count = await api.get('/requests')
  .then(r => r.total ?? 0)
  .catch(() => 0);
```

---

## 📞 Referencia Rápida

| Caso de Uso | Código |
|---|---|
| Extraer array | `Array.isArray(resp) ? resp : resp?.data \|\| []` |
| Extraer total | `resp?.total ?? Array.isArray(resp) ? resp.length : 0` |
| Con tipos | `toArray<Cliente>(response)` |
| Contar items | `getTotal(response)` |
| Safe property | `obj?.property?.toLowerCase()` |

---

## 🔍 Testing

Para verificar que los cambios funcionan:

```bash
# Terminal 1 - Backend
cd ade-travel-backend && npm run dev

# Terminal 2 - Frontend
cd . && npm run dev

# Abre http://localhost:5173 y verifica en DevTools:
# 1. Network tab - Responses tienen estructura { data: [...], total: X }
# 2. Console - Sin TypeErrors sobre .map/.filter
# 3. UI - Listas, contadores y filtros funcionan
```
