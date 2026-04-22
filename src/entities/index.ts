import { superdevClient } from "@/lib/superdev/client";

export const User = superdevClient.auth;
export const Client = superdevClient.entity("Client");
export const Provider = superdevClient.entity("Provider");
export const Request = superdevClient.entity("Request");
export const Quotation = superdevClient.entity("Quotation");
export const Payment = superdevClient.entity("Payment");
export const Voucher = superdevClient.entity("Voucher");
export const ActivityLog = superdevClient.entity("ActivityLog");
export const SystemConfig = superdevClient.entity("SystemConfig");
export const EmailTemplate = superdevClient.entity("EmailTemplate");
