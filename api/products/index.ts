import { asc } from 'drizzle-orm';
import { db } from '../../src/db/index.ts';
import { products } from '../../src/db/schema.ts';
import { json, respondError } from '../_lib/errors.ts';
import { readJsonObject, requireInt, requireText } from '../_lib/validate.ts';

interface ProductRow {
  id: string;
  name: string;
  price: number;
  createdAt: Date | string;
}

function toProduct(row: ProductRow) {
  const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt;
  return { id: row.id, name: row.name, price: row.price, createdAt };
}

export async function GET(): Promise<Response> {
  try {
    const rows = await db.query.products.findMany({ orderBy: [asc(products.createdAt)] });
    return json(rows.map(toProduct));
  } catch (err) {
    return respondError(err);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonObject(request);
    const id = requireText(body.id, 'id', 100);
    const name = requireText(body.name, 'name', 200);
    const price = requireInt(body.price, 'price', 0, 'price tidak boleh negatif.');

    const inserted = await db
      .insert(products)
      .values({ id, name, price })
      .returning({
        id: products.id,
        name: products.name,
        price: products.price,
        createdAt: products.createdAt,
      });

    return json(toProduct(inserted[0]), 201);
  } catch (err) {
    return respondError(err);
  }
}
