import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { products } from '../../src/db/schema.js';
import { ApiError, dbErrorCode, json, noContent, respondError } from '../_lib/errors.js';
import { pathId, readJsonObject, requireInt, requireText } from '../_lib/validate.js';

export async function PATCH(request: Request): Promise<Response> {
  try {
    const id = pathId(request);
    const body = await readJsonObject(request);

    const values: { name?: string; price?: number } = {};
    if (body.name !== undefined) values.name = requireText(body.name, 'name', 200);
    if (body.price !== undefined) {
      values.price = requireInt(body.price, 'price', 0, 'price tidak boleh negatif.');
    }
    if (values.name === undefined && values.price === undefined) {
      throw new ApiError(400, 'Tidak ada field yang dapat diperbarui.');
    }

    const updated = await db
      .update(products)
      .set(values)
      .where(eq(products.id, id))
      .returning({
        id: products.id,
        name: products.name,
        price: products.price,
        createdAt: products.createdAt,
      });

    if (updated.length === 0) throw new ApiError(404, 'Produk tidak ditemukan.');

    return json(updated[0]);
  } catch (err) {
    return respondError(err);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const id = pathId(request);

    const deleted = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (deleted.length === 0) throw new ApiError(404, 'Produk tidak ditemukan.');

    return noContent();
  } catch (err) {
    if ((dbErrorCode(err) ?? '').startsWith('23')) {
      return json({ error: 'Produk masih digunakan pada riwayat transaksi dan tidak dapat dihapus.' }, 409);
    }
    return respondError(err);
  }
}
