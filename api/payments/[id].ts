import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { payments } from '../../src/db/schema.js';
import { ApiError, json, noContent, respondError } from '../_lib/errors.js';
import { toApiPayment } from '../_lib/transactions.js';
import { optionalText, pathId, readJsonObject, requireInt, requireTimestamp } from '../_lib/validate.js';

export async function PATCH(request: Request): Promise<Response> {
  try {
    const id = pathId(request);
    const body = await readJsonObject(request);

    const values: { amount?: number; paymentDate?: Date; note?: string | null } = {};
    if (body.amount !== undefined) {
      values.amount = requireInt(body.amount, 'amount', 1, 'Nominal pembayaran harus lebih dari 0.');
    }
    if (body.paymentDate !== undefined) values.paymentDate = requireTimestamp(body.paymentDate, 'paymentDate');
    if (body.note !== undefined) values.note = optionalText(body.note, 'note', 500);

    if (values.amount === undefined && values.paymentDate === undefined && values.note === undefined) {
      throw new ApiError(400, 'Tidak ada field yang dapat diperbarui.');
    }

    const updated = await db
      .update(payments)
      .set(values)
      .where(eq(payments.id, id))
      .returning({
        id: payments.id,
        transactionId: payments.transactionId,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        note: payments.note,
      });

    if (updated.length === 0) throw new ApiError(404, 'Pembayaran tidak ditemukan.');

    return json(toApiPayment(updated[0]));
  } catch (err) {
    return respondError(err);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const id = pathId(request);

    const deleted = await db
      .delete(payments)
      .where(eq(payments.id, id))
      .returning({ id: payments.id });

    if (deleted.length === 0) throw new ApiError(404, 'Pembayaran tidak ditemukan.');

    return noContent();
  } catch (err) {
    return respondError(err);
  }
}
