import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../src/db/index.ts';
import { products, transactions } from '../../src/db/schema.ts';
import { ApiError } from './errors.ts';
import type { ApiItem, TransactionRow } from './transactions.ts';

const relationConfig = {
  with: { items: true, discounts: true, payments: true },
} as const;

export async function listTransactionRows(): Promise<TransactionRow[]> {
  const rows = await db.query.transactions.findMany({
    ...relationConfig,
    orderBy: [desc(transactions.createdAt)],
  });
  return rows;
}

export async function findTransactionRow(id: string): Promise<TransactionRow | null> {
  const rows = await db.query.transactions.findMany({
    ...relationConfig,
    where: eq(transactions.id, id),
  });
  if (rows.length === 0) return null;
  return rows[0];
}

export async function assertProductsExist(items: ApiItem[]): Promise<void> {
  const ids = [...new Set(items.map((item) => item.productId))];
  const found = await db.select({ id: products.id }).from(products).where(inArray(products.id, ids));
  if (found.length !== ids.length) {
    throw new ApiError(400, 'Ada item transaksi yang merujuk produk tidak ditemukan.');
  }
}
