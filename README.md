<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9b9a3cb7-76f4-4598-8ebd-047feee6b1e0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Database: Neon + Drizzle

Layer database (tahap migrasi InsForge → Neon PostgreSQL):

- `src/db/schema.ts` — skema relasional: `products`, `transactions`, `transaction_items`, `discounts`, `payments`.
- `src/db/index.ts` — koneksi server-side (`@neondatabase/serverless` + Drizzle). Membaca `process.env.DATABASE_URL`.
- `drizzle.config.ts` — konfigurasi drizzle-kit, membaca `.env.local` lalu `.env`.
- `drizzle/` — file migration SQL.

### Setup

1. Isi `DATABASE_URL` (connection string Neon) di `.env.local`. Jangan memakai prefix `VITE_`.
2. Setelah mengubah schema, buat migration:
   `npm run db:generate`
3. Jalankan migration ke database (butuh `DATABASE_URL`):
   `npm run db:migrate`

`npm run db:migrate` hanya menjalankan file di `drizzle/` dan bersifat non-destructive (tidak ada `DROP TABLE`, tidak ada reset database).

### Aturan credential

- `DATABASE_URL` hanya untuk kode server-side. Jangan pernah dibaca dari React component atau dibundel ke browser.
- `.env.local` tidak di-commit (sudah masuk `.gitignore`). `.env.example` hanya berisi placeholder kosong.
