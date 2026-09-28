import { asc, eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { payments, transactions } from '../../src/db/schema.js';
import { ApiError, json, respondError } from '../_lib/errors.js';
import { toApiPayment } from '../_lib/transactions.js';
import {
  generateId,
  optionalText,
  readJsonObject,
  requireInt,
  requireText,
  requireTimestamp,
} from '../_lib/validate.js';

export async function GET(): Promise<Response> {
  try {
    const rows = await db.query.payments.findMany({ orderBy: [asc(payments.paymentDate)] });
    return json(rows.map(toApiPayment));
  } catch (err) {
    return respondError(err);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonObject(request);

    const transactionId = requireText(body.transactionId, 'transactionId', 100);
    const amount = requireInt(body.amount, 'amount', 1, 'Nominal pembayaran harus lebih dari 0.');
    const paymentDate = body.paymentDate === undefined ? new Date() : requireTimestamp(body.paymentDate, 'paymentDate');
    const note = optionalText(body.note, 'note', 500);

    const parent = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.id, transactionId));
    if (parent.length === 0) throw new ApiError(404, 'Transaksi tidak ditemukan.');

    const row = {
      id: generateId('pay'),
      transactionId,
      amount,
      paymentDate,
      note,
    };
    await db.insert(payments).values(row);

    return json(toApiPayment({ ...row, paymentDate: paymentDate.toISOString() }), 201);
  } catch (err) {
    return respondError(err);
  }
}
