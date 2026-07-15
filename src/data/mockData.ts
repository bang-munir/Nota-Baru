import { Product, Transaction } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p-1', name: 'Laptop ASUS ZenBook OLED', price: 15500000 },
  { id: 'p-2', name: 'Monitor LG 24" UltraFine IPS', price: 2350000 },
  { id: 'p-3', name: 'Keyboard Mechanical Keychron K2', price: 1650000 },
  { id: 'p-4', name: 'Mouse Wireless Logitech MX Master 3S', price: 1750000 },
  { id: 'p-5', name: 'SSD Samsung 990 PRO NVMe 1TB', price: 1950000 },
  { id: 'p-6', name: 'Router ASUS RT-AX55 Wi-Fi 6', price: 950000 }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tr-101',
    date: '2026-07-14', // Hari ini
    items: [
      { productId: 'p-1', productName: 'Laptop ASUS ZenBook OLED', quantity: 1, priceAtSale: 15500000 }
    ],
    discounts: [
      { id: 'd-1', description: 'Diskon Soft Launching', amount: 500000 },
      { id: 'd-2', description: 'Kupon Cashback Toko', amount: 200000 }
    ],
    paidAmount: 12000000,
    totalProductPrice: 15500000,
    totalDiscountAmount: 700000,
    totalBill: 14800000,
    debtAmount: 2800000
  },
  {
    id: 'tr-102',
    date: '2026-07-13', // Kemarin
    items: [
      { productId: 'p-2', productName: 'Monitor LG 24" UltraFine IPS', quantity: 2, priceAtSale: 2350000 }
    ],
    discounts: [
      { id: 'd-3', description: 'Potongan Pembelian Bundling', amount: 250000 }
    ],
    paidAmount: 4450000, // Lunas
    totalProductPrice: 4700000,
    totalDiscountAmount: 250000,
    totalBill: 4450000,
    debtAmount: 0
  },
  {
    id: 'tr-103',
    date: '2026-07-10', // Minggu ini
    items: [
      { productId: 'p-5', productName: 'SSD Samsung 990 PRO NVMe 1TB', quantity: 5, priceAtSale: 1950000 }
    ],
    discounts: [
      { id: 'd-4', description: 'Diskon Grosir Instansi', amount: 750000 }
    ],
    paidAmount: 6000000,
    totalProductPrice: 9750000,
    totalDiscountAmount: 750000,
    totalBill: 9000000,
    debtAmount: 3000000
  },
  {
    id: 'tr-104',
    date: '2026-07-02', // Bulan ini
    items: [
      { productId: 'p-3', productName: 'Keyboard Mechanical Keychron K2', quantity: 1, priceAtSale: 1650000 }
    ],
    discounts: [],
    paidAmount: 1650000, // Lunas
    totalProductPrice: 1650000,
    totalDiscountAmount: 0,
    totalBill: 1650000,
    debtAmount: 0
  },
  {
    id: 'tr-105',
    date: '2026-06-25', // Bulan lalu
    items: [
      { productId: 'p-4', productName: 'Mouse Wireless Logitech MX Master 3S', quantity: 3, priceAtSale: 1750000 }
    ],
    discounts: [
      { id: 'd-5', description: 'Diskon Loyalitas Member', amount: 300000 }
    ],
    paidAmount: 3500000,
    totalProductPrice: 5250000,
    totalDiscountAmount: 300000,
    totalBill: 4950000,
    debtAmount: 1450000
  },
  {
    id: 'tr-106',
    date: '2026-05-15', // Beberapa bulan lalu
    items: [
      { productId: 'p-1', productName: 'Laptop ASUS ZenBook OLED', quantity: 2, priceAtSale: 15500000 }
    ],
    discounts: [
      { id: 'd-6', description: 'Bonus Potongan Khusus', amount: 1500000 }
    ],
    paidAmount: 29500000, // Lunas
    totalProductPrice: 31000000,
    totalDiscountAmount: 1500000,
    totalBill: 29500000,
    debtAmount: 0
  }
];
