# Posyandu Digital

Aplikasi pencatatan imunisasi balita. UI React (Vite) + API Node. Data disimpan di Google Sheets milik Anda.

## Prasyarat

- Node.js 20 atau lebih baru (`node -v`)
- Akun Google
- Proyek Google Cloud dengan **Google Sheets API** enabled

## 1. Clone

```bash
git clone https://github.com/muhyusuf31301/posyandu-imunisasi.git
cd posyandu-imunisasi
npm install
```

## 2. Google Cloud + service account

1. Buat project di https://console.cloud.google.com
2. APIs & Services → Enable **Google Sheets API**
3. IAM & Admin → Service Accounts → Create (`posyandu-sheets`)
4. Keys → Add key → JSON. Simpan file itu **di luar repo**. Jangan commit.
5. Catat `client_email` dan `private_key` dari JSON.

## 3. Spreadsheet

1. Buat Google Spreadsheet baru.
2. Rename tab pertama menjadi `Ibu`. Baris 1 (header): `NIK | Nama | Phone | Alamat | CreatedAt` (lihat `templates/ibu.csv`).
3. Tambah tab `Anak`. Baris 1: `NIK_Ibu | Nama | DOB | Gender | Vaccines | CreatedAt | UpdatedAt | _compositeKey` (lihat `templates/anak.csv`).
4. Share spreadsheet ke `client_email` service account, role **Editor**.
5. Copy ID dari URL: `https://docs.google.com/spreadsheets/d/<GOOGLE_SHEETS_ID>/edit`

## 4. Env

```bash
cp .env.example .env
```

Isi `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`. Private key harus dalam tanda kutip; newline ditulis `\n`.

Daftar posyandu (nama/jadwal) diedit di `src/data/posyandu.json`.

## 5. Jalankan

```bash
npm test
npm run dev
```

Buka URL Vite yang tercetak (biasanya `http://localhost:5173`). Login = pilih posyandu, lalu data ibu/anak harus muncul dari **sheet Anda** (kosong jika baru).

## API (same origin)

| Method | Path | Body |
|--------|------|------|
| GET | `/api/posyandu/data` | — |
| POST | `/api/posyandu/ibu` | `{ name, nik, phone, alamat, createdAt }` |
| POST | `/api/posyandu/anak` | `{ nikIbu, name, dob, gender, vaccines, createdAt, originalName? }` |
| POST | `/api/posyandu/delete-ibu` | `{ nik }` |
| POST | `/api/posyandu/delete-anak` | `{ nikIbu, name }` |

## Deploy Vercel

1. Import repo. Root = folder ini.
2. Environment Variables (Production **dan** Preview): sama seperti `.env` (tanpa `PORT`).
3. Build command: `npm run build`. Output: `dist`.
4. Jangan set `VITE_*` untuk sheet/key — itu rahasia server.

## Keamanan

- Jangan commit `.env` atau JSON service account.
- API ini **belum** ada login. Siapa pun yang tahu URL deploy bisa baca/tulis sheet. Untuk produksi publik, taruh di jaringan terbatas atau tambah autentikasi.
- Tulisan ke Sheets memakai `RAW` supaya nilai yang diawali `=` tidak jadi formula.

## Bukan bagian dari app

n8n tidak dipakai.
