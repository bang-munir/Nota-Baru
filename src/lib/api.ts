import type { Discount, Payment, Product, Transaction, TransactionItem } from '../types';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface PaymentResponse {
  id: string;
  transactionId: string;
  amount: number;
  paymentDate: string;
  note: string | null;
}

interface TransactionResponse {
  id: string;
  date: string;
  customerName: string | null;
  items: TransactionItem[];
  discounts: Discount[];
  payments: PaymentResponse[];
  paidAmount: number;
  totalProductPrice: number;
  totalDiscountAmount: number;
  totalBill: number;
  debtAmount: number;
}

export interface TransactionsSnapshot {
  transactions: Transaction[];
  payments: Payment[];
}

export interface NewProductInput {
  id: string;
  name: string;
  price: number;
}

export interface ProductInput {
  name: string;
  price: number;
}

export interface PaymentInput {
  id?: string;
  amount: number;
  paymentDate: string;
  note?: string | null;
}

export interface NewPaymentInput {
  transactionId: string;
  amount: number;
  paymentDate: string;
  note?: string | null;
}

export interface TransactionInput {
  date: string;
  customerName?: string;
  items: TransactionItem[];
  discounts: Pick<Discount, 'description' | 'amount'>[];
  payments: PaymentInput[];
}

function messageFrom(payload: unknown, status: number): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const value = (payload as { error: unknown }).error;
    if (typeof value === 'string' && value.trim()) return value;
  }
  if (status === 0) return 'Tidak dapat terhubung ke server API.';
  return `Permintaan gagal (HTTP ${status}).`;
}

async function send(path: string, method: string, body?: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined
        ? { accept: 'application/json' }
        : { accept: 'application/json', 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server API.');
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) throw new ApiError(response.status, messageFrom(payload, response.status));
  return payload;
}

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  return (await send(path, method, body)) as T;
}

async function remove(path: string): Promise<void> {
  await send(path, 'DELETE');
}

function toList<T>(payload: unknown, path: string): T[] {
  if (!Array.isArray(payload)) {
    throw new ApiError(0, `Respons dari ${path} bukan JSON yang valid. Pastikan API berjalan pada origin yang sama.`);
  }
  return payload as T[];
}

function toPayment(row: PaymentResponse): Payment {
  return {
    id: row.id,
    transactionId: row.transactionId,
    amount: row.amount,
    paymentDate: row.paymentDate,
    note: row.note ?? undefined,
  };
}

export const api = {
  products: {
    list: async (): Promise<Product[]> => toList<Product>(await send('/api/products', 'GET'), '/api/products'),
    create: (input: NewProductInput): Promise<Product> =>
      request<Product>('/api/products', 'POST', input),
    update: (id: string, input: ProductInput): Promise<Product> =>
      request<Product>(`/api/products/${encodeURIComponent(id)}`, 'PATCH', input),
    remove: (id: string): Promise<void> => remove(`/api/products/${encodeURIComponent(id)}`),
  },

  transactions: {
    list: async (): Promise<TransactionsSnapshot> => {
      const rows = toList<TransactionResponse>(await send('/api/transactions', 'GET'), '/api/transactions');
      const transactions: Transaction[] = rows;
      const payments = rows.flatMap((row) => row.payments.map(toPayment));
      return { transactions, payments };
    },
    create: (input: TransactionInput): Promise<Transaction> =>
      request<Transaction>('/api/transactions', 'POST', input),
    update: (id: string, input: Omit<TransactionInput, 'customerName'>): Promise<Transaction> =>
      request<Transaction>(`/api/transactions/${encodeURIComponent(id)}`, 'PATCH', input),
    remove: (id: string): Promise<void> => remove(`/api/transactions/${encodeURIComponent(id)}`),
  },

  payments: {
    create: (input: NewPaymentInput): Promise<Payment> =>
      request<Payment>('/api/payments', 'POST', input),
    update: (id: string, input: Pick<PaymentInput, 'amount' | 'paymentDate'>): Promise<Payment> =>
      request<Payment>(`/api/payments/${encodeURIComponent(id)}`, 'PATCH', input),
    remove: (id: string): Promise<void> => remove(`/api/payments/${encodeURIComponent(id)}`),
  },
};
