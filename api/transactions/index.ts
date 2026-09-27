import { db } from '../../src/db/index.ts';
import {
  discounts as discountsTable,
  payments as paymentsTable,
  transactionItems,
  transactions,
} from '../../src/db/schema.ts';
import { ApiError, json, respondError } from '../_lib/errors.ts';
import { assertProductsExist, listTransactionRows } from '../_lib/store.ts';
import {
  buildTransaction,
  parseCustomerName,
  parseDiscounts,
  parseDate,
  parseItems,
  parsePayments,
  toApiTransaction,
} from '../_lib/transactions.ts';
import { generateId, readJsonObject, requireInt, requireText } from '../_lib/validate.ts';

export async function GET(): Promise<Response> {
  try {
    const rows = await listTransactionRows();
    return json(rows.map(toApiTransaction));
  } catch (err) {
    return respondError(err);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonObject(request);

    const id = body.id === undefined ? generateId('tr') : requireText(body.id, 'id', 100);
    const date = parseDate(body.date);
    const customerName = parseCustomerName(body.customerName);
    const items = parseItems(body.items);
    const discounts = body.discounts === undefined ? [] : parseDiscounts(body.discounts);

    let payments = body.payments === undefined ? [] : parsePayments(body.payments, id);
    const paidAmount = body.paidAmount === undefined
      ? 0
      : requireInt(body.paidAmount, 'paidAmount', 0, 'paidAmount tidak boleh negatif.');

    if (body.payments !== undefined) {
      const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (paymentsTotal !== paidAmount && body.paidAmount !== undefined) {
        throw new ApiError(400, 'paidAmount tidak sama dengan total payments.');
      }
    } else if (paidAmount > 0) {
      payments = [{
        id: generateId('pay'),
        transactionId: id,
        amount: paidAmount,
        paymentDate: new Date().toISOString(),
        note: null,
      }];
    }

    await assertProductsExist(items);

    const statements = [
      db.insert(transactions).values({ id, date, customerName }),
      ...items.map((item) =>
        db.insert(transactionItems).values({
          id: generateId('ti'),
          transactionId: id,
          productId: item.productId,
          productNameSnapshot: item.productName,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
        }),
      ),
      ...discounts.map((discount) =>
        db.insert(discountsTable).values({
          id: discount.id,
          transactionId: id,
          description: discount.description,
          amount: discount.amount,
        }),
      ),
      ...payments.map((payment) =>
        db.insert(paymentsTable).values({
          id: payment.id,
          transactionId: id,
          amount: payment.amount,
          paymentDate: new Date(payment.paymentDate),
          note: payment.note,
        }),
      ),
    ];

    const [firstStatement, ...restStatements] = statements;
    await db.batch([firstStatement, ...restStatements]);

    return json(buildTransaction({ id, date, customerName, items, discounts, payments }), 201);
  } catch (err) {
    return respondError(err);
  }
}
