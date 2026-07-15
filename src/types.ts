export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface Discount {
  id: string;
  description: string;
  amount: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

export interface Transaction {
  id: string;
  date: string; // format: YYYY-MM-DD
  items: TransactionItem[]; // Multiple items instead of single product
  discounts: Discount[];
  paidAmount: number;
  totalProductPrice: number; // sum of all items' (quantity * priceAtSale)
  totalDiscountAmount: number; // sum of discounts
  totalBill: number; // totalProductPrice - totalDiscountAmount
  debtAmount: number; // totalBill - paidAmount (Sisa Hutang)
}

export type ViewType = 'dashboard' | 'transaksi' | 'produk' | 'laporan';
export type ThemeType = 'light' | 'dark';
