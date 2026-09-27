import { eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { db } from '../../src/db/index.ts';
import {
  discounts as discountsTable,
  payments as paymentsTable,
  transactionItems,
  transactions,
} from '../../src/db/schema.ts';
import { ApiError, json, noContent, respondError } from '../_lib/errors.ts';
import { assertProductsExist, findTransactionRow } from '../_lib/store.ts';
import {
  parseDate,
  parseDiscounts,
  parseItems,
  parsePayments,
  toApiTransaction,
} from '../_lib/transactions.ts';
import { generateId, pathId, readJsonObject } from '../_lib/validate.ts';

export async function PATCH(request: Request): Promise<Response> {
  try {
    const id = pathId(request);
    const body = await readJsonObject(request);

    const date = body.date === undefined ? undefined : parseDate(body.date);
    const items = body.items === undefined ? undefined : parseItems(body.items);
    const discounts = body.discounts === undefined ? undefined : parseDiscounts(body.discounts);
    const payments = body.payments === undefined ? undefined : parsePayments(body.payments, id);

    if (date === undefined && items === undefined && discounts === undefined && payments === undefined) {
      throw new ApiError(400, 'Tidak ada field yang dapat diperbarui.');
    }
    if (body.paidAmount !== undefined && body.payments === undefined) {
      throw new ApiError(400, 'paidAmount adalah field turunan. Kirim array payments untuk mengubah pembayaran.');
    }

    const existing = await findTransactionRow(id);
    if (existing === null) throw new ApiError(404, 'Transaksi tidak ditemukan.');
    if (items !== undefined) await assertProductsExist(items);

    const statements: BatchItem<'pg'>[] = [];
    if (date !== undefined) {
      statements.push(db.update(transactions).set({ date }).where(eq(transactions.id, id)));
    }
    if (items !== undefined) {
      statements.push(db.delete(transactionItems).where(eq(transactionItems.transactionId, id)));
      for (const item of items) {
        statements.push(
          db.insert(transactionItems).values({
            id: generateId('ti'),
            transactionId: id,
            productId: item.productId,
            productNameSnapshot: item.productName,
            quantity: item.quantity,
            priceAtSale: item.priceAtSale,
          }),
        );
      }
    }
    if (discounts !== undefined) {
      statements.push(db.delete(discountsTable).where(eq(discountsTable.transactionId, id)));
      for (const discount of discounts) {
        statements.push(
          db.insert(discountsTable).values({
            id: discount.id,
            transactionId: id,
            description: discount.description,
            amount: discount.amount,
          }),
        );
      }
    }
    if (payments !== undefined) {
      statements.push(db.delete(paymentsTable).where(eq(paymentsTable.transactionId, id)));
      for (const payment of payments) {
        statements.push(
          db.insert(paymentsTable).values({
            id: payment.id,
            transactionId: id,
            amount: payment.amount,
            paymentDate: new Date(payment.paymentDate),
            note: payment.note,
          }),
        );
      }
    }

    const [firstStatement, ...restStatements] = statements;
    if (firstStatement === undefined) throw new ApiError(400, 'Tidak ada field yang dapat diperbarui.');
    await db.batch([firstStatement, ...restStatements]);

    const updated = await findTransactionRow(id);
    if (updated === null) throw new ApiError(404, 'Transaksi tidak ditemukan.');

    return json(toApiTransaction(updated));
  } catch (err) {
    return respondError(err);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const id = pathId(request);

    const deleted = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning({ id: transactions.id });

    if (deleted.length === 0) throw new ApiError(404, 'Transaksi tidak ditemukan.');

    return noContent();
  } catch (err) {
    return respondError(err);
  }
}
