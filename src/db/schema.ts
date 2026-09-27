import { relations } from 'drizzle-orm';
import { bigint, date, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: bigint('price', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  date: date('date', { mode: 'string' }).notNull(),
  customerName: text('customer_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const transactionItems = pgTable(
  'transaction_items',
  {
    id: text('id').primaryKey(),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    productNameSnapshot: text('product_name_snapshot').notNull(),
    quantity: integer('quantity').notNull(),
    priceAtSale: bigint('price_at_sale', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('transaction_items_transaction_id_idx').on(table.transactionId),
    index('transaction_items_product_id_idx').on(table.productId),
  ],
);

export const discounts = pgTable(
  'discounts',
  {
    id: text('id').primaryKey(),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
  },
  (table) => [index('discounts_transaction_id_idx').on(table.transactionId)],
);

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
    note: text('note'),
  },
  (table) => [index('payments_transaction_id_idx').on(table.transactionId)],
);

export const productsRelations = relations(products, ({ many }) => ({
  items: many(transactionItems),
}));

export const transactionsRelations = relations(transactions, ({ many }) => ({
  items: many(transactionItems),
  discounts: many(discounts),
  payments: many(payments),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

export const discountsRelations = relations(discounts, ({ one }) => ({
  transaction: one(transactions, {
    fields: [discounts.transactionId],
    references: [transactions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  transaction: one(transactions, {
    fields: [payments.transactionId],
    references: [transactions.id],
  }),
}));
