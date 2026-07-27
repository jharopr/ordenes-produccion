import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export type Customer = {
  id: string; businessName: string; tradeName?: string; taxId?: string;
  address?: string; city?: string; phone?: string; email?: string; contactName?: string; logoPath?: string; isDefault?: boolean;
};
export type Location = { id: string; name: string; city: string; address?: string };
export type OrderStatus = 'DRAFT' | 'ORDERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type Payment = { id: string; amount: string; paidAt: string; notes?: string };
export type OrderItem = {
  id?: string; description: string; quantity: string; unitPrice: string;
  subtotal?: string; displayOrder?: number;
};
export type Invoice = { invoiceNumber?: string; issueDate?: string; amount?: string };
export type ProductionOrder = {
  id: string; orderNumber: string; title: string; customerId: string; locationId?: string;
  customer: Customer; location?: Location; executionAddress?: string; startDate?: string;
  estimatedCompletionDate?: string; completionDate?: string; requestedBy?: string; notes?: string;
  status: OrderStatus; paymentStatus: PaymentStatus; subtotal: string; discount: string; total: string; items: OrderItem[];
  invoices?: Invoice[]; payments?: Payment[]; createdAt: string;
};
export type Page<T> = { data: T[]; meta: { total: number; page: number; limit: number; pages: number } };

export function apiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el backend. Verifique que esté ejecutándose.';
    const message = error.response?.data?.message;
    return Array.isArray(message) ? message.join(', ') : message || `No se pudo completar la operación (HTTP ${error.response.status}).`;
  }
  return 'Ocurrió un error inesperado.';
}

export function assetUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const base = String(api.defaults.baseURL || '/api').replace(/\/api\/?$/, '');
  return `${base}${path}`;
}
