/**
 * Tipos seguros para respuestas de API
 * Estos tipos aseguran que los datos siempre estén en el formato correcto
 */

import { PaginatedResponse } from '@/lib/api';
import { WorkflowStatus } from '@/lib/workflow-status';
import { ServiceDetails, ServiceType } from './service';

// ============================================
// Tipos de Entidades
// ============================================

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone?: string;
  isActive: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface Request {
  id: string;
  requestNumber: string;
  clientId: string;
  status: WorkflowStatus;
  isPackage?: boolean;
  cancellationReason?: string | null;
  destinationCity?: string;
  destinationCountry?: string;
  originCity?: string;
  services?: string[];
  created_at?: string;
  [key: string]: unknown;
}

export interface Service {
  id: string;
  serviceNumber: string;
  requestId: string;
  type: ServiceType;
  status: WorkflowStatus;
  providerId?: string | null;
  clientId?: string | null;
  price?: number | null;
  currency: 'CLP' | 'USD';
  details: ServiceDetails;
  cancellationReason?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Confirmation {
  id: string;
  confirmationNumber: string;
  requestId: string;
  serviceId?: string | null;
  providerId: string;
  providerConfirmationNumber?: string | null;
  price: number;
  validUntil?: string | null;
  exchangeRate?: number | null;
  notes?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  requestId: string;
  serviceId?: string | null;
  status: 'Borrador' | 'Enviada' | 'Aceptada' | 'Rechazada';
  total?: number;
  currency?: string;
  validUntil?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  clientId: string;
  requestId?: string;
  amount: number;
  currency: 'CLP' | 'USD';
  status: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'FALLIDO';
  reference?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  clientId: string;
  requestId?: string;
  serviceName?: string;
  destination?: string;
  status: 'BORRADOR' | 'EMITIDO' | 'CANCELADO';
  created_at?: string;
  [key: string]: unknown;
}

export interface Provider {
  id: string;
  name: string;
  fantasyName?: string;
  email: string;
  businessType?: string;
  isActive: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'administrator' | 'user';
  agencyRole?: 'GERENTE' | 'AGENTE_SENIOR' | 'AGENTE' | 'ASISTENTE';
  [key: string]: unknown;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  isActive: boolean;
  [key: string]: unknown;
}

export interface ActivityLog {
  id: string;
  action: string;
  description?: string;
  entityType?: string;
  entityLabel?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// ============================================
// Tipos de Respuesta Paginada
// ============================================

export type ClientListResponse = PaginatedResponse<Client> | Client[];
export type RequestListResponse = PaginatedResponse<Request> | Request[];
export type ServiceListResponse = PaginatedResponse<Service> | Service[];
export type ConfirmationListResponse = PaginatedResponse<Confirmation> | Confirmation[];
export type QuotationListResponse = PaginatedResponse<Quotation> | Quotation[];
export type PaymentListResponse = PaginatedResponse<Payment> | Payment[];
export type VoucherListResponse = PaginatedResponse<Voucher> | Voucher[];
export type ProviderListResponse = PaginatedResponse<Provider> | Provider[];
export type UserListResponse = PaginatedResponse<User> | User[];
export type EmailTemplateListResponse = PaginatedResponse<EmailTemplate> | EmailTemplate[];
export type ActivityLogListResponse = PaginatedResponse<ActivityLog> | ActivityLog[];

// ============================================
// Utilitarios de Tipo
// ============================================

/**
 * Extrae de forma segura un array de cualquier tipo de respuesta
 */
export function toArray<T>(response: PaginatedResponse<T> | T[] | T | null | undefined): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as any).data || [];
  }
  return [];
}

/**
 * Extrae el conteo total de una respuesta
 */
export function getTotal<T>(response: PaginatedResponse<T> | T[] | null | undefined): number {
  if (!response) return 0;
  if (Array.isArray(response)) return response.length;
  if (response && typeof response === 'object' && 'total' in response) {
    return (response as any).total;
  }
  return 0;
}
