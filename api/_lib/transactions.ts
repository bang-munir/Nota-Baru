import { ApiError } from './errors.ts';
import {
  asObject,
  generateId,
  optionalText,
  requireDate,
  requireInt,
  requireText,
} from './validate.ts';

export interface ApiItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

export interface ApiDiscount {
  id: string;
  description: string;
  amount: number;
}

export interface ApiPayment {
  id: string;
  transactionId: string;
  amount: number;
  paymentDate: string;
  note: string | null;
}

export interface ApiTransaction {
  id: string;
  date: string;
  customerName: string | null;
  items: ApiItem[];
  discounts: ApiDiscount[];
  payments: ApiPayment[];
  paidAmount: number;
  totalProductPrice: number;
  totalDiscountAmount: number;
  totalBill: number;
  debtAmount: number;
}

interface ItemRow {
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  priceAtSale: number;
}

interface DiscountRow {
  id: string;
  description: string;
  amount: number;
}

interface PaymentRow {
  id: string;
  transactionId: string;
  amount: number;
  paymentDate: Date | string;
  note?: string | null;
}

export interface TransactionRow {
  id: string;
  date: string | Date;
  customerName?: string | null;
  items?: ItemRow[];
  discounts?: DiscountRow[];
  payments?: PaymentRow[];
}

export function parseItems(value: unknown): ApiItem[] {
  if (!Array.isArray(value)) throw new ApiError(400, 'items harus berupa array.');
  if (value.length === 0) throw new ApiError(400, 'Transaksi minimal memiliki satu item.');

  return value.map((entry, index) => {
    const item = asObject(entry, `items[${index}]`);
    return {
      productId: requireText(item.productId, `items[${index}].productId`, 100),
      productName: requireText(item.productName, `items[${index}].productName`, 300),
      quantity: requireInt(item.quantity, `items[${index}].quantity`, 1, 'Quantity harus bilangan bulat positif.'),
      priceAtSale: requireInt(item.priceAtSale, `items[${index}].priceAtSale`, 0, 'priceAtSale tidak boleh negatif.'),
    };
  });
}

export function parseDiscounts(value: unknown): ApiDiscount[] {
  if (!Array.isArray(value)) throw new ApiError(400, 'discounts harus berupa array.');

  return value.map((entry, index) => {
    const discount = asObject(entry, `discounts[${index}]`);
    const providedId = discount.id === undefined || discount.id === '' ? null : discount.id;
    return {
      id: providedId === null ? generateId('d') : requireText(providedId, `discounts[${index}].id`, 100),
      description: requireText(discount.description, `discounts[${index}].description`, 300),
      amount: requireInt(discount.amount, `discounts[${index}].amount`, 0, 'Nominal diskon tidak boleh negatif.'),
    };
  });
}

export function parsePayments(value: unknown, transactionId: string): ApiPayment[] {
  if (!Array.isArray(value)) throw new ApiError(400, 'payments harus berupa array.');

  return value.map((entry, index) => {
    const payment = asObject(entry, `payments[${index}]`);
    const providedId = payment.id === undefined || payment.id === '' ? null : payment.id;
    const paymentDate = payment.paymentDate === undefined
      ? new Date()
      : parsePaymentDate(payment.paymentDate, `payments[${index}].paymentDate`);
    return {
      id: providedId === null ? generateId('pay') : requireText(providedId, `payments[${index}].id`, 100),
      transactionId,
      amount: requireInt(payment.amount, `payments[${index}].amount`, 1, 'Nominal pembayaran harus lebih dari 0.'),
      paymentDate: paymentDate.toISOString(),
      note: optionalText(payment.note, `payments[${index}].note`, 500),
    };
  });
}

function parsePaymentDate(value: unknown, field: string): Date {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, `${field} harus berupa tanggal.`);
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) throw new ApiError(400, `${field} bukan tanggal yang valid.`);
  return new Date(timestamp);
}

export function parseDate(value: unknown): string {
  return requireDate(value, 'date');
}

export const DEFAULT_CUSTOMER_NAME = 'Pelanggan Umum';

export function parseCustomerName(value: unknown): string | null {
  if (value === undefined) return DEFAULT_CUSTOMER_NAME;
  return optionalText(value, 'customerName', 200);
}

export function totals(input: {
  items: ApiItem[];
  discounts: ApiDiscount[];
  payments: ApiPayment[];
}) {
  const totalProductPrice = input.items.reduce((sum, item) => sum + item.quantity * item.priceAtSale, 0);
  const totalDiscountAmount = input.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const totalBill = Math.max(totalProductPrice - totalDiscountAmount, 0);
  const paidAmount = input.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const debtAmount = Math.max(totalBill - paidAmount, 0);
  return { totalProductPrice, totalDiscountAmount, totalBill, paidAmount, debtAmount };
}

export function buildTransaction(input: {
  id: string;
  date: string;
  customerName: string | null;
  items: ApiItem[];
  discounts: ApiDiscount[];
  payments: ApiPayment[];
}): ApiTransaction {
  return {
    id: input.id,
    date: input.date,
    customerName: input.customerName,
    items: input.items,
    discounts: input.discounts,
    payments: input.payments,
    ...totals(input),
  };
}

function toIsoDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export function toApiPayment(row: PaymentRow): ApiPayment {
  return {
    id: row.id,
    transactionId: row.transactionId,
    amount: row.amount,
    paymentDate: toIsoDate(row.paymentDate),
    note: row.note ?? null,
  };
}

export function toApiTransaction(row: TransactionRow): ApiTransaction {
  const items: ApiItem[] = (row.items ?? []).map((item) => ({
    productId: item.productId,
    productName: item.productNameSnapshot,
    quantity: item.quantity,
    priceAtSale: item.priceAtSale,
  }));
  const discounts: ApiDiscount[] = (row.discounts ?? []).map((discount) => ({
    id: discount.id,
    description: discount.description,
    amount: discount.amount,
  }));
  const payments: ApiPayment[] = (row.payments ?? []).map(toApiPayment);
  const date = String(row.date).split('T')[0];

  return buildTransaction({
    id: row.id,
    date,
    customerName: row.customerName ?? null,
    items,
    discounts,
    payments,
  });
}
